/**
 * Endpoints for Firebase functions.
 */
const jobs = require('./jobs');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
// admin.initializeApp(functions.config().firebase);
// admin.initializeApp();

const api = require('./api')
const db = require('./db')

exports.setFollowings = functions.https.onCall(async (data, context) => {
  await jobs.setFollowings(data.user_id);
})

// exports.setFollowings = functions.https.onRequest(async (req, res) => {
//   const user_id = req.query.user_id
//   await jobs.setFollowings(user_id);
//   res.end("successfully added followings.")
// })

/************************************/

// exports.addAllFavorites = functions.https.onRequest(async (req, res) => {
//   /**
//    * httpリクエストからupdateを呼び指す
//    * テスト用
//    */
//   try {
//     const fav = await jobs.update();
//     await db.updateAll(fav);
//   } catch (error) {
//     console.log(error);
//     res.end(error.message);
//   }
//   res.end("successfully added to firestore.");
// })

// exports.addAllUsers = functions.https.onRequest(async (req, res) => {
//   /**
//    * httpリクエストを使ってDB内の全followingsを更新する
//    * テスト用
//    */
//   try {
//     const followings = await api.getAllFollowings();
//     await db.updateFollowings(followings);
//   } catch (error) {
//     console.log(error);
//     res.end(error.message);
//   }
//   res.end("successfully added to firestore.");
// })

// exports.addFav = functions.https.onRequest(async (req, res) => {
//   /**
//    * httpリクエスト経由でお気に入りをdbに追加する
//    * テスト用
//    */
//   const fav = await api.getFavorites();
//   await db.updateUsers(fav);
//   res.end();
// })
