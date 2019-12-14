const bigInt= require("big-integer")
const api = require('./api')
const db = require('./db')
const util = require('./util')

exports.setFollowings = async (user_id) => {
  // get followings from db
  const dbPromise = db.getFollowings(user_id);
  const twPromise = api.getAllFollowings(user_id);
  let dbFollowings, twFollowings;
  try {
    [dbFollowings, twFollowings] = await Promise
      .all([dbPromise, twPromise]);
  } catch (error) {
    console.log("failed to fetch followings.")
    console.log(error)
    await db.createLog(user_id, "followings", error);
    return
  }

  // remove followings which exists only db
  const deledFollowings = dbFollowings.filter(user => {
    const twFollowingsIds = twFollowings.map(user => user.id_str);
    return !twFollowingsIds.includes(user.id_str)
  });
  const delPromise = db.deleteFollowings(user_id, deledFollowings);

  // add new followings with subscribe status
  const addedFollowings = [];
  twFollowings.filter(user => {
    const dbFollowingsIds = dbFollowings.map(user => user.id_str);
    return !dbFollowingsIds.includes(user.id_str)
  }).forEach(user => {
    user.subscribe = false;  // default: false
    addedFollowings.push(user);
  });
  const addPromise = db.addFollowings(user_id, addedFollowings);

  let err = ""
  try {
    await Promise.all([delPromise, addPromise]);
  } catch (error) {
    console.log("failed to DB operation.")
    console.log(error)
    err = error;
  } finally {
    await db.createLog(user_id, "followings", err);
  }
}

exports.setFavorites = async (user_id) => {
  // fetch data
  const dbPromise = db.getFavorites(user_id);
  const twPromise = api.getAllFavorites(user_id);
  let dbFavorites, twFavorites;
  try {
    [dbFavorites, twFavorites] = await Promise
      .all([dbPromise, twPromise]);
  } catch (error) {
    console.log("failed to fetch favorites.")
    console.log(error)
    await db.createLog(user_id, "followings", error);
    return
  }

  // add new favorites filtered by `subscribe` with default status
  // TODO: filter func by subscribe
  const addedFavorites = [];
  twFavorites.filter(tweet => {
    const dbFavoritesIds = dbFavorites.map(tweet => tweet.id_str);
    return !dbFavoritesIds.includes(tweet.id_str);
  }).forEach(tweet => {
    tweet.tag = [];  // default: empty
    tweet.rate = 0;  // default: 0
    tweet.hide = false;  // default: false
    addedFavorites.push(tweet)
  });
  const addPromise = db.addFavorites(user_id, addedFavorites);

  // remove favorites which exists only db
  // and newer than oldest favorites from twitter
  const deledFavorites = dbFavorites.filter(tweet => {
    const twFavoritesIds = twFavorites.map(tweet => tweet.id_str);
    const oldestTweetId = bigInt(util.oldestTweetIdStr(twFavorites));
    const isNewer = binInt(tweet.id_str).compare(oldestTweetId) === 1;
    return !twFavoritesIds.includes(tweet.id_str) & isNewer
  })
  const delPromise = db.deleteFavorites(user_id, deledFavorites);

  let err = ""
  try {
    await Promise.all([delPromise, addPromise]);
  } catch (error) {
    console.log("failed to DB operation.");
    console.log(error);
    err = error;
  } finally {
    await db.createLog(user_id, "favorites", err);
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

