/**
 * Endpoints for Firebase functions.
 */
const jobs = require('./jobs');
const functions = require('firebase-functions');
const admin = require('firebase-admin');

const api = require('./api')
const db = require('./db')

const TIME_SPAN = '0 * * * *';
// const TIME_SPAN = "every 5 minutes";

exports.setFollowings = functions.https.onCall(async (data, context) => {
  await jobs.setFollowings(data.user_id);
})

exports.subscribe = functions.https.onCall(async (data, context) => {
  await db.changeSubscribeStatus(data.user_id, data.twitter_user_id, true);
})

exports.unsubscribe = functions.https.onCall(async (data, context) => {
  await db.changeSubscribeStatus(data.user_id, data.twitter_user_id, false);
})

exports.setFavorites = functions.https.onCall(async (data, context) => {
  await jobs.setFavorites(data.user_id);
})

exports.addTag = functions.https.onCall(async (data, context) => {
  await db.addTag(data.user_id, data.tweet_id, data.text)
})

exports.deleteTag = functions.https.onCall(async (data, context) => {
  await db.deleteTag(data.user_id, data.tweet_id, data.text)
})

exports.updateRecipeNote = functions.https.onCall(async (data, context) => {
  await db.updateDetailNote(data.user_id, data.tweet_id, data.note)
})

exports.onUsersPostCreate = functions.firestore.document(
  "/users/{twitterUid}/favorites/{id_str}"
).onCreate(async (snapshot, context) => {
  const tags = snapshot.data().tags;
  await db.reflectTagsToRoot(tags, context, "add");
})

exports.onUsersPostUpdate = functions.firestore.document(
  "/users/{twitterUid}/favorites/{id_str}"
).onUpdate(async (change, context) => {
  const beforeTags = change.before.data().tags;
  const afterTags = change.after.data().tags;
  let tags;
  if (beforeTags.length > afterTags.length) {
    // remove
    tags = beforeTags.filter(tag => !afterTags.includes(tag));
    await db.reflectTagsToRoot(tags, context, "remove");
  } else {
    // add
    tags = afterTags.filter(tag => !beforeTags.includes(tag));
    await db.reflectTagsToRoot(tags, context, "add");
  }
})

/*
* Cron tasks-----------------------------------
*/
exports.scheduledSetFollowingsAndFavorites = functions.pubsub.schedule(TIME_SPAN)
  .timeZone('America/New_York').onRun(async (context) => {
    const userIds = await db.getAllUserId();
    let promises = [];
    // at first, update favorites and followings
    userIds.forEach(id => {
      promises.push(jobs.setFavorites(id))
      promises.push(jobs.setFollowings(id))
    });
    await Promise.all(promises);
    // add tag length to each tweet
    promises = [];
    userIds.forEach(async id => {
      promises.push(db.addTagLength(id))
    })
    await Promise.all(promises);
    
    return
});

exports.backupFirestore = functions.pubsub.schedule("0 0 * * *")
  .timeZone('America/New_York').onRun(async (context) => {
    await db.backupFirestoreToStorage();
});
