var async = require('async');
var app = require('../server');
var ds = app.dataSources.data;

module.exports = function(server) {

  if (process.env.CREATE_ENT)
    return console.log('Skipping autoupdate');
  ds.autoupdate();
};
