exports.getOldestTweetId = (tweets) => {
  const ids = [];
  tweets.forEach(tweet => {
    ids.push(BigInt(tweet.id_str));
  })
  // return Math.min.apply(null, ids)
  return exports.getMin(ids);
}

exports.getMin = (array) => {
  if (array.length === 0) {
    throw Error('array length is 0')
  }
  let minVal = array[0];
  array.forEach(val => {
    if (minVal > val) {
      minVal = val;
    }
  });
  return minVal;
}
