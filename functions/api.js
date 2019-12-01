const util = require('./util')
const Twitter = require('twitter');

const token = require('./twitter_token');
const client = new Twitter(token.token);

exports.getFollowing = ({count=10, cursor=-1}={}) => {
  /**
   * フォローしているユーザー一覧を取得する
   * @param {number} count 取得する件数
   */
  return new Promise((resolve, reject) => {
    const params = {count: count, cursor: cursor};
    client.get('friends/list', params, (error, data, response) => {
      if (!error) {
        resolve(data)
      } else {
        reject(error)
      }
    })
  })
}

exports.getFavorites = ({count=10, since_id=undefined, max_id=undefined, include_entities=true}={}) => {
  /**
   * いいね一覧を取得する
   * @param {number} count 取得する件数 
   */
  return new Promise((resolve, reject) => {
    const params = {count: count, since_id: since_id, max_id: max_id, include_entities: include_entities}
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
  const oldestId = util.getOldestTweetId(fav);
  if (fav.length === 0 | oldestId == params.max_id) {
    return favorites
  } else {
    try {
      params.max_id = oldestId.toString();
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

exports.getAllFavorites = async () => {
  /**
   * Twitter APIで取得可能なすべてのいいねを取得する
   */
  const params = {count: 200, include_entities: true};
  return await getAllFavoritesSub([], params)
}

getAllFollowingSub = async (users, params) => {
  const res = await exports.getFollowing(params);
  const resUsers = res.users;
  const nextCursor = BigInt(res.next_cursor_str);
  const previousCursor = BigInt(res.previous_cursor_str);
  if (nextCursor === 0n) {
    return users.concat(resUsers);
  } else {
    try {
      params.cursor = nextCursor.toString();
      return await getAllFollowingSub(users.concat(resUsers), params)
    } catch (error) {
      console.log('failed to fetch all following users. your account may have too many favorites.')
      throw error
    }
  }
}

exports.getAllFollowing = async () => {
  const params = {count: 200, cursor: -1};
  return await getAllFollowingSub([], params)
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