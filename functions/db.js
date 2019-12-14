const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('./util');
// admin.initializeApp(functions.config().firebase);

var serviceAccount = require("./firebase_credential.json");
var defaultApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://buzz-recipe-viewer-dev.firebaseio.com"
});


let db = admin.firestore();

exports.getFollowings = async (screen_name) => {
  const folRef = db.collection("users")
    .doc(screen_name).collection("followings");
  const followings = []
  const querySnapshot = await folRef.get();
  querySnapshot.forEach(doc => {
    followings.push(doc.data());
  });
}

exports.deleteFollowings = async (screen_name, followings) => {
  await delOrAddFollowings(screen_name, followings, "delete");
}

exports.addFollowings = async (screen_name, followings) => {
  await delOrAddFollowings(screen_name, followings, "add")
}

delOrAddFollowings = async (screen_name, followings, operation) => {
  const folRef = db.collection("users")
    .doc(screen_name).collection("followings");

  if (operation === "delete") {
    await delOrAddFollowingsSub(folRef, followings, 50, 0, "delete");
  } else if (operation === "add") {
    await delOrAddFollowingsSub(folRef, followings, 50, 0, "add");
  } else {
    throw new Error("operation must be either `delete` or `add`.");
  }
}

delOrAddFollowingsSub = async (
  folRef, followings, batchSize, startIndex, operation) => 
{
  const batch = db.batch();
  const endIndex = startIndex + batchSize;
  const folSub = followings.slice(startIndex, endIndex);
  if (folSub.length === 0) {
    return
  }
  folSub.forEach(user => {
    const userRef = folRef.doc(user.id_str);
    if (operation === "delete") {
      batch.delete(userRef);
    } else {
      batch.set(userRef, user);
    }
  });
  await batch.commit();
  delOrAddFollowingsSub(folRef, followings, batchSize, endIndex, operation);
}

exports.createLog = async (screen_name, collection_name, error) => {
  const success = error ? false : true;
  const logRef = db.collection("log")
  const dateTime = util.getNowDateStr();
  await logRef.doc(dateTime).set({
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    success: success,
    error: error,
    twitter_screen_name: screen_name,
    collection_name: collection_name
  })
}

/**************************/

exports.getCookDevInds = () => {
  /**
   * Fetch cook developer account indices.
   * TODO
   */
  // console.log('get cook dev inds: 暫定版');
  const inds = [
    167256483,  // ラク速レシピのゆかり
    2689624878,  // つくりおき食堂まりえ
    978953997443776500,  // 山本ゆり
    423644055  // リュウジ
  ];
  return inds;
}

exports.getFavorites = () => {
  /**
   * DB内のすべてのお気に入りツイートを取得する
   */
  // throw new Error('not implemented.');
  return [];
}

exports.updateAll = async (favorites) => {
  /**
   * DB内の全お気に入りを所与のデータで更新する
   * @param {array} favorites このお気に入りデータで置換する
   */
  const favCollectionRef = db.collection('favorites');
  const promises = [];
  favorites.forEach(fav => {
    promises.push(favCollectionRef.doc(fav.id_str).set(fav));
  });
  await Promise.all(promises);
}

exports.updateFollowings = async (followings) => {
  /**
   * DB内の全フォローしているユーザーを更新する
   */
  const followingRef = db.collection('followings');
  const promises = [];
  followings.forEach(user => {
    promises.push(followingRef.doc(user.id_str).set(user));
  });
  await Promise.all(promises);
}