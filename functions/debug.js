const api = require('./api')
const index = require('./index')
const jobs = require("./jobs")
const db = require("./db")

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

// jobs.setFavorites("1308112076");
// jobs.setFavorites("1308112076");

// db.addTag("1308112076", "1009745542690234368", "orange")
//   .then(() => db.addTag("1308112076", "1009745542690234368", "blue"))
//   .then(() => db.addTag("1308112076", "1009745542690234368", "hoge"))
//   .then(() => db.addTag("1308112076", "1009745542690234368", "hage"))
//   .then(() => db.deleteTag("1308112076", "1009745542690234368", "hage"))
//   .then(() => db.deleteTag("1308112076", "1009745542690234368", "blue"))
//   .then(() => db.deleteTag("1308112076", "1009745542690234368", "orange"))
//   .then(() => db.deleteTag("1308112076", "1009745542690234368", "hoge"))


// api.getReplies()
//   .then(res => {
//     console.log(res);
//     return res
//   })
//   .catch(err => {
//     console.log(err);
//   })

// db.addTagLength("1308112076")
//   .then(res => {
//     console.log(res)
//     return res
//   })
//   .catch(err => {
//     console.log(err)
//   })

// db.getAllUserId()
//   .then(res => {
//     res.forEach(id => {
//       jobs.setFollowings(id)
//     })
//   })
//   .catch(err => console.log(err))

// const userIds = await db.getAllUserId();
//   userIds.forEach(id => {
//     jobs.setFollowings(id)
//   })


db.updateDetailNote("1308112076", "1008987942197456896", {
  recipe: "れしぴほげー",
  ingredients: "材料ほげほげ",
  others: "その他ほげほげ"
})
  .then(res => {
    console.log(res);
    return res
  })
  .catch(err => {
    console.log(err);
  })