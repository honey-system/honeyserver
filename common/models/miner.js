'use strict';

const Helpers = require('../../server/utils').Helpers;
const async = require('async');
const Joi = require('joi');
const lb = require('loopback');

module.exports = function (Miner) {

  Miner.getMiners = function (req, oProps, fnCallback) {

    /*oProps.numId = Number.parseInt(oProps.numId);

    let oJoiResult = Joi.validate(oProps, Joi.object({
      numId: Joi.number().required(),
      password: Joi.string().required()
    }).required(), {
      abortEarly: false,
      convert: false,
      stripUnknown: false,
      allowUnknown: true
    });

    if (oJoiResult.error) {
      oJoiResult.error.status = 422;
      return fnCallback(oJoiResult.error);
    }*/

    let targetAccountId;
    let showDelete;


    let filter = {include: ["honeyFile"]};
    filter.where = {};

    if (!oProps.fee) {
      if (req.isAdmin) {
        if (oProps.accountId) {
          targetAccountId = oProps.accountId;
        }
        showDelete = oProps.showDelete;

      } else {
        targetAccountId = req.oAccount.__data.id;
      }
    } else {
      filter.where.ownerId = settings.systemAccountId;
    }

    if (!showDelete)
      filter.where.status = {neq: global.constants.MINER_STATUS_DELETE};

    if (targetAccountId) {
      filter.where.ownerId = targetAccountId;
    }

    Miner.find(filter, function (err, files) {
      if (err)
        return fnCallback(err);

      fnCallback(null, files);
    });

  };

  Miner.remoteMethod('getMiners', {
    accepts: [
      {arg: 'req', type: 'object', http: {source: 'req'}},
      {arg: 'body', type: 'object', required: true, http: {source: 'body'}}
    ],
    returns: {arg: 'body', type: 'object', root: true},
    http: {path: '/getMiners', verb: 'put'},
    notes: '-'
  });


  Miner.changeMiner = function (req, oProps, fnCallback) {

    let oJoiResult = Joi.validate(oProps, Joi.object({
      id: Joi.number(),
      name: Joi.string().required(),
      options: Joi.string().required(),
      conf: [Joi.string().optional(), Joi.allow(null)],
      fileId: Joi.required()
    }).required(), {
      abortEarly: false,
      convert: false,
      stripUnknown: false,
      allowUnknown: true
    });

    if (oJoiResult.error) {
      oJoiResult.error.status = 422;
      return fnCallback(oJoiResult.error);
    }

    let ownerId;
    if (req.isAdmin) {
      if (oProps.accountId)
        ownerId = oProps.accountId;
      else
        ownerId = req.oAccount.id;
    } else {
      ownerId = req.oAccount.id;
    }

    if (!oProps.id) {

      let newMiner = {
        name: oProps.name,
        options: oProps.options,
        conf: oProps.conf,
        fileId: oProps.fileId,
        ownerId: ownerId,
        status: constants.MINER_STATUS_ACTIVE
      };

      if (oProps.pathReadMe)
        newMiner.pathReadMe = oProps.pathReadMe;

      Miner.create(newMiner, function (err, rig) {
        if (err) {
          console.log(err);
          return fnCallback(err);
        }

        fnCallback(null, rig);
      });


    } else {
      let oJoiResult = Joi.validate(oProps, Joi.object({
        id: Joi.number().required(),
        name: Joi.string().required(),
        options: Joi.string().required(),
        pathReadMe: Joi.string(),
        fileId: Joi.required()
      }).required(), {
        abortEarly: false,
        convert: false,
        stripUnknown: false,
        allowUnknown: true
      });

      if (oJoiResult.error) {
        oJoiResult.error.status = 422;
        return fnCallback(oJoiResult.error);
      }

      Miner.findById(oProps.id, {ownerId : ownerId, status: {neq : constants.MINER_STATUS_DELETE}}, function (err, miner) {
        if (err)
          return fnCallback(err);
        if (miner == null)
          return fnCallback(Helpers.fnGetError("No miner found with id - " + oProps.id));

        if (oProps.delete) {
          miner.__data.status = global.constants.MINER_STATUS_DELETE;
        } else {
          miner.__data.status = global.constants.MINER_STATUS_ACTIVE;
          miner.__data.name = oProps.name;
          miner.__data.options = oProps.options;
          miner.__data.fileId = oProps.fileId;
          //miner.__data.ownerId = ownerId;
          miner.__data.pathReadMe = oProps.pathReadMe ? oProps.pathReadMe : null;
        }

        miner.save(function (err, data) {
          if (err)
            return fnCallback(err);

          return fnCallback(null, miner);

        });
      });
    }

  };

  Miner.remoteMethod('changeMiner', {
    accepts: [
      {arg: 'req', type: 'object', http: {source: 'req'}},
      {arg: 'body', type: 'object', required: true, http: {source: 'body'}}
    ],
    returns: {arg: 'body', type: 'object', root: true},
    http: {path: '/changeMiner', verb: 'put'},
    notes: '-'
  });


};
