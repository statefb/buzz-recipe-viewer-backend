const bigInt= require("big-integer")
const api = require('./api')
const db = require('./db')
const util = require('./util')

exports.update = async () => {
  /**
   * cron task (1 per 1 day)
   * NOTE: お気に入りのリストを返すのではなく、DBに反映をcron taskでやりたい
   * TODO: 
   *  - フィルタリングを、DB結合後に実施する
   *  - 全フォローユーザーの更新
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
  const oldestFavIdStr = util.getOldestTweetIdStr(filteredAllFavorites);
  const oldDbFavorites = [];
  dbFavorites.forEach(dbFav => {
    // CAUTION: compare test
    if (bigInt(oldestFavIdStr).compare(dbFav.id) === 0) {
      oldDbFavorites.push(dbFav);
    }
  });
  
  const favorites = filteredAllFavorites.concat(oldDbFavorites);
  // save to RealtimeDatabase
  // db.updateAll(favorites);
  return favorites;
}

exports.addFavorites = () => {
  /**
   * cron task (1 per 1 hour)
   */

}

