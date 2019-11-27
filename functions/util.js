exports.getOldestTweetId = (tweets) => {
  const ids = [];
  tweets.forEach(tweet => {
    ids.push(tweet.id);
  })
  return Math.min.apply(null, ids)
}