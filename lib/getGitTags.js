var exec = require('child_process').exec

module.exports = function (cb) {
  exec('git tag', function (err, stdout, stderr) {
    if (err) {
      cb(err)
    }
    else {
      var tags = stdout
        .split('\n')
        .filter(function (tag) {
          return tag.length > 0
        })
        .sort()

      cb(err, tags)
    }
  })
}
