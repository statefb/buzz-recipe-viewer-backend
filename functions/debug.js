const api = require('./api')
const index = require('./index')
const jobs = require("./jobs")

// api.getAllFollowing()
//   .then(res => {
//     console.log(res.length);
//     return res.length;
//   })
//   .catch(err => {
//     console.log(err)
//   })

// api.getAllFavorites()
//   .then(res => {
//     console.log(res);
//     return res
//   })
//   .catch(err => {
//     console.log(err);
//   })

// index.addAllUsers()

jobs.setFollowings("64chords");