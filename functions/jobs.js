const api = require('./api')
const db = require('./db')
const util = require('./util')

exports.update = async () => {
  /**
   * cron task (1 per 1 day)
   * NOTE: お気に入りのリストを返すのではなく、DBに反映をcron taskでやりたい
   * TODO: フィルタリングを、DB結合後に実施する
   */
  // fetch all favorites using Twitter api.
  let allFavorites;
  try {
    allFavorites = await api.getAllFavorites();
  } catch (error) {
    // console.log('failed to fetch all favorites.');
    throw error
  }
  // filter by cooking developer account ids.
  const cookDevInds = db.getCookDevInds();
  const filteredAllFavorites = [];
  allFavorites.forEach(fav => {
    if (cookDevInds.includes(fav.user.id)) {
      filteredAllFavorites.push(fav)
    }
  });
  // replace all tweets on db newer than oldest all favorites.
  const dbFavorites = db.getFavorites()
  // get older favorites saved in DB than oldest favorites fetched from twitter.
  const oldestFavId = util.getOldestTweetId(filteredAllFavorites);
  const oldDbFavorites = [];
  dbFavorites.forEach(dbFav => {
    if (dbFav.id < oldestFavId) {
      oldDbFavorites.push(dbFav);
    }
  });
  
  const favorites = filteredAllFavorites.concat(oldDbFavorites);
  // save to RealtimeDatabase
  // db.updateAll(favorites);
  return favorites;
}

exports.collectFollowing = async () => {
  let users;
  try {
    users = await api.getAllFollowing();
  } catch (error) {
    throw error
  }
  return users;
}

exports.addFavorites = () => {
  /**
   * cron task (1 per 1 hour)
   */

}

