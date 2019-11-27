const util = require('./util')
const Twitter = require('twitter');

var fs = require('fs');
var token = JSON.parse(fs.readFileSync('twitter_token.json', 'utf8'));

const client = new Twitter(token);

exports.getFollowing = ({count=200, since_id=undefined, max_id=undefined}={}) => {
  /**
   * フォローしているユーザー一覧を取得する
   * @param {number} count 取得する件数
   */
  return new Promise((resolve, reject) => {
    const params = {count: count, since_id: since_id, max_id: max_id};
    client.get('friends/list', params, (error, data, response) => {
      if (!error) {
        resolve(data.users)
      } else {
        reject(error)
      }
    })
  })
}

exports.getFavorites = ({count=10, since_id=undefined, max_id=undefined}={}) => {
  /**
   * いいね一覧を取得する
   * @param {number} count 取得する件数 
   */
  return new Promise((resolve, reject) => {
    const params = {count: count, since_id: since_id, max_id: max_id}
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
  if (fav.length === 0 | oldestId === params.max_id) {
    return favorites
  } else {
    try {
      params.max_id = oldestId;
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
  const params = {count: 200}
  return await getAllFavoritesSub([], params)
}

exports.getFavoritesFilteredByUserIds = async (userIds) => {
  /**
   * いいねの中から、指定されたユーザーIDのtweetのみを取得する
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