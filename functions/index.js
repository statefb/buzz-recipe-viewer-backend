/**
 * Endpoints for Firebase functions.
 */
const jobs = require('./jobs');
const functions = require('firebase-functions');
const admin = require('firebase-admin');

const api = require('./api')
const db = require('./db')

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

exports.onUsersPostCreate = functions.firestore.document(
  "/users/{twitterUid}/favorites/{id_str}"
).onCreate(async (snapshot, context) => {
  await db.copyToRootWithUsersFavoriteSnapshot(snapshot, context);
})

exports.onUsersPostUpdate = functions.firestore.document(
  "/users/{twitterUid}/favorites/{id_str}"
).onUpdate(async (change, context) => {
  await db.copyToRootWithUsersFavoriteSnapshot(change.after, context);
})