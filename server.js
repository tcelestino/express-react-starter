
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var fs = require('fs');
var path = require('path');
var sockjs = require('sockjs');
var redis = require('redis');
var moment = require('moment');
var _ = require('lodash');
var argv = require('minimist')(process.argv.slice(2));
var version = null;
var hasUpdate = false;
var lib = require('./lib');
var config = require('./config');

var connections = [];

var app = express();

// all environments
app.set('port', argv.p || process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'src')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req, res){
  res.render('index');
});

app.get('/u', function (req, res) {
  /*fs.readFile('version', 'utf-8', function (err, data) {
    data = data.replace(/\n/g, '');
    res.send({ version: data });
  });*/
  res.send({ version: version });
});

app.get('/c', function (req, res) {
  res.json(connections);
});

// Redis Publisher
var publisher = redis.createClient();

// Websocket server
var sockjs_server = sockjs.createServer();

sockjs_server.on('connection', function (conn) {
  var browser = redis.createClient();

  browser.subscribe('chat_channel');

  // console.log('publisher ===================================:', publisher);
  // console.log('connections ===================================:', connections);

  browser.on('message', function (channel, message) {
    // Set server date to message
    var messageObj = JSON.parse(message);

    // connection message with user data
    if (messageObj.id) {
      connections.push(messageObj);
    }
    else {
      messageObj.date = moment();
      conn.write(JSON.stringify(messageObj));
    }
  });

  conn.on('data', function (message) {
    publisher.publish('chat_channel', message);
  });
  conn.on('close', function () {});
});

var server = http.createServer(app);
sockjs_server.installHandlers(server, { prefix:'/echo-' + app.get('port') });
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
  watchForUpdates();
});

function watchForUpdates () {
  lib.getGitTags(function (err, tags) {
    if (err) throw err;

    var l = tags.length;

    version = tags[l - 1];
    setTimeout(watchForUpdates, 5000);
  });
}


