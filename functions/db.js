const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const util = require('./util');

var serviceAccount = require("./firebase_credential.json");
var defaultApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://buzz-recipe-viewer-dev.firebaseio.com"
});

let db = admin.firestore();
const BATCH_SIZE = 50;

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
  const batchSize = BATCH_SIZE;
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
  dateTime.toString();
  try {
    await logRef.doc(dateTime).set({
      createdAt: dateTime,
      success: success,
      error: error,
      twitter_user_id: user_id,
      collection_name: collection_name
    });  
  } catch (err) {
    console.log("failed to set log.")
    console.log({
      user_id: user_id,
      collection_name: collection_name,
      error: error
    });
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

exports.addTag = async (user_id, tweet_id, text) => {
  const twRef = db.collection("users")
    .doc(user_id).collection("favorites").doc(tweet_id);
  const doc = await twRef.get();
  const tag = doc.data().tag;
  if (tag.includes(text))
    return  // ignore duplicated
  tag.push(text);
  await twRef.update({tag: tag});
}

exports.deleteTag = async (user_id, tweet_id, text) => {
  const twRef = db.collection("users")
    .doc(user_id).collection("favorites").doc(tweet_id);
  const doc = await twRef.get();
  const tag = doc.data().tag;
  const idx = tag.findIndex(t => t === text);
  if (idx === 0) {
    tag.shift()
  } else {
    tag.splice(idx, idx);
  }
  await twRef.update({tag: tag});
}

exports.reflectTagsToRoot = async (tags, context, addOrRemove) => {
  const twitterUid = context.params.twitterUid;
  const docRef = db.collection("users").doc(twitterUid);
  if (addOrRemove === "add") {
    // add tags
    tags.forEach(async tag => {
      await docRef.update({
        tags: admin.firestore.FieldValue.arrayUnion(tag)
      });
    })
  } else {
    // remove tags
    tags.forEach(async tag => {
      /**
       * remove the tag if there's no tag in all favorites.
       */
      const query = docRef.collection("favorites")
        .where("tags", "array-contains", tag);
      const snapshot = await query.get();
      if (snapshot.docs.length === 0){
        await docRef.update({
          tags: admin.firestore.FieldValue.arrayRemove(tag)
        });
      }
    })
  }
}

exports.getAllUserId = async () => {
  const snapshot = await db.collection('users').get();
  return snapshot.docs.map(doc => doc.data().twitterUid);
}


exports.addTagLength = async (user_id) => {
  /**
   * タグの総数を、対象ユーザーすべてのツイートに対し付与する。
   * ※タグ数が2以下の場合はタグ付けを促すために、should_tagを付与する
   */
  const twRef = db.collection("users")
    .doc(user_id).collection("favorites");
  const snapshot = await twRef.get();
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    twRef.doc(data.id_str).update({
      num_of_tags: data.tags.length,
      should_tag: data.tags.length <= 2  // タグ数が2以下の場合はタグ付けを促せるように
    });
  })
}

exports.updateDetailNote = async (user_id, tweet_id, detailNote) => {
  const twRef = db.collection("users")
    .doc(user_id).collection("favorites").doc(tweet_id);
  const doc = await twRef.get();
  await twRef.update({detailNote: detailNote})
}

exports.backupFirestoreToStorage = async () => {
  try {
    const accessToken = await admin.credential
      .applicationDefault()
      .getAccessToken()
      .then(res => res.access_token);
    const projectID = process.env.GCLOUD_PROJECT;
    const response = await axios.post(
      `https://firestore.googleapis.com/v1/projects/${projectID}/databases/(default):exportDocuments`,
      { outputUriPrefix: `gs://${projectID}-firestore-backup` },
      { headers: {Authorization: `Bearer ${accessToken}` } }
    )
    console.log(response)
  } catch (error) {
    console.error(error)
  }
}