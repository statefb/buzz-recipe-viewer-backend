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

exports.getFollowings = async (user_id) => {
  const folRef = db.collection("users")
    .doc(user_id).collection("followings");
  const followings = []
  const querySnapshot = await folRef.get();
  querySnapshot.forEach(doc => {
    followings.push(doc.data());
  });
  return followings;
}

exports.getFavorites = async (user_id) => {
  const favRef = db.collection("users")
    .doc(user_id).collection("favorites");
  const favorites = [];
  const snapshot = await favRef.get();
  snapshot.forEach(doc => {
    favorites.push(doc.data());
  });
  return favorites;
}

exports.deleteFollowings = async (user_id, followings) => {
  await delOrAddObjects(user_id, followings, "delete", "followings");
}

exports.addFollowings = async (user_id, followings) => {
  await delOrAddObjects(user_id, followings, "add", "followings")
}

exports.deleteFavorites = async (user_id, favorites) => {
  await delOrAddObjects(user_id, favorites, "delete", "favorites");
}

exports.addFavorites = async (user_id, favorites) => {
  await delOrAddObjects(user_id, favorites, "add", "favorites");
}

delOrAddObjects = async (user_id, objects, operation, collectionName) => {
  const batchSize = 50;
  const ref = db.collection("users")
    .doc(user_id).collection(collectionName);

  if (operation === "delete") {
    await delOrAddSub(ref, objects, batchSize, 0, "delete");
  } else if (operation === "add") {
    await delOrAddSub(ref, objects, batchSize, 0, "add");
  } else {
    throw new Error("operation must be either `delete` or `add`.");
  }
}

delOrAddSub = async (
  ref, objects, batchSize, startIndex, operation) => 
{
  const batch = db.batch();
  const endIndex = startIndex + batchSize;
  const objectsSub = objects.slice(startIndex, endIndex);
  if (objectsSub.length === 0) {
    return
  }
  objectsSub.forEach(obj => {
    const objRef = ref.doc(obj.id_str);
    if (operation === "delete") {
      batch.delete(objRef);
    } else {
      obj.createdAt = admin.firestore.FieldValue.serverTimestamp();
      batch.set(objRef, obj);
    }
  });
  await batch.commit();
  delOrAddSub(ref, objects, batchSize, endIndex, operation);
}

exports.createLog = async (user_id, collection_name, error) => {
  const success = error ? false : true;
  const logRef = db.collection("log")
  const dateTime = util.getNowDateStr();
  try {
    await logRef.doc(dateTime).set({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      success: success,
      error: error,
      twitter_user_id: user_id,
      collection_name: collection_name
    });  
  } catch (err) {
    console.log("failed to set log.")
    console.log(err);
  }
}

exports.changeSubscribeStatus = async (user_id, twitter_user_id, toSubscribe) => {
  /**
   * @param {number} user_id TweetRecipeのユーザーID
   * @param {number} twitter_user_id 購読対象のtwitterユーザーID
   * @param {bool} toSubscribe 購読する場合はtrue, 解除の場合はfalse
   */
  const folRef = db.collection("users")
    .doc(user_id).collection("followings");
  try {
    await folRef.doc(twitter_user_id).update({
      subscribe: toSubscribe
    })
  } catch (error) {
    console.log("failed to update subscribe status.")
    console.log(error)
    await db.createLog(user_id, "followings", error);
  }
}

