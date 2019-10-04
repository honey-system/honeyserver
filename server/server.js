'use strict';

// Define constants
require('./init.js');

var loopback = require('loopback');
var boot = require('loopback-boot');
const Helpers = require('./utils').Helpers;
const async = require('async');
const Joi = require('joi');
const lb = require('loopback');
const Config = require('./config.json');
var fs = require('fs');

let app = module.exports = loopback();

app.use(loopback.token());

app.use(function (req, res, next) {

  if (!req.accessToken) {
    console.log(Helpers.fnDateStringNow() + " Url : " + req.originalUrl + " user : not_set  from ip : " + req.connection.remoteAddress);
    return next();
  }

 // console.log(Helpers.fnDateStringNow() + " Url : " + req.originalUrl);

  app.models.Account.findById(req.accessToken.userId, function (err, oAccount) {
    if (err){
      return next(err);
    }

    let fnSetCurAccount = function (type, data) {
      // app[type] = data;

      req[type] = data;
      console.log(Helpers.fnDateStringNow() + " Url : " + req.originalUrl + " user : " + data.__data.email + "  from ip : " + req.connection.remoteAddress);

      next();
    };
    req["isAdmin"] = oAccount.__data.type === constants.ACCOUNT_TYPE_ADMIN || oAccount.__data.type === constants.ACCOUNT_TYPE_SUPER_ADMIN;

    //set sur account for access control
    fnSetCurAccount("oAccount", oAccount);
  });

});


app.start = function () {
  // start the web server
  return app.listen(function () {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    /*Config.origin = baseUrl;
    fs.writeFile('./config.json', JSON.stringify(Config) , 'utf8', function (err, data) {
       if (err)
         console.log(err);
    });*/
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function (err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});
