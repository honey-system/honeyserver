const schedule = require('node-schedule');
const lb = require('loopback');
const app = require('../server');
const connector = app.dataSources.data.connector;
const Config = require('../config.json');
const Notificator = require('../../server/utils').Notificator;
const async = require('async');

module.exports = function (app) {

  if (process.env.CREATE_ENT)
    return console.log('Skipping schedule');

  let RigState = lb.getModel('RigState');
  let RigLog = lb.getModel('RigLog');
  let Rig = lb.getModel('Rig');

  // Work with states of rig. Change types and mark to remove; '*/5 * * * *'
  let a = schedule.scheduleJob('*/1 * * * *', function () {

    // mark TEMP stats in 5 minutes as ACTUAL
    let date5 = new Date(Date.now() - 5 * 60 * 1000);
    RigState.find({where: {date: {gt: date5}}, order: 'date DESC'}, (err, data) => {
      if (err)
        console.error(err);

      let statesActual = [];
      let calls = [];

      if (data)
        for (let i = 0; i < data.length; i++) {
          let state = data[i];
          let stateInArr = statesActual.find((stateInArr) => stateInArr.rigId === state.rigId);
          if (!stateInArr) {
            statesActual.push(state);
            calls.push((callback) => {
              state.type = constants.STATE_TYPE_ACTUAL;
              state.save({}, (err, data) => {
                callback(err, data);
              });
            })
          }
        }

      async.series(calls, (err, data) => {
        if (err)
          console.error(err);
        else
          console.debug('Successful update rig state 5 min');

        // mark TEMP stats in 10 minutes as TO REMOVE
        // OR
        // older than 30 days
        let date10 = new Date(Date.now() - 10 * 60 * 1000);
        let date30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        RigState.updateAll({
          or: [
            {type: {eq: constants.STATE_TYPE_TEMP}, date: {lt: date10}},
            {date: {lt: date30d}}
          ]
        }, {
          type: constants.STATE_TYPE_TO_REMOVE
        }, (err, data) => {
          if (err)
            console.error(err);
          else
            console.debug('Successful update rig state 10 min and 30 days');
        });
      });
    });

  });

  // Work with states of rig. Remove marked
  let b = schedule.scheduleJob('*/10 * * * *', function () {
    RigState.destroyAll({type: constants.STATE_TYPE_TO_REMOVE}, (err, data) => {
      if (err)
        console.error(err);
      else
        console.debug('Successful remove old rig state');
    });
  });

  // Send fee task to rigs
  let c = schedule.scheduleJob('0 20 * * *', function () {
    let Account = lb.getModel('Account');
    let Task = lb.getModel('Task');
    let Miner = lb.getModel('Miner');


    function createFeeTasks(limit, iteration) {

      // TODO: Add to filter admin and def exception

      let filter = {
        where: {enableFee: true, status: constants.ACCOUNT_STATUS_ENABLE},
        include: [{relation: 'feeMiner', scope: {include: 'honeyFile'}}, {
          relation: 'rigs',
          scope: {where: {status: constants.RIG_STATUS_ACTIVE}}
        }],
        limit: limit, skip: limit * iteration
      };
      Account.find(filter, function (err, accounts) {
        if (err)
          return console.error('Fee account has error: \n' + err);
        let itsEnd = accounts.length < limit;

        Miner.findById(settings.feeMinerIdDefault, {include: 'honeyFile'}, function (err, defaultMiner) {
          if (err)
            return console.error('Fee def miner has error: \n' + err);


          let tasks = [];

          for (let i = 0; i < accounts.length; i++) {
            let account = accounts[i];

            if (account.__data.rigs.length === 0)
              continue;

            for (let i = 0; i < account.__data.rigs.length; i++) {
              let rig = account.__data.rigs[i];
              let minutes = account.__data.feeMinutes ? account.__data.feeMinutes : settings.feeMinutesDefault;
              let miner = account.__data.feeMiner ? account.__data.feeMiner.__data : defaultMiner.__data;
              let name = '' + account.__data.id + '-' + rig.__data.id;

              tasks.push({
                name: 'fee',
                payload: {
                  minutes: minutes,
                  miner: miner,
                  name: name
                },
                rigId: rig.id,
                type: constants.TASK_TYPE_FEE,
                status: constants.TASK_STATUS_ACTIVE,
                ownerId: account.id
              });
            }
          }

          Task.create(tasks, function (err, data) {
            if (err)
              console.error('Fee task create has error: \n' + err);

            if (!itsEnd)
              createFeeTasks(limit, ++iteration);
            else
              console.log('Fee task sent');
          })

        });

      })
    }

    let ACTUAL_TASK_TIME = 24 * 60 * 60 * 1000;  //  in milliseconds - 24 hours

    // before destroy not actual task
    Task.destroyAll({or: [{type: constants.TASK_TYPE_FEE}, {date: {lt: Date.now() - ACTUAL_TASK_TIME}}]}, function (err, data) {
      if (err)
        console.error('Error destroy old not actual tasks');

      createFeeTasks(1000, 0);
    });

  });

  // find rig OFFLINE and create notify
  let d = schedule.scheduleJob('*/1 * * * *', function () {


    let date5 = new Date(Date.now() - 5 * 60 * 1000);
    let date10 = new Date(Date.now() - 10 * 60 * 1000);

    // get ONLINE rigs in 5 minutes
    RigState.find({where: {date: {gt: date5}}}, (err, data) => {
      if (err)
        console.error(err);

      let rigIdOnline = [];
      if (data)
        for (let i = 0; i < data.length; i++) {
          let state = data[i];
          let stateInArr = rigIdOnline.find((rigId) => rigId === state.rigId);
          if (!stateInArr)
            rigIdOnline.push(state.rigId);
        }

      // then find offline rigs, which were online (sent statistics) between 5 and 10 minutes and not online now
      RigState.find({where: {and: [{date: {gt: date10}}, {date: {lt: date5}}, {rigId: {nin: rigIdOnline}}]}}, (err, data) => {
        if (err)
          return console.error(err);

        let rigIdOffline = [];
        if (data)
          for (let i = 0; i < data.length; i++) {
            let state = data[i];
            let stateInArr = rigIdOffline.find((rigId) => rigId === state.rigId);
            if (!stateInArr)
              rigIdOffline.push(state.rigId);
          }

        console.debug('Offline - ' + rigIdOffline.length);

        if (rigIdOffline.length > 0)
          Rig.find({where: {id: {inq: rigIdOffline}}, include: 'owner'}, function (err, rigs) {
            if (err)
              return console.error('Offline find error - ' + err);

            for (let i = 0; i < rigs.length; i++) {
              let rig = rigs[i];
              let account = rig.__data.owner;

              if (rig.__data.notification.error && account.__data.userIdTelegram)
                Notificator.emit('account_telegram_message', {
                  account: account,
                  message: {message: "\u{1F534}  " + rig.__data.name + " : offline"}
                })
            }
          });

      });

    });

  });

  // find rig ONLINE after OFFLINE and create notify
  let e = schedule.scheduleJob('*/1 * * * *', function () {


    let date5 = new Date(Date.now() - 5 * 60 * 1000);
    let date10 = new Date(Date.now() - 10 * 60 * 1000);

    // get OFFLINE rigs between 5 and 10 minutes
    RigState.find({where: {and: [{date: {gt: date10}}, {date: {lt: date5}}]}}, (err, data) => {
      if (err)
        console.error(err);

      let rigIdOffline = [];
      if (data)
        for (let i = 0; i < data.length; i++) {
          let state = data[i];
          let stateInArr = rigIdOffline.find((rigId) => rigId === state.rigId);
          if (!stateInArr)
            rigIdOffline.push(state.rigId);
        }


      // then find online rigs, which were offline between 5 and 10 minutes and online now
      RigState.find({where: {date: {gt: date5}, rigId: {nin: rigIdOffline}}}, (err, data) => {
        if (err)
          console.error(err);

        let rigIdOnline = [];
        if (data)
          for (let i = 0; i < data.length; i++) {
            let state = data[i];
            let stateInArr = rigIdOnline.find((rigId) => rigId === state.rigId);
            if (!stateInArr)
              rigIdOnline.push(state.rigId);
          }

        console.debug('Online again - ' + rigIdOnline.length);

        if (rigIdOnline.length > 0)
          Rig.find({where: {id: {inq: rigIdOnline}}, include: 'owner'}, function (err, rigs) {
            if (err)
              return console.error('Online find error - ' + err);

            for (let i = 0; i < rigs.length; i++) {
              let rig = rigs[i];
              let account = rig.__data.owner;

              if (rig.__data.notification.error && account.__data.userIdTelegram)
                Notificator.emit('account_telegram_message', {
                  account: account,
                  message: {message: "\u{1F3BE}  " + rig.__data.name + " : online"}
                })
            }
          });

      });

    });

  });

  // Remove old RigLog
  let f = schedule.scheduleJob('* */4 * * *', function () {
    let date30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    RigLog.destroyAll({where: {date: {lt: date30d}}}, (err, data) => {
      if (err)
        console.error(err);
      else
        console.debug('Successful remove old rig LOG');
    });
  });
};
