const api = require('./api')

api.getAllFollowing()
  .then(res => {
    console.log(res);
    return res.users.length;
  })
  .catch(err => {
    console.log(err)
  })