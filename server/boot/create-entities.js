var async = require('async');
var app = require('../server');
var ds = app.dataSources.data;
var lbTables = ['User', 'AccessToken', 'ACL', 'RoleMapping', 'Role', 'Rig', 'RigInfo', 'RigState', 'RigLog', 'Miner', 'Overclock', 'Task'];
var aAccounts = require('../entity/account.json');
var aFiles = require('../entity/honeyFile.json');
var aMiners = require('../entity/miner.json');

module.exports = function (server) {

  if (!process.env.CREATE_ENT)
    return console.log('Skipping create Entity');

  ds.automigrate(function (er) {
    if (er) throw er;

    let calls = [];
    calls.push(function (callback) {
      app.models.Account.create(aAccounts, function (err, accounts) {
        if (err)
          return callback(err, accounts);

        return callback(err, accounts);
      });
    });

    calls.push(function (callback) {
      app.models.HoneyFile.create(aFiles, function (err, accounts) {
        return callback(err, accounts);
      });
    });

    calls.push(function (callback) {
      app.models.Miner.create(aMiners, function (err, accounts) {
        return callback(err, accounts);
      });
    });

    async.series(calls, function (err, result) {
      if (err)
        console.log(err);
      else
        console.log("Update successful");

      process.exit();
    });


  });
};
