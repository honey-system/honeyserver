'use strict';

const Helpers = require('../../server/utils').Helpers;
const async = require('async');
const Joi = require('joi');
const lb = require('loopback');

module.exports = function(Label) {

  Label.getLabels = function (req, oProps, fnCallback) {
    
    let oJoiResult = Joi.validate(oProps, Joi.object({
      searchText: Joi.string()
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

    let filter = {where : {ownerId : req.oAccount.__data.id}};
    if (oProps.searchText)
      filter.where.name = {like : oProps.searchText};

    Label.find(filter, function (err, labels) {
      if (err) {
        console.log(err);
        return fnCallback(Helpers.fnGetError());
      }

      fnCallback(null, labels);
    });

  };

  Label.remoteMethod('getLabels', {
    accepts: [
      {arg: 'req', type: 'object', http: {source: 'req'}},
      {arg: 'body', type: 'object', required: true, http: {source: 'body'}}
    ],
    returns: {arg: 'body', type: 'object', root: true},
    http: {path: '/getLabels', verb: 'put'},
    notes: '-'
  });


  Label.changeLabel = function (req, oProps, fnCallback) {

    let oJoiResult = Joi.validate(oProps, Joi.object({
      id: Joi.number(),
      name: Joi.string().required()
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

    oProps.numId = Number.parseInt(oProps.numId);

    if (!oProps.id) {

      Label.find({where : { name : oProps.name, ownerId : req.oAccount.__data.id}}, {}, function (err, label) {
        if (err)
          return fnCallback(err);
        if (label == null)
          Label.create({name: oProps.name, ownerId : req.oAccount.__data.id}, function (err, rig) {
            if (err) {
              console.log(err);
              return fnCallback(err);
            }

            fnCallback(null, rig);
          });
        else
          fnCallback(Helpers.fnGetError("Label already exist"));
      });

    } else {

      Label.findById(oProps.id, {where : {ownerId : req.oAccount.__data.id}}, function (err, label) {
        if (err)
          return fnCallback(err);
        if (label == null)
          return fnCallback(Helpers.fnGetError("No Label found with id - " + oProps.id));

        if (oProps.delete) {
          label.destroy(function (err) {
            if (err)
              return fnCallback(err);

            return fnCallback(null);

          });
        } else {
          label.__data.name = oProps.name;

          label.save(function (err, label) {
            if (err)
              return fnCallback(err);

            return fnCallback(null, label);

          });
        }

      });
    }

  };

  Label.remoteMethod('changeLabel', {
    accepts: [
      {arg: 'req', type: 'object', http: {source: 'req'}},
      {arg: 'body', type: 'object', required: true, http: {source: 'body'}}
    ],
    returns: {arg: 'body', type: 'object', root: true},
    http: {path: '/changeLabel', verb: 'put'},
    notes: '-'
  });
  
  
};
