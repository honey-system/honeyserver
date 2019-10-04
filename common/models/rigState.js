'use strict';

const Helpers = require('../../server/utils').Helpers;
const async = require('async');
const Joi = require('joi');
const lb = require('loopback');

module.exports = function (RigState) {
  RigState.getCharts = function (req, oProps, fnCallback) {

    let oAccount = req.oAccount;

    if (!oAccount || !oAccount.__data.id) {
      return fnCallback(Helpers.fnGetError("Who are u?", 422));
    }

    let Rig = lb.getModel('Rig');

    Rig.find({where: {ownerId: oAccount.__data.id}, fields: {id: true}}, function (err, rigs) {
      if (err)
        return fnCallback(err);

      let dateMin = new Date(new Date().setDate(new Date().getDate() - 1));
      let dateMax = new Date(new Date().setMinutes(new Date().getMinutes() - 0));

      let rigIds = [];
      rigs.forEach((item, i, arr) => rigIds.push(item.__data.id));

      RigState.find({where: {rigId: {inq: rigIds}, date: {gt: dateMin, lt: dateMax}, type : constants.STATE_TYPE_ACTUAL}}, function (err, data) {
        if (err)
          return fnCallback(err);

        return fnCallback(err, data);
      })
    })

  };

  RigState.remoteMethod('getCharts', {
    accepts: [
      {arg: 'req', type: 'object', http: {source: 'req'}},
      {arg: 'body', type: 'object', required: true, http: {source: 'body'}}
    ],
    http: {path: '/getCharts', verb: 'put'},
    returns: {arg: 'body', type: 'object', root: true},
    description: '',
    notes: '-'
  })
};
