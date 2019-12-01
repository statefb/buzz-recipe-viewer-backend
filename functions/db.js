const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
let db = admin.firestore();

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

exports.updateUsers = async (users) => {
  const followingRef = db.collection('followings');
  const promises = [];
  users.forEach(user => {
    promises.push(followingRef.doc(user.id_str).set(user));
  });
  await Promise.all(promises);
}