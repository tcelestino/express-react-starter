var fs = require('fs');
var request = require('request').defaults(require('../config/request'));
var URI = require('URIjs');

function getPicture (url) {
  var uri = URI(url)
    , filename = '/images/upload/' + uri.filename();

  request
    .get(url)
    .pipe(fs.createWriteStream('public' + filename, { encoding: 'binary' }));
}

module.exports = getPicture;
