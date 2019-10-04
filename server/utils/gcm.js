'use strict';

const iSendPushNotifyPartSize = 1000;

const path = require('path');
const Joi = require('joi');
const gcm = require('node-gcm');
const lb = require('loopback');
const async = require('async');
const util = require('util');
const _this = this;

const Config = require('../config.json');


const oJoiPushNotificationSchema = {
 /* notification: Joi.object({
    title: Joi.string().required(),
    body: Joi.string().required(),
    click_action: Joi.string().optional()
  }).required(),*/
  data: Joi.object().pattern(/.*/, [Joi.string().allow(null), Joi.number().allow(null)])
};
const oJoiPushTokensSchema = Joi.array().items(Joi.string());

exports.fnSendPushNotification  = function (aTokens, oBody, fnCallback) {
  new Promise(function(resolve, reject) {
    Joi.validate(aTokens, oJoiPushTokensSchema, function(oError) {
      if(oError)
        return reject(oError);

      resolve();
    });
  })
    .then(function() {
      return new Promise(function(resolve, reject){
        Joi.validate(oBody, oJoiPushNotificationSchema, function(oError) {
          if(oError)
            return reject(oError);

          resolve();
        });
      })
    })
    .then(function() {
      return new Promise(function (resolve, reject) {
        oBody.contentAvailable = true; //On iOS, use this field to represent content-available in the APNS payload. When a notification or message is sent and this is set to true, an inactive client app is awoken. On Android, data messages wake the app by default. On Chrome, currently not supported
        oBody.priority = "high"; //for force send notifications
     /*   oBody.notification.icon = 'icon_logo_small'; //On Android: sets value to myicon for drawable resource myicon.png
        oBody.notification.badge = 1; //Indicates the badge on client app home icon
        oBody.notification.color = '#5a3a3a'; //Indicates color of the icon, expressed in #rrggbb format
        oBody.notification.sound = "default"; //Indicates sound to be played. Supports only default currently.
        if ( oBody.notification.body.length > 60)
        oBody.notification.body = oBody.notification.body.substr(0, 60) + "..";*/


     //   oBody.time_to_live = 3;

        oBody.data.color = '#5a3a3a'; //Indicates color of the icon, expressed in #rrggbb format
        if ( oBody.data.body.length > 60)
          oBody.data.body = oBody.data.body.substr(0, 60) + "..";

        var oMessage = new gcm.Message(oBody)
          , oSender = new gcm.Sender(Config.gcmServerApiKey);

        //retrying a specific number of times (10)
        oSender.send(oMessage, {
          registrationTokens: aTokens
        }, 10, function (oError, oRes) {
          if(oError)
            return reject(oError);

          var aDel = []
            , i = oRes.results.length;

          while(i--) {
            if (oRes.results[i].error === 'NotRegistered' || oRes.results[i].error === 'InvalidRegistration')
              aDel.push({
                token: aTokens[i]
              });
          }

          //delete invalid tokens
          if(aDel.length)
            lb.getModel('Device').destroyAll({
              or: aDel
            }, function(oError) {
              if(oError)
                console.log(oError);
            });

          resolve(oRes);
        });
      })
    })
    .then(function(oRes) {
      typeof fnCallback === 'function' && fnCallback(null, oRes)
    })
    .catch(function(oError) {
      typeof fnCallback === 'function' && fnCallback(oError)
    })
};

exports.fnSendPushNotificationsForDevices = function (oWhere, oBody, fnCallback) {
  var Device = lb.getModel('Device')
    , oLocals = {
      count: 0,
      failure: 0,
      success: 0
    };
  new Promise(function(resolve, reject) {
    Joi.validate(oBody, oJoiPushNotificationSchema, function(oError) {
      if(oError)
        return reject(oError);

      resolve();
    });
  })
    .then(function() {
      return new Promise(function(resolve, reject) {
        Device.count(oWhere, function(oError, iCount) {
          if(oError)
            return reject(oError);

          oLocals.count = iCount;

          resolve();

        })
      })
    })
    .then(function() {
      return new Promise(function(resolve, reject) {

        if(!oLocals.count)
          return resolve();

        var iParts = Math.ceil(oLocals.count / iSendPushNotifyPartSize)
          , aAsync = [];

        for(let i = 0; i < iParts; i++) {
          aAsync.push(function(fnSeriesCb) {
            Device.find({
              where: oWhere,
              offset: i * iSendPushNotifyPartSize,
              limit: iSendPushNotifyPartSize
            }, function(oError, aDevices) {
              if(oError)
                return fnSeriesCb(oError);

              var aTokens = []
                , i = aDevices.length;
              while(i--) {
                aTokens.push(aDevices[i].token);
              }

              _this.fnSendPushNotification(aTokens, oBody, function(oError, oRes) {
                if(!oError) {
                  oLocals.failure +=  oRes.failure;
                  oLocals.success +=  oRes.success;
                }
                fnSeriesCb(oError);
              })
            })
          })
        }

        async.series(aAsync, function(oError) {
          if(oError)
            return reject(oError);
          resolve();
        });

      })
    })
    .then(function() {
      console.info("GCM count - " + oLocals.count + ' success - ' + oLocals.success+ ' failure - ' + oLocals.failure);
      fnCallback(null, {
        total: oLocals.count,
        success: oLocals.success,
        failure: oLocals.failure
      })
    })
    .catch(function(oError) {
      fnCallback(oError);
    })
};

