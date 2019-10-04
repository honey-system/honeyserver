'use strict';

const Helpers = require('../../server/utils').Helpers;
const async = require('async');
const Joi = require('joi');
const lb = require('loopback');

module.exports = function (HoneyFile) {


  HoneyFile.getFiles = function (req, oProps, fnCallback) {

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

    let filter = {};
    filter.where = {
      or: [{status: {nin: [global.constants.FILE_STATUS_DELETE]}},
        {status: null}]
    };

    HoneyFile.find(filter, function (err, files) {
      if (err) {
        console.log(err);
        return fnCallback(Helpers.fnGetError());
      }

      fnCallback(null, files);
    });

  };

  HoneyFile.remoteMethod('getFiles', {
    accepts: [
      {arg: 'req', type: 'object', http: {source: 'req'}},
      {arg: 'body', type: 'object', required: true, http: {source: 'body'}}
    ],
    returns: {arg: 'body', type: 'object', root: true},
    http: {path: '/getFiles', verb: 'put'},
    notes: '-'
  });


  HoneyFile.changeHoneyFile = function (req, oProps, fnCallback) {

    let validate;

    if(!req.isAdmin)
      return fnCallback(Helpers.fnGetError("This is not editable", 401));

    if (oProps.delete)
      validate = Joi.validate(oProps, Joi.object({
        id: Joi.number().required(),
        delete: Joi.boolean().required()
      }).required(), {
        abortEarly: false,
        convert: false,
        stripUnknown: false,
        allowUnknown: true
      });
    else
      validate = Joi.validate(oProps, Joi.object({
        id: Joi.number(),
        name: Joi.string().required(),
        nameInternal: Joi.string().required(),
        type: Joi.number().required(),
        pathServer: Joi.string().required(),
        pathClient: Joi.string().required(),
        options: Joi.string().required(),
        default: Joi.string().required(),
        pathReadMe: Joi.string().required(),
        labels: Joi.string().required()
      }).required(), {
        abortEarly: false,
        convert: false,
        stripUnknown: false,
        allowUnknown: true
      });

    let oJoiResult = validate;

    if (oJoiResult.error) {
      oJoiResult.error.status = 422;
      return fnCallback(oJoiResult.error);
    }

    if (!oProps.id) {

      HoneyFile.create({
        name: oProps.name,
        nameInternal: oProps.nameInternal,
        type: oProps.type,
        pathServer: oProps.pathServer,
        pathClient: oProps.pathClient,
        options: oProps.options,
        default: oProps.default,
        pathReadMe: oProps.pathReadMe,
        labels: oProps.labels
      }, function (err, rig) {
        if (err) {
          console.log(err);
          return fnCallback(err);
        }

        fnCallback(null, rig);
      });


    } else {
      HoneyFile.findById(oProps.id, {}, function (err, file) {
        if (err)
          return fnCallback(err);
        if (file == null)
          return fnCallback(Helpers.fnGetError("No file found with id - " + oProps.id));

        if (oProps.delete) {
          file.destroy(function (err, data) {
            return fnCallback(err);
          })
        } else {

          if (oProps.delete) {
            file.__data.status = global.constants.FILE_STATUS_DELETE;
          } else {
            file.__data.name = oProps.name;
            file.__data.nameInternal = oProps.nameInternal;
            file.__data.pathServer = oProps.pathServer;
            file.__data.pathClient = oProps.pathClient;
            file.__data.options = oProps.options;
            file.__data.default = oProps.default;
            file.__data.pathReadMe = oProps.pathReadMe;
            file.__data.labels = oProps.labels;
          }

          file.save(function (err, data) {
            if (err)
              return fnCallback(err);

            return fnCallback(null, file);
          });
        }


      });
    }
  };

  HoneyFile.remoteMethod('changeHoneyFile', {
    accepts: [
      {arg: 'req', type: 'object', http: {source: 'req'}},
      {arg: 'body', type: 'object', required: true, http: {source: 'body'}}
    ],
    returns: {arg: 'body', type: 'object', root: true},
    http: {path: '/changeHoneyFile', verb: 'put'},
    notes: '-'
  });

};
