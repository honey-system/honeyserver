'use strict';

const EventEmitter = require("events").EventEmitter;
const lb = require('loopback');
const Helpers = require('./helpers');
const async = require('async');
const gcm = require('node-gcm');
const Datasourses = require('../datasources.json');
//const HttpsProxyAgent = require('https-proxy-agent');

//use from config.json, cause server may be not initialized
const Config = require('../config.json');

var Notificator = new EventEmitter();
let bot;

//------------ TELEGRAM -------------------
if (Config.enableTelegramBot && Config.telegramToken !== '') {
  const TelegramBot = require('node-telegram-bot-api');
  bot = new TelegramBot(Config.telegramToken, {
    polling: true,
    request: {  proxy: 'http://51.79.40.178:3128/' }
  });
  exports.telegramBot = bot;

  //bot.on("polling_error", (msg) => console.log(msg));

  bot.onText(/start/, function (msg, match) {
    var userId = msg.from.id;

    bot.sendMessage(userId, "Enter /secret to get the CODE");
  });

  bot.onText(/secret/, function (msg, match) {
    var userId = msg.from.id;
    bot.sendMessage(userId, 'Secret CODE is *' + userId + '* enter him in account settings ', {parse_mode: "Markdown"});
  });
}

Notificator.on('account_telegram_message', function (oData) {

  let oAccount = oData.account.__data;
  let type = oData.message.type;
  let message = oData.message.message;

  if (oAccount.userIdTelegram && message && bot != null)
    bot.sendMessage(oAccount.userIdTelegram, message);
});

module.exports = Notificator;

