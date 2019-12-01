/**
 * Endpoints for Firebase functions.
 */
const jobs = require('./jobs');
const api = require('./api')
const functions = require('firebase-functions');
const admin = require('firebase-admin');
// admin.initializeApp(functions.config().firebase);
// admin.initializeApp();

const api = require('./api')
const db = require('./db')

exports.addAllFavorites = functions.https.onRequest(async (req, res) => {
  /**
   * httpリクエストからupdateを呼び指す
   * テスト用
   */
  const fav = await jobs.update();
  await db.updateAll(fav);
  res.end();
})

exports.addAllUsers = functions.https.onRequest(async (req, res) => {
  /**
   * httpリクエストを使ってDB内の全followingsを更新する
   * テスト用
   */
  const followings = await api.getAllFollowing();
  await db.updateFollowings(followings);
  res.end();
})

exports.addFav = functions.https.onRequest(async (req, res) => {
  /**
   * httpリクエスト経由でお気に入りをdbに追加する
   * テスト用
   */
  const fav = await api.getFavorites();
  await db.updateUsers(fav);
  res.end();
})
