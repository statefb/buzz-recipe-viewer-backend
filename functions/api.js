const bigInt = require("big-integer")
const util = require('./util')
const Twitter = require('twitter');

const token = require('./twitter_token');
const client = new Twitter(token.token);

exports.getFollowings = ({user_id, count=10, cursor=-1}={}) => {
  /**
   * フォローしているユーザー一覧を取得する
   * @param {number} count 取得する件数
   */
  return new Promise((resolve, reject) => {
    const params = {user_id: user_id, count: count, cursor: cursor};
    client.get('friends/list', params, (error, data, response) => {
      if (!error) {
        resolve(data)
      } else {
        reject(error)
      }
    })
  })
}

exports.getFavorites = ({user_id, count=10, since_id=undefined, max_id=undefined, include_entities=true}={}) => {
  /**
   * いいね一覧を取得する
   * @param {number} count 取得する件数 
   */
  return new Promise((resolve, reject) => {
    const params = {user_id: user_id, count: count, since_id: since_id, max_id: max_id, include_entities: include_entities}
    params.tweet_mode = "extended";
    client.get('favorites/list', params, (error, data, response) => {
      if (!error) {
        resolve(data)
      } else {
        reject(error)
      }
    })
  })
}

getAllFavoritesSub = async (favorites, params) => {
  /**
   * Twitter APIで取得可能なすべてのいいねを取得するコア処理
   */
  const fav = await exports.getFavorites(params);
  // compress all user obj
  for (let index = 0; index < fav.length; index++) {
    const tweet = fav[index];
    fav[index].user = util.compressUserObj(tweet.user);
  }
  const oldestIdStr = util.getOldestTweetIdStr(fav);
  if (fav.length === 0 | oldestIdStr === params.max_id) {
    return favorites
  } else {
    try {
      params.max_id = oldestIdStr;
      return await getAllFavoritesSub(favorites.concat(fav), params);
    } catch (error) {
      // Twitter API制限：75 calls per 15 minutes (ver 1.1)
      // https://developer.twitter.com/en/docs/tweets/post-and-engage/api-reference/get-favorites-list
      // NOTE: 取得できるところまで取得してリターンした方が良いかも？
      console.log('failed to fetch all favorites. your account may have too many favorites.')
      throw error
    }
  }
}

exports.getAllFavorites = async (user_id) => {
  /**
   * Twitter APIで取得可能なすべてのいいねを取得する
   */
  const params = {user_id: user_id, count: 200, include_entities: true};
  return await getAllFavoritesSub([], params)
}

getAllFollowingsSub = async (users, params) => {
  const res = await exports.getFollowings(params);
  const resUsers = util.compressMultiUserObj(res.users);
  const nextCursor = bigInt(res.next_cursor_str);
  const previousCursor = bigInt(res.previous_cursor_str);
  if (nextCursor.compare(bigInt(0)) === 0) {
    return users.concat(resUsers);
  } else {
    try {
      params.cursor = nextCursor.toString();
      return await getAllFollowingsSub(users.concat(resUsers), params)
    } catch (error) {
      console.log('failed to fetch all following users. your account may have too many favorites.')
      throw error
    }
  }
}

exports.getAllFollowings = async (user_id) => {
  const params = {user_id: user_id, count: 200, cursor: -1};
  return await getAllFollowingsSub([], params)
}

exports.getReplies = () => {
  /**
   * 特定のツイートに対する返信を取得する
   * 2020/1/27:
   *  search APIを使い実装を試みたものの、self replyを取得する方法がわからず…
   */
  return new Promise((resolve, reject) => {
    const params = {
      q: 'to:syunkon0507',
      // q: 'from:syunkon0507&@:syunkon0507',
      result_type: 'mixed',
      count: 100,
      since_id: "1218528879733661696",
      include_entities: false,
    };
    client.get('search/tweets', params, (error, data, response) => {
      if (!error) {
        const processedData = data.statuses
          .filter(tweet => {
            return tweet.in_reply_to_status_id_str === "1218528879733661696"
            // return tweet.in_reply_to_screen_name === 'syunkon0507'
          })
          // .filter(tweet => {
          //   return tweet.screen_name === 'syunkon0507'
          // })
          .sort((tweetA, tweetB) => {
            const tweetAId = bigInt(tweetA.id_str);
            const tweetBId = bigInt(tweetB.id_str);
            return tweetAId.compare(tweetBId);
          })
          .map(tweet => tweet.text)
        resolve(processedData)
      } else {
        reject(error)
      }
    })
  })
}

exports.getFavoritesFilteredByUserIds = async (userIds) => {
  /**
   * いいねの中から、指定されたユーザーIDのtweetのみを取得する
   * TODO: 削除予定
   */
  const favorites = await exports.getFavorites(count=100)
  const filteredFavorites = [];
  favorites.forEach(fav => {
    if (userIds.includes(fav.user.id)) {
      filteredFavorites.push(fav)
    }
  });
  return filteredFavorites;
}