'use strict';

const iSendPushNotifyPartSize = 1000;

const path = require('path');
const gcm = require('node-gcm');
const async = require('async');
const util = require('util');
const lb = require('loopback');
const fs = require('fs');
var mkdirp = require('mkdirp');

//use from config.json, cause server may be not initialized
const Config = require('../config.json');

exports.fnGetCurrencyString = function(cur, value) {
  let stringCur = "";
  switch (cur){
    case global.constants.CURRENCY_RUB:
      stringCur = "руб";
      break;
  }

  return (value / 100) + " " + stringCur;
};

exports.fnDateNow = function() {
  return Math.round(Date.now()/1000)
};

exports.fnDateStringNow = function() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1; //January is 0!
  var yyyy = today.getFullYear();
  var hour = today.getHours();
  var min = today.getMinutes();
  var sec = today.getSeconds();

  if(dd<10) {
    dd='0'+dd
  }

  if(mm<10) {
    mm='0'+mm
  }

  today = mm+'/'+dd+'/'+yyyy + " " + hour + ":" + min + ":" + sec;
  return today
};

exports.fnChunkArray = function (arr, chunk) {
  let i, j, tmp = [];
  for (i = 0, j = arr.length; i < j; i += chunk) {
    tmp.push(arr.slice(i, i + chunk));
  }
  return tmp;
};


exports.fnConvertTimestampToUnix = function(time_stamp) {
  return Math.round(time_stamp * 1/1000)
};

exports.fnConvertUnixTimestampToISO8601 = function(iTimeStamp) {
  return new Date(iTimeStamp * 1000).toISOString();
};

exports.fnOneDayTimestamp = function() {
  return 24 * 60 * 60;
};

exports.fnGetRandomInt = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

exports.fnGetError = function(sText, iCode, sName){
  var oError = new Error();
  oError.message = sText || 'An unknown error occurred';
  oError.status = iCode || 500;
  oError.statusCode = oError.status;
  oError.name = sName ? sName : (oError.status === 422 ? 'ValidationError' : 'Error');
  oError.custom = true;
  if(!Config.debug)
    delete oError.stack;
  return oError
};

exports.toTitleCase = function toTitleCase(str) {
  var splitStr = str.toLowerCase().split(' ');
  for (var i = 0; i < splitStr.length; i++) {
    // You do not need to check if i is larger than splitStr length, as your for does that for you
    // Assign it back to the array
    splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
  }
  // Directly return the joined string
  return splitStr.join(' ');
};

exports.fnFindIndexByKeyValue = function (arraytosearch, key, valuetosearch, withData) {
  if (withData)
    for (var i = 0; i < arraytosearch.length; i++) {
      let value = arraytosearch[i].__data[key];
      if (value && value.toString() == valuetosearch) {
        return arraytosearch[i];
      }
    }
  else {
    if (valuetosearch.constructor.name === "ObjectID"){
      for (var i = 0; i < arraytosearch.length; i++) {
        if (arraytosearch[i].equals(valuetosearch)) {
          return arraytosearch[i];
        }
      }
    } else {
      for (var i = 0; i < arraytosearch.length; i++) {
        if (arraytosearch[i][key] == valuetosearch) {
          return arraytosearch[i];
        }
      }
    }
  }
  return null;
};

exports.findMatchesInArrays = function (arrayIn1, arrayIn2, arrayIn3) {
  var aMatches = [], arrays = [];

  if(arrayIn1) arrays.push({arr: arrayIn1, length: arrayIn1.length});
  if(arrayIn2) arrays.push({arr: arrayIn2, length: arrayIn2.length});
  if(arrayIn3) arrays.push({arr: arrayIn3, length: arrayIn3.length});

  if(arrays.length == 1)
    return arrays[0].arr;

  if(arrays.length == 0)
    return undefined;

  arrays.sort(function (a, b) {
    return a.length > b.length;
  });

  var array1 = arrays[0].arr, array2 = arrays[1].arr, array3;

  if(arrays[2])
    array3 = arrays[2].arr;

  for (var i = 0; i < array1.length; i++){
    var entity1 = array1[i];

    for (var j = 0; j < array2.length; j++){
      var entity2 = array2[j];

      if(entity1 == entity2) {
        if(array3) {
          for (var k = 0; k < array3.length; k++) {
            var entity3 = array3[k];

            if (entity2 == entity3)
              aMatches.push(entity1);

          }
        } else {
          aMatches.push(entity1);
        }
      }
    }
  }
  return aMatches;
};

exports.fnRemoveFromArray = function (arrayTarget, arrayRemoteData) {
  let arrayFinish = [];

  for (let i = 0; i < arrayTarget.length; i++){
    let item = arrayTarget[i];
    if (arrayRemoteData.indexOf(item) == -1)
      arrayFinish.push(item);
  }

  return arrayFinish;
};

exports.fnGetErrorDetails = function(gateway, oError) {
  switch (gateway) {
    case 'beanstream':
      return ( oError.details && oError.details[0] ? (' - ' + oError.details[0].message) : '' );

    default:
      console.log('Helpers.fnGetErrorDetails - unknown gateway: ' + gateway);
      return '';
  }
};

exports.fnGetHash = function() {
  return ( Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2) )
};

exports.fnLogModelHooks = function(oModel) {
  oModel.beforeInitialize = function(next) {
    console.log('beforeInitialize', arguments, this);
    next && next()
  };

  oModel.afterInitialize = function(next) {
    console.log('afterInitialize', arguments, this);
    next && next()
  };
  oModel.beforeValidate = function(next) {
    console.log('beforeValidate', arguments, this);
    next && next()
  };

  oModel.afterValidate = function(next) {
    console.log('afterValidate', arguments, this);
    next && next()
  };
  oModel.beforeSave = function(next) {
    console.log('beforeSave', arguments, this);
    next && next()
  };
  oModel.afterSave = function(next) {
    console.log('afterSave', arguments, this);
    next && next()
  };
  oModel.beforeCreate = function(next) {
    console.log('beforeCreate', arguments, this);
    next && next()
  };
  oModel.afterCreate = function(next) {
    console.log('afterCreate', arguments, this);
    next && next()
  };
  oModel.beforeUpdate = function(next) {
    console.log('beforeUpdate', arguments, this);
    next && next()
  };
  oModel.afterUpdate = function(next) {
    console.log('afterUpdate', arguments, this);
    next && next()
  };
  oModel.beforeDestroy = function(next) {
    console.log('beforeDestroy', arguments, this);
    next && next()
  };
  oModel.afterDestroy = function(next) {
    console.log('afterDestroy', arguments, this);
    next && next()
  }
};

exports.getRandomColor = function() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++ ) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};
