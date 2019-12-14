const bigInt= require("big-integer")
const api = require('./api')
const db = require('./db')
const util = require('./util')

exports.setFollowings = async (screen_name) => {
  // get followings from db
  // const dbPromise = db.getFollowings(screen_name);
  // const twPromise = api.getAllFollowings(screen_name);
  let dbFollowings, twFollowings;
  // try {
  //   [dbFollowings, twFollowings] = await Promise
  //     .all([dbPromise, twPromise]);
  // } catch (error) {
  //   console.log("failed to fetch followings.")
  //   await db.createLog(screen_name, "followings", error);
  //   return
  // }

  // DUMMY
  dbFollowings = [
    {id_str: "0", text: "a"}, {id_str: "1", text: "b"}
  ]
  twFollowings = [
    {id_str: "1", text: "b"}, {id_str: "2", text: "c"}, 
  ]

  // remove followings which exists only db
  const deledFollowings = dbFollowings.filter(user => {
    const twFollowingsIds = twFollowings.map(user => user.id_str);
    return !twFollowingsIds.includes(user.id_str)
  });
  const delPromise = db.deleteFollowings(screen_name, deledFollowings);

  // add new followings with subscribe status
  const addedFollowings = [];
  twFollowings.filter(user => {
    const dbFollowingsIds = dbFollowings.map(user => user.id_str);
    return !dbFollowingsIds.includes(user.id_str)
  }).forEach(user => {
    user.subscribe = false;  // default: false
    addedFollowings.push(user);
  });
  const addPromise = db.addFollowings(screen_name, addedFollowings);

  let err = ""
  try {
    await Promise.all([delPromise, addPromise]);
  } catch (error) {
    console.log("failed to DB operation.")
    console.log(error)
    err = error;
  } finally {
    await db.createLog(screen_name, "followings", err);
  }
}

/**************************/

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

