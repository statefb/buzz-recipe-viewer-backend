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
  const dbFavPromise = db.getFavorites(user_id);
  const dbFloPromise = db.getFollowings(user_id);
  const twPromise = api.getAllFavorites(user_id);
  let dbFavorites, twFavorites, dbFollowings;
  try {
    [dbFavorites, twFavorites, dbFollowings] = await Promise
      .all([dbFavPromise, twPromise, dbFloPromise]);
  } catch (error) {
    console.log("failed to fetch favorites.")
    console.log(error)
    await db.createLog(user_id, "followings", error);
    return
  }

  // get subscribing user id_str
  const subscribingUserIds = dbFollowings
    .filter(user => user.subscribe)
    .map(user => user.id_str);

  // add new favorites filtered by `subscribe` with default status
  const addedFavorites = [];
  twFavorites.filter(tweet => {
    const dbFavoritesIds = dbFavorites.map(tweet => tweet.id_str);
    return !dbFavoritesIds.includes(tweet.id_str);
  }).filter(tweet => {
    // filter by subscribing
    return subscribingUserIds.includes(tweet.user.id_str);
  }).forEach(tweet => {
    tweet.tags = [
      tweet.user.name, tweet.user.screen_name
    ];  // default: name & screen name
    tweet.rate = 0;  // default: 0
    tweet.hide = false;  // default: false
    tweet.num_of_tags = 2;  // default: 2 (name & screen name)
    tweet.should_tag = true;  // default: should tag
    addedFavorites.push(tweet)
  });
  const addPromise = db.addFavorites(user_id, addedFavorites);

  // remove favorites which exists only db
  // and newer than oldest favorites from twitter
  const deledFavorites = dbFavorites.filter(tweet => {
    const twFavoritesIds = twFavorites.map(tweet => tweet.id_str);
    const oldestTweetId = bigInt(util.getOldestTweetIdStr(twFavorites));
    const isNewer = bigInt(tweet.id_str).compare(oldestTweetId) === 1;
    return isNewer
  }).filter(tweet => {
    // filter by not subscribing
    return !subscribingUserIds.includes(tweet.user.id_str);
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

