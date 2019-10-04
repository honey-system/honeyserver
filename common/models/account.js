'use strict';

const Config = require('../../server/server.js').settings;
const Helpers = require('../../server/utils').Helpers;
const Notificator = require('../../server/utils').Notificator;
const async = require('async');
const Joi = require('joi');
const lb = require('loopback');
const app = require('../../server/server');

module.exports = function (Account) {

  Account.getAccount = function (req, oProps, fnCallback) {
    return fnCallback(null, req.oAccount);
  };

  Account.remoteMethod('getAccount', {
    accepts: [
      {arg: 'req', type: 'object', http: {source: 'req'}},
      {arg: 'body', type: 'object', required: true, http: {source: 'body'}}
    ],
    http: {path: '/getAccount', verb: 'put'},
    returns: {arg: 'body', type: 'object', root: true},
    description: '',
    notes: '-'
  });

  Account.afterRemote('login', function(context, remoteMethodOutput, next) {
    if(remoteMethodOutput.__data.user.__data.userIdTelegram)
      Notificator.emit('account_telegram_message', {
        account: remoteMethodOutput.__data.user,
        message: {type: constants.LOG_TYPE_INFO, message: "Login in account " + remoteMethodOutput.__data.user.__data.username}
      });

    next();
  });

  Account.editAccount = function (req, oProps, fnCallback) {


    if (req.isAdmin && oProps.accountId) {
      var oJoiResult = Joi.validate(oProps, Joi.object({
        accountId: Joi.string().required()
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

      Account.findOne({where: {id: oProps.accountId}}, function (err, data) {
        if (err)
          return fnCallback(err);

        if (!data)
          return fnCallback(Helpers.fnGetError("No account found"));


        editAccount(data);
      });

    } else {
      editAccount(req.oAccount);
    }

    function editAccount(oAccount) {
      if (!oAccount.__data.settings) oAccount.__data.settings = {};
      if (!oAccount.__data.settings.notification) oAccount.__data.settings.notification = {};

      if (oProps.onlyNotification) {
        oAccount.__data.settings.notification = oProps.settings.notification;
        oAccount.__data.userIdTelegram = oProps.userIdTelegram;
        if(oProps.rigs && oProps.rigs.length > 0){
          let calls = [];

          let Rig = lb.getModel("Rig");
          for (let i = 0; i < oProps.rigs.length; i++){
            let rig = oProps.rigs[i];

            if(!rig.id || !oAccount.__data.id)
              return fnCallback(Helpers.fnGetError("Not id or not user set"));

            calls.push(function (callback) {

              Rig.updateAll({ownerId : oAccount.__data.id, id: rig.id}, {notification : rig.notification}, function (err, data) {
                  return callback(err, data);
              });

            });
          }

          async.series(calls, function (err, data) {
             if (err)
               return fnCallback(err);

              saveAccount(oAccount);
          })

        } else
          saveAccount(oAccount);
      } else if (oProps.onlyGeneral)
      {
        let calls = [];

        calls.push(function (callback) {
          if (oProps.password && oProps.newPassword) {
            oAccount.hasPassword(oProps.password, function (err, isMatch) {
              if (err)
                return callback(err);

              if (isMatch)
                oAccount.updateAttribute('password', oProps.newPassword, function (oError, oUser) {
                  callback(oError);
                });
              else
                callback(Helpers.fnGetError("Password not match", 401));
            });
          } else
            callback();
        });

        calls.push(function (callback) {

          var oJoiResult = Joi.validate(oProps, Joi.object({
            username: Joi.string().required()
          }).required(), {
            abortEarly: false,
            convert: false,
            stripUnknown: false,
            allowUnknown: true
          });

          if (oJoiResult.error) {
            oJoiResult.error.status = 422;
            return callback(oJoiResult.error);
          }

          oAccount.__data.username = oProps.username;

          callback();
        });

        async.series(calls, function (err, data) {
          if (err)
            return fnCallback(err);
          saveAccount(oAccount);
        })

      }
      else if (oProps.onlyFee)
      {
        oAccount.__data.feeMinerId = oProps.feeMinerId;
        oAccount.__data.enableFee = oProps.enableFee;
        oAccount.__data.feeMinutes = oProps.feeMinutes;
        saveAccount(oAccount);
      } else
        return fnCallback(Helpers.fnGetError("What are u want?", 404));


    }

    function saveAccount(oAccount) {
      oAccount.save(function (err, account) {
        if (err)
          return fnCallback(err);

        if (oProps.onlyNotification) {
          Notificator.emit('account_telegram_message', {
            account: account,
            message: {type: constants.LOG_TYPE_INFO, message: "Notification updated for " + account.__data.username}
          })
        } else if (oProps.password) {
          Notificator.emit('account_telegram_message', {
            account: account,
            message: {
              type: constants.LOG_TYPE_INFO,
              message: "Password has been changed for " + account.__data.username
            }
          })
        }

        return fnCallback(null, account);
      })
    }

  };

  Account.remoteMethod('editAccount', {
    accepts: [
      {arg: 'req', type: 'object', http: {source: 'req'}},
      {arg: 'body', type: 'object', required: true, http: {source: 'body'}}
    ],
    http: {path: '/editAccount', verb: 'put'},
    returns: {arg: 'body', type: 'object', root: true},
    description: '',
    notes: '-'
  });

  Account.updatePassword = function (oProps, req, fnCallback) {
    if (req) {
      var Account = req.Account || null;
      var accessToken = req.accessToken || null;

      if (Account == null || accessToken == null) {
        var AccessToken = app.models.AccessToken;
        AccessToken.findById(oProps.accessToken, function (err, accessToken) {
          if (err) return fnCallback(err);

          if (err)
            if (err.name === 'ValidationError')
              return fnCallback(err);
            else
              return fnCallback(Helpers.fnGetError());

          if (!accessToken) return fnCallback(new Error('could not find accessToken'));

          Account.findById(accessToken.userId, function (oError, oUser) {
            if (oError)
              if (oError.name === 'ValidationError')
                return fnCallback(oError);
              else
                return fnCallback(Helpers.fnGetError());

            resetPass(oUser);
          })
        })
      } else {
        resetPass(Account);
      }
    }

    function resetPass(Account) {
      if (oProps.password == undefined || !oProps.password.length)
        return fnCallback(Helpers.fnGetError('`password` is missing', 422));

      Account.updateAttribute('password', oProps.password, function (oError, oUser) {
        if (oError)
          if (oError.name === 'ValidationError')
            return fnCallback(oError);
          else
            return fnCallback(Helpers.fnGetError());

        fnCallback();
      })
    }
  };
  Account.remoteMethod('updatePassword', {
    accepts: [
      {arg: 'body', type: 'object', required: true, http: {source: 'body'}},
      {
        arg: 'req',
        type: 'object',
        http: {
          source: 'req'
        }
      }
    ],
    http: {path: '/updatePassword', verb: 'put'},
    description: 'Update client password',
    notes: 'Accept `password` and require reset accessToken'
  });

};

