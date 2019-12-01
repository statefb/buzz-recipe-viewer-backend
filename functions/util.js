const bigInt = require("big-integer");

exports.getOldestTweetIdStr = (tweets) => {
  const ids = [];
  tweets.forEach(tweet => {
    ids.push(bigInt(tweet.id_str));
  })
  // return Math.min.apply(null, ids)
  return exports.getMin(ids).toString();
}

exports.getMin = (array) => {
  /**
   * get minimum value of array which elem is bigInt.
   */
  if (array.length === 0) {
    throw Error('array length is 0')
  }
  let minVal = array[0];
  array.forEach(val => {
    if (minVal.compare(val) === 1) {
      minVal = val;
    }
  });
  return minVal;
}

exports.compressUserObj = (user) => {
  /**
   * user-objectの中から必要な情報のみを取得する
   * ※firestoreはnested-arrayを格納できないため、必要最低限の
   * 情報のみを格納するために作成
   * 参考：https://stackoverflow.com/questions/54785637/cloud-functions-error-cannot-convert-an-array-value-in-an-array-value
   */
  return {
    id: user.id,
    id_str: user.id_str,
    name: user.name,
    screen_name: user.screen_name,
    description: user.description,
    url: user.url,
    profile_image_url: user.profile_image_url,
    profile_image_url_https: user.profile_image_url_https
  }
}

exports.compressMultiUserObj = (users) => {
  /**
   * compressUserObjのArray版
   */
  const compUsers = [];
  users.forEach(user => {
    compUsers.push(exports.compressUserObj(user))
  });
  return compUsers;
}