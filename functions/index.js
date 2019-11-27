const jobs = require('./jobs');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
// admin.initializeApp(functions.config().firebase);
admin.initializeApp();

const api = require('./api')
const db = require('./db')

exports.addFav = functions.https.onRequest(async (req, res) => {
  const fav = await api.getFavorites();
  db.updateAll(fav);
})

let firestore = admin.firestore();

exports.addMessage = functions.https.onRequest(async (req, res) => {
  firestore.collection('messages').doc('test').set({text: 'hogehoge'});
})