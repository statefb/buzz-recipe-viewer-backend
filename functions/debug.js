const api = require('./api')

api.getAllFollowing()
  .then(res => {
    console.log(res.length);
    return res.length;
  })
  .catch(err => {
    console.log(err)
  })

// api.getAllFavorites()
//   .then(res => {
//     console.log(res);
//     return res
//   })
//   .catch(err => {
//     console.log(err);
//   })
