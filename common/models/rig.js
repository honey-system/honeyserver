'use strict';

const Helpers = require('../../server/utils').Helpers;
const Notificator = require('../../server/utils').Notificator;
const async = require('async');
const Joi = require('joi');
const lb = require('loopback');

module.exports = function (Rig) {

  Rig.login = function (req, oProps, fnCallback) {

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
    }

    Rig.findOne({
      where: {and: [{numId: oProps.numId}, {password: oProps.password}]},
      include: [{relation: "miner", scope: {include: "honeyFile"}}]
    }, function (err, rig) {
      if (err) {
        console.log(err);
        return fnCallback(Helpers.fnGetError());
      }

      if (!rig)
        return fnCallback(Helpers.fnGetError("Login password is not valid", 401));

      if (rig.__data.status !== constants.RIG_STATUS_ACTIVE)
        return fnCallback(Helpers.fnGetError("Rig is inactive"));

      fnCallback(null, rig);

    });

  };

  Rig.remoteMethod('login', {
    accepts: [
      {arg: 'req', type: 'object', http: {source: 'req'}},
      {arg: 'body', type: 'object', required: true, http: {source: 'body'}}
    ],
    returns: {arg: 'body', type: 'object', root: true},
    http: {path: '/login', verb: 'put'},
    notes: '-'
  });


  Rig.info = function (req, oProps, fnCallback) {

    oProps.numId = Number.parseInt(oProps.numId);

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
    }

    Rig.findOne({
      where: {and: [{numId: oProps.numId}, {password: oProps.password}]},
      include: [{relation: "info"}]
    }, function (err, rig) {
      if (err) {
        console.log(err);
        return fnCallback(Helpers.fnGetError());
      }

      if (!rig)
        return fnCallback(Helpers.fnGetError("Rig not found", 404));

      if (rig.__data.status !== constants.RIG_STATUS_ACTIVE)
        return fnCallback(Helpers.fnGetError("Rig is inactive"));

      let oRigInfo = rig.__data.info;

      if (!oRigInfo) {
        let RigInfo = lb.getModel("RigInfo");
        oRigInfo = new RigInfo();
      }

      oRigInfo.rigId = rig.id;
      oRigInfo.date = new Date().getTime();
      oRigInfo.bootTime = Date(oProps.bootTime);
      oRigInfo.ip = oProps.ip;
      oRigInfo.motherboard = oProps.motherboard;
      oRigInfo.memory = oProps.memory;
      oRigInfo.cpu = oProps.cpu;
      oRigInfo.hard = oProps.hard;
      oRigInfo.cards = oProps.cards;

      oRigInfo.save(function (err, data) {
        if (err)
          return fnCallback(err);

        return fnCallback(null, {result: "OK"});
      });

    });

  };

  Rig.remoteMethod('info', {
    accepts: [
      {arg: 'req', type: 'object', http: {source: 'req'}},
      {arg: 'body', type: 'object', required: true, http: {source: 'body'}}
    ],
    returns: {arg: 'body', type: 'object', root: true},
    http: {path: '/info', verb: 'put'},
    notes: '-'
  });


  Rig.state = function (req, oProps, fnCallback) {

    oProps.numId = Number.parseInt(oProps.numId);

    let oJoiResult = Joi.validate(oProps, Joi.object({
      numId: Joi.number().required(),
      password: Joi.string().required(),
      miner: Joi.string().required(),
      temp: Joi.array().required(),
      fan: Joi.array().required(),
      power: Joi.required(),
      busids: Joi.array().required(),
      total_hash: Joi.string().required(),
      hash: Joi.array().required(),
      df: Joi.string().required(),
      cpuavg: Joi.string().required(),
      cputemp: Joi.string().required()
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

    try {
      oProps.minerName = JSON.parse(oProps.miner).name;
    } catch (e) {
      oProps.minerName = "NOT_SET";
    }

    Rig.findOne({
      where: {and: [{numId: oProps.numId}, {or : [{password: oProps.password}, {newPassword: oProps.password}] } ]},
      include: [
        {relation: "miner", scope: {include: "honeyFile"}},
        {relation: "tasks", scope: {where: {status: global.constants.TASK_STATUS_ACTIVE}}}
      ]
    }, function (err, rig) {
      if (err) {
        console.log(err);
        return fnCallback(Helpers.fnGetError());
      }

      if (!rig)
        return fnCallback(Helpers.fnGetError("Login password is not valid", 401));

      if (rig.__data.status !== constants.RIG_STATUS_ACTIVE)
        return fnCallback(Helpers.fnGetError("Rig is inactive"));

      let RigState = lb.getModel("RigState");

      function createState() {
        let oRigState = new RigState();
        oRigState.date = new Date().getTime();
        oRigState.miner = oProps.minerName;
        oRigState.temp = oProps.temp;
        oRigState.fan = oProps.fan;
        oRigState.power = oProps.power;
        oRigState.busId = oProps.busids;
        oRigState.totalHash = oProps.total_hash;
        oRigState.hashrate = oProps.hash;
        oRigState.diskFree = oProps.df;
        oRigState.cpuLoad = oProps.cpuavg.toString();
        oRigState.cpuTemp = oProps.cputemp;
        oRigState.type = constants.STATE_TYPE_TEMP;

        rig.stats.create(oRigState, function (err, data) {
          if (err)
            return fnCallback(err);

          if (rig.__data.tasks.length > 0) {
            let aTasksID = [];
            for (let i = 0; i < rig.__data.tasks.length; i++) {
              aTasksID.push(rig.__data.tasks[i].__data.id)
            }


            let Task = lb.getModel("Task");
            Task.destroyAll({id: {inq: aTasksID}}, function (err, data) {
              if (err)
                return fnCallback(err);

              return fnCallback(null, {tasks: rig.__data.tasks});
            })
          } else
            return fnCallback(null, {result: "OK no task"});
        });
      }

      if (oProps.password === rig.__data.newPassword) {
        let fields = { newPassword : null, password : rig.__data.newPassword};
        rig.updateAttributes( fields, function (err, data) {
          createState()
        })
      } else
        createState()


    });

  };

  Rig.remoteMethod('state', {
    accepts: [
      {arg: 'req', type: 'object', http: {source: 'req'}},
      {arg: 'body', type: 'object', required: true, http: {source: 'body'}}
    ],
    returns: {arg: 'body', type: 'object', root: true},
    http: {path: '/state', verb: 'put'},
    notes: '-'
  });


  Rig.getRigs = function (req, oProps, fnCallback) {

    oProps.numId = Number.parseInt(oProps.numId);

    let oJoiResult = Joi.validate(oProps, Joi.object({
      miners: [Joi.array(), Joi.allow(null)],
      labels: [Joi.array(), Joi.allow(null)],
      count: Joi.number(),
      statuses: [Joi.array(), Joi.allow(null)]
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

    let RigLabel = lb.getModel("RigLabel");

    let calls = [];

    let filter = {
      where: {status: {neq: constants.RIG_STATUS_DELETE}},
      include: [
        {relation: "miner"},
        {relation: "stats", scope: {limit: 1, order: "date DESC"}},
        {relation: "info"},
        {relation: "labels"}]
    };


    if (oProps.numId)
      filter.where.numId = oProps.numId;

    if (req.isAdmin) {
      if (oProps.accountId) {
        filter.where.ownerId = oProps.accountId;
      }

      if (oProps.statuses && oProps.statuses.length > 0) {
        filter.where.status = {inq: oProps.statuses};
      }

    } else {
      filter.where.ownerId = req.oAccount.__data.id;

      if (oProps.statuses && oProps.statuses.length > 0) {
        filter.where.status.inq = oProps.statuses;
      }

    }

    if (oProps.miners && oProps.miners.length > 0) {
      filter.where.minerId = {inq: []};
      for (let i = 0; i < oProps.miners.length; i++) {
        let miner = oProps.miners[i];
        filter.where.minerId.inq.push(miner.id)
      }
    }

    if (oProps.labels && oProps.labels.length > 0) {
      let filterLabels = {where: {}};
      filterLabels.where.labelId = {inq: []};
      for (let i = 0; i < oProps.labels.length; i++) {
        let label = oProps.labels[i];
        filterLabels.where.labelId.inq.push(label.id)
      }

      calls.push(function (callback) {
        RigLabel.find(filterLabels, function (err, labelsInRigs) {
          if (err)
            return callback(err);

          filter.where.id = {inq: []};
          for (let i = 0; i < labelsInRigs.length; i++) {
            let label = labelsInRigs[i].__data;
            filter.where.id.inq.push(label.rigId);
          }

          return callback(err, labelsInRigs);
        })
      })
    }

    if (oProps.count) {
      filter.limit = oProps.count;
    }

    async.series(calls, function (err, data) {
      if (err)
        return fnCallback(err);

      Rig.find(filter, function (err, rigs) {
        if (err) {
          console.log(err);
          return fnCallback(Helpers.fnGetError());
        }

        fnCallback(null, rigs);
      });
    });


  };

  Rig.remoteMethod('getRigs', {
    accepts: [
      {arg: 'req', type: 'object', http: {source: 'req'}},
      {arg: 'body', type: 'object', required: true, http: {source: 'body'}}
    ],
    returns: {arg: 'body', type: 'object', root: true},
    http: {path: '/getRigs', verb: 'put'},
    notes: '-'
  });


  Rig.getCommands = function (req, oProps, fnCallback) {

    let oJoiResult = Joi.validate(oProps, Joi.object({
      rigId: Joi.number().required()
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

    let filter = {
      where: {rigId: oProps.rigId}
    };


    if (req.isAdmin) {
      if (oProps.accountId) {
        filter.where.ownerId = oProps.accountId;
      }

    } else {
      filter.where.ownerId = req.oAccount.__data.id;
    }

    let Task = lb.getModel('Task');

    Task.find(filter, function (err, data) {
      if (err)
        return fnCallback(err);

      return fnCallback(err, data);
    })

  };

  Rig.remoteMethod('getCommands', {
    accepts: [
      {arg: 'req', type: 'object', http: {source: 'req'}},
      {arg: 'body', type: 'object', required: true, http: {source: 'body'}}
    ],
    returns: {arg: 'body', type: 'object', root: true},
    http: {path: '/getCommands', verb: 'put'},
    notes: '-'
  });

  Rig.getRig = function (req, oProps, fnCallback) {

    oProps.numId = Number.parseInt(oProps.numId);

    let oJoiResult = Joi.validate(oProps, Joi.object({
      id: Joi.number(),
      numId: Joi.number().required()
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

    let filter = {
      where: {numId: oProps.numId},
      include: []
    };

    if (req.isAdmin) {
      if (oProps.accountId) {
        filter.where.ownerId = oProps.accountId;
      }

    } else {
      filter.where.ownerId = req.oAccount.__data.id;
    }

    if (oProps.onlyStats) {
      filter.include.push({relation: "stats", scope: {limit: 1, order: "date DESC"}});
      filter.include.push({relation: "info"});
    } else {
      filter.include.push({relation: "stats", scope: {limit: 1, order: "date DESC"}});
      filter.include.push({relation: "info"});
      filter.include.push({relation: "logs", scope: {limit: 30, order: "date DESC"}});
      filter.include.push({relation: "miner"});
      filter.include.push({relation: "labels"});
    }

    if (oProps.withLogs)
      filter.include.push({relation: "logs", scope: {limit: 30, order: "date DESC"}});

    Rig.findOne(filter, function (err, rig) {
      if (err) {
        console.log(err);
        return fnCallback(Helpers.fnGetError());
      }

      fnCallback(null, rig);
    });

  };

  Rig.remoteMethod('getRig', {
    accepts: [
      {arg: 'req', type: 'object', http: {source: 'req'}},
      {arg: 'body', type: 'object', required: true, http: {source: 'body'}}
    ],
    returns: {arg: 'body', type: 'object', root: true},
    http: {path: '/getRig', verb: 'put'},
    notes: '-'
  });


  Rig.changeRig = function (req, oProps, fnCallback) {

    let oJoiResult = Joi.validate(oProps, Joi.object({
      id: Joi.number(),
      numId: Joi.number()
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

    let RigLabel = lb.getModel('RigLabel');

    oProps.numId = Number.parseInt(oProps.numId);

    if (!oProps.numId) {

      let oJoiResult = Joi.validate(oProps, Joi.object({
        password: Joi.string().required(),
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

      Rig.count({ownerId: req.oAccount.__data.id, status: {neq: constants.RIG_STATUS_DELETE}}, function (err, count) {
        if (err)
          return fnCallback(err);

        let maxRigs = req.oAccount.__data.maxRigs ? req.oAccount.__data.maxRigs : settings.maxCountRigsDefault;
        if (count >= maxRigs)
          return fnCallback(Helpers.fnGetError("You has max rigs - " + count + ", if u need more - tell us"));

        Rig.findOne({order: "numId DESC"}, function (err, data) {
          if (err)
            return fnCallback(err);
          if (data == null)
            oProps.numId = 100;
          else
            oProps.numId = data.__data.numId + 1;

          Rig.create({
            status: global.constants.RIG_STATUS_ACTIVE,
            name: oProps.name,
            password: oProps.password,
            numId: oProps.numId,
            ownerId: req.oAccount.__data.id
          }, function (err, rig) {
            if (err) {
              console.log(err);
              return fnCallback(err);
            }

            fnCallback(null, rig);
          });
        });
      });
    }
    else if (oProps.onlyMiner) {
      let oJoiResult = Joi.validate(oProps, Joi.object({
        id: Joi.number().required(),
        numId: Joi.number().required(),
        minerId: Joi.any().required()
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

      Rig.findById(oProps.id, {where: {ownerId: req.oAccount.__data.id}}, function (err, rig) {
        if (err)
          return fnCallback(err);
        if (rig == null)
          return fnCallback(Helpers.fnGetError("No rig found with id - " + oProps.id));

        if (rig.__data.status !== constants.RIG_STATUS_ACTIVE)
          return fnCallback(Helpers.fnGetError("Rig is inactive"));

        rig.__data.minerId = oProps.minerId;
        rig.__data.minerSpec = oProps.minerSpec;

        rig.save(function (err, data) {
          if (err)
            return fnCallback(err);

          let Task = lb.getModel("Task");

          let oTask = new Task();
          oTask.date = new Date().getTime();
          oTask.status = global.constants.TASK_STATUS_ACTIVE;
          oTask.ownerId = req.oAccount.__data.id;
          oTask.type = constants.TASK_TYPE_USER;
          oTask.name = "updateConf";

          rig.tasks.create(oTask, function (err, data) {
            if (err)
              return fnCallback(err);

            return fnCallback(null, rig);
          });

        });
      });
    }
    else if (oProps.onlyOC) {
      let oJoiResult = Joi.validate(oProps, Joi.object({
        id: Joi.number().required(),
        numId: Joi.number().required(),
        ocAMDSpec: Joi.object().required(),
        ocNVSpec: Joi.object().required()
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

      Rig.findById(oProps.id, {where: {ownerId: req.oAccount.__data.id}}, function (err, rig) {
        if (err)
          return fnCallback(err);
        if (rig == null)
          return fnCallback(Helpers.fnGetError("No rig found with id - " + oProps.id));

        if (rig.__data.status !== constants.RIG_STATUS_ACTIVE)
          return fnCallback(Helpers.fnGetError("Rig is inactive"));


        rig.__data.ocAMDSpec = oProps.ocAMDSpec;
        rig.__data.ocNVSpec = oProps.ocNVSpec;

        rig.save(function (err, data) {
          if (err)
            return fnCallback(err);

          let Task = lb.getModel("Task");

          let oTask = new Task();
          oTask.date = new Date().getTime();
          oTask.status = global.constants.TASK_STATUS_ACTIVE;
          oTask.ownerId = req.oAccount.__data.id;
          oTask.type = constants.TASK_TYPE_USER;
          oTask.name = "updateConf";

          rig.tasks.create(oTask, function (err, data) {
            if (err)
              return fnCallback(err);

            return fnCallback(null, rig);
          });

        });
      });
    }
    else if (oProps.onlyInfo) {
      let oJoiResult = Joi.validate(oProps, Joi.object({
        id: Joi.number().required(),
        numId: Joi.number().required(),
        name: Joi.string().required(),
        password: Joi.string().required(),
        desc: Joi.string().allow(null).max(100)
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

      Rig.findById(oProps.id, {where: {ownerId: req.oAccount.__data.id}}, function (err, rig) {
        if (err)
          return fnCallback(err);
        if (rig == null)
          return fnCallback(Helpers.fnGetError("No rig found with id - " + oProps.id));

        if (rig.__data.status !== constants.RIG_STATUS_ACTIVE)
          return fnCallback(Helpers.fnGetError("Rig is inactive"));


        // let updateRequired = false;
        // if (rig.__data.name !== oProps.name || rig.__data.password !== oProps.password)
        //   updateRequired = true;

        rig.__data.name = oProps.name;
        rig.__data.desc = oProps.desc;

        let hasNewPass = rig.__data.password !== oProps.password ;
        if (hasNewPass) {
          rig.__data.newPassword = oProps.password;
        }

        rig.save(function (err, data) {
          if (err)
            return fnCallback(err);

          let Task = lb.getModel("Task");

          let tasks = [];

          let oTask = new Task();
          oTask.date = new Date().getTime();
          oTask.status = global.constants.TASK_STATUS_ACTIVE;
          oTask.ownerId = req.oAccount.__data.id;
          oTask.type = constants.TASK_TYPE_USER;
          oTask.name = "updateConf";
          tasks.push(oTask);

          rig.tasks.create(tasks, function (err, data) {
            if (err)
              return fnCallback(err);

            return fnCallback(null, rig);
          });

        });
      });
    }
    else if (oProps.onlyLabels) {
      let oJoiResult = Joi.validate(oProps, Joi.object({
        id: Joi.number().required(),
        numId: Joi.number().required(),
        labels: Joi.array().required()
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

      Rig.findById(oProps.id, {where: {ownerId: req.oAccount.__data.id}, include: ["labels"]}, function (err, rig) {
        if (err)
          return fnCallback(err);
        if (rig == null)
          return fnCallback(Helpers.fnGetError("No rig found with id - " + oProps.id));

        if (rig.__data.status !== constants.RIG_STATUS_ACTIVE)
          return fnCallback(Helpers.fnGetError("Rig is inactive"));

        let calls = [];
        let Label = lb.getModel("Label");
        rig.labelsList = [];

        let newLabels = [];
        let newLabelsInRig = [];
        let totalLabels = []; // calculate for delete
        let removeLabelsInRig = [];

        // check labels add, create
        for (let i = 0; i < oProps.labels.length; i++) {
          let label = oProps.labels[i];
          if (!label.id) {
            newLabels.push({
              ownerId: req.oAccount.__data.id,
              name: label.name,
              color: label.color
            });
          } else {
            let inArr = false;
            for (let i = 0; i < rig.__data.labels.length; i++) {
              let labelInRig = rig.__data.labels[i];
              if (labelInRig.__data.id === label.id) {
                inArr = true;
                totalLabels.push(label);
                break;
              }
            }

            if (!inArr) {
              newLabelsInRig.push({labelId: label.id, rigId: rig.id});
            }

          }
        }

        // create labels
        if (newLabels.length > 0)
          calls.push(function (callback) {
            Label.create(newLabels, function (err, labels) {
              if (err)
                return callback(err);

              for (let i = 0; i < labels.length; i++) {
                let label = labels[i];
                newLabelsInRig.push({labelId: label.id, rigId: rig.id});
                totalLabels.push(label);
              }
              return callback(err, labels);
            });
          });

        // add relation to rig
        calls.push(function (callback) {
          if (newLabelsInRig.length > 0)
            RigLabel.create(newLabelsInRig, callback);
          else
            callback();
        });

        // check relation to remove
        calls.push(function (callback) {

          for (let i = 0; i < rig.__data.labels.length; i++) {
            let labelInRig = rig.__data.labels[i];

            let inArray = false;
            for (let i = 0; i < totalLabels.length; i++) {
              let label = totalLabels[i];
              if (labelInRig.__data.id === label.id) {
                inArray = true;
                break;
              }
            }

            if (!inArray)
              removeLabelsInRig.push(labelInRig.id)
          }

          if (removeLabelsInRig && rig.__data.id)
            RigLabel.destroyAll({rigId: rig.__data.id, labelId: {inq: removeLabelsInRig}}, function (err, data) {
              if (err)
                return callback(err);

              return callback(err, data);
            });
          else
            callback();
        });

        async.series(calls, function (err, data) {
          if (err)
            return fnCallback(err);

          Rig.findById(rig.id, {include: ['labels']}, function (err, data) {
            return fnCallback(err, data);
          })
        });


      });
    }
    else if (oProps.onlyWD) {
      let oJoiResult = Joi.validate(oProps, Joi.object({
        id: Joi.number().required(),
        wd: Joi.object().keys({
          minHash: Joi.number().required(),
          enabled: Joi.boolean().required(),
          restart: Joi.boolean().required(),
          reboot: Joi.boolean().required()
        })
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

      Rig.findById(oProps.id, {where: {ownerId: req.oAccount.__data.id}}, function (err, rig) {
        if (err)
          return fnCallback(err);
        if (rig == null)
          return fnCallback(Helpers.fnGetError("No rig found with id - " + oProps.id));

        if (rig.__data.status !== constants.RIG_STATUS_ACTIVE)
          return fnCallback(Helpers.fnGetError("Rig is inactive"));

        rig.__data.wd = oProps.wd;

        rig.save(function (err, rig) {
           if (err)
             return fnCallback(err);

          let Task = lb.getModel("Task");

          let tasks = [];

          let oTask = new Task();
          oTask.date = new Date().getTime();
          oTask.status = global.constants.TASK_STATUS_ACTIVE;
          oTask.ownerId = req.oAccount.__data.id;
          oTask.type = constants.TASK_TYPE_USER;
          oTask.name = "updateWD";
          oTask.payload = {newWD : rig.__data.wd};
          tasks.push(oTask);

          rig.tasks.create(tasks, function (err, data) {
            if (err)
              return fnCallback(err);

            return fnCallback(null, rig);
          });

        });

      });
    }
    else {
      let oJoiResult = Joi.validate(oProps, Joi.object({
        numId: Joi.number().required(),
        password: Joi.string().required(),
        minerId: Joi.any().required(),
        desc: [Joi.string().optional(), Joi.allow(null)],
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

      Rig.findById(oProps.id, {where: {ownerId: req.oAccount.__data.id}}, function (err, rig) {
        if (err)
          return fnCallback(err);
        if (rig == null)
          return fnCallback(Helpers.fnGetError("No rig found with id - " + oProps.id));

        if (oProps.delete) {
          rig.__data.status = global.constants.RIG_STATUS_DELETE;
        } else {
          if (rig.__data.status !== constants.RIG_STATUS_ACTIVE)
            return fnCallback(Helpers.fnGetError("Rig is inactive"));
          rig.__data.name = oProps.name;
          rig.__data.password = oProps.password;
          rig.__data.minerId = oProps.minerId;
          rig.__data.ocAMD = oProps.ocAMD ? oProps.ocAMD : null;
          rig.__data.ocNV = oProps.ocNV ? oProps.ocNV : null;
          rig.__data.ocAMDSpec = oProps.ocAMDSpec ? oProps.ocAMDSpec : null;
          rig.__data.ocNVSpec = oProps.ocNVSpec ? oProps.ocNVSpec : null;
          rig.__data.desc = oProps.desc;
        }

        rig.save(function (err, data) {
          if (err)
            return fnCallback(err);

          let Task = lb.getModel("Task");

          let oTask = new Task();
          oTask.date = new Date().getTime();
          oTask.status = global.constants.TASK_STATUS_ACTIVE;
          oTask.ownerId = req.oAccount.__data.id;
          oTask.type = constants.TASK_TYPE_USER;
          oTask.name = "updateConf";

          rig.tasks.create(oTask, function (err, data) {
            if (err)
              return fnCallback(err);

            return fnCallback(null, rig);
          });

        });
      });
    }


  };

  Rig.remoteMethod('changeRig', {
    accepts: [
      {arg: 'req', type: 'object', http: {source: 'req'}},
      {arg: 'body', type: 'object', required: true, http: {source: 'body'}}
    ],
    returns: {arg: 'body', type: 'object', root: true},
    http: {path: '/changeRig', verb: 'put'},
    notes: '-'
  });


  Rig.log = function (req, oProps, fnCallback) {

    oProps.numId = Number.parseInt(oProps.numId);
    oProps.type = Number.parseInt(oProps.type);

    let oJoiResult = Joi.validate(oProps, Joi.object({
      numId: Joi.number().required(),
      password: Joi.string().required(),
      type: Joi.number().required(),
      title: Joi.string().required()
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

    Rig.findOne({
      where: {and: [{numId: oProps.numId}, {or : [{password: oProps.password}, {newPassword: oProps.password}] } ]},
      include: ['owner']
    }, function (err, rig) {
      if (err) {
        console.log(err);
        return fnCallback(Helpers.fnGetError());
      }

      if (!rig)
        return fnCallback(Helpers.fnGetError("Login password is not valid", 401));

      if (rig.__data.status !== constants.RIG_STATUS_ACTIVE)
        return fnCallback(Helpers.fnGetError("Rig is inactive"));


      let RigLog = lb.getModel("RigLog");

      let oLog = new RigLog();
      oLog.date = new Date().getTime();
      oLog.type = oProps.type;
      oLog.title = oProps.title;
      oLog.payload = oProps.payload;

      rig.logs.create(oLog, function (err, data) {
        if (err)
          return fnCallback(err);

        if (rig.__data.notification && rig.__data.owner && (!oProps.title.startsWith('Try starting fee') && !oProps.title.startsWith('Fee over')) ) {
          if (oLog.type === constants.LOG_TYPE_ERROR && rig.__data.notification.error) {
            Notificator.emit('account_telegram_message', {
              account: rig.__data.owner,
              message: {type: oLog.type, message: "\u{1F534}  " + rig.__data.name + " : " + oLog.title}
            })
          } else if (oLog.type === constants.LOG_TYPE_INFO && rig.__data.notification.info) {
            Notificator.emit('account_telegram_message', {
              account: rig.__data.owner,
              message: {type: oLog.type, message: "\u{1F315}  " + rig.__data.name + " : " + oLog.title}
            })
          }
        }

        /*if (oProps.title.startsWith('Passwrd')) { // for sets new password
          if (oProps.type === constants.LOG_TYPE_ANSWER) {
            let fields = { newPassword : null, password : rig.__data.newPassword};
            rig.updateAttributes( fields, function (err, data) {
              return fnCallback(err, data);
            })
          } else
            return fnCallback(null, data);
        } else*/
          return fnCallback(null, data);

      });

    });

  };

  Rig.remoteMethod('log', {
    accepts: [
      {arg: 'req', type: 'object', http: {source: 'req'}},
      {arg: 'body', type: 'object', required: true, http: {source: 'body'}}
    ],
    returns: {arg: 'body', type: 'object', root: true},
    http: {path: '/log', verb: 'put'},
    notes: '-'
  });


  Rig.logs = function (req, oProps, fnCallback) {

    if (!req.oAccount)
      return Helpers.fnGetError("Who are u?", 404);

    let oJoiResult = Joi.validate(oProps, Joi.object({
      numId: Joi.number().required(),
      destroyAll: Joi.boolean()
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

    Rig.findOne({
      where: {and: [{numId: oProps.numId}, {ownerId: req.oAccount.id}]},
      include: {relation: "logs", scope: {limit: 30, order: "date DESC"}}
    }, function (err, rig) {
      if (err) {
        console.log(err);
        return fnCallback(Helpers.fnGetError());
      }

      if (!rig)
        return fnCallback(Helpers.fnGetError("Rig not found", 404));

      if (rig.__data.status !== constants.RIG_STATUS_ACTIVE)
        return fnCallback(Helpers.fnGetError("Rig is inactive"));


      if (oProps.destroyAll) {

        rig.logs.destroyAll(function (err, data) {
          if (err)
            return fnCallback(err);

          return fnCallback(null, data);
        });
      } else
        return fnCallback(null, rig);
    });

  };

  Rig.remoteMethod('logs', {
    accepts: [
      {arg: 'req', type: 'object', http: {source: 'req'}},
      {arg: 'body', type: 'object', required: true, http: {source: 'body'}}
    ],
    returns: {arg: 'body', type: 'object', root: true},
    http: {path: '/logs', verb: 'put'},
    notes: '-'
  });


  Rig.command = function (req, oProps, fnCallback) {

    let oJoiResult = Joi.validate(oProps, Joi.object({
      commands: Joi.array().items({
        name: Joi.string().required(),
        target: Joi.number(),
        payload: Joi.object()
      }).min(1).max(100).required()
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

    let calls = [];

    if (!req.oAccount)
      return fnCallback("Who are u?", 404);

    let filter = {where: {}};

    if (!req.isAdmin) {
      filter.where.ownerId = req.oAccount.id;
    }

    for (let i = 0; i < oProps.commands.length; i++) {
      let command = oProps.commands[i];
      calls.push(function (callback) {
        Rig.findById(command.target, filter, function (err, rig) {
          if (err)
            return callback(err);

          if (rig == null)
            return callback(Helpers.fnGetError("Rig not found", 404));

          if (rig.ownerId !== req.oAccount.id && !req.isAdmin)
            return callback(Helpers.fnGetError("This is not u rig", 401));

          if (rig.__data.status !== constants.RIG_STATUS_ACTIVE)
            return callback(Helpers.fnGetError("Rig " + rig.__data.numId + " is inactive, skipped"));

          let Task = lb.getModel("Task");

          let oTask = new Task();
          oTask.date = new Date().getTime();
          oTask.status = global.constants.TASK_STATUS_ACTIVE;
          oTask.name = command.name;
          oTask.payload = command.payload;
          oTask.ownerId = req.oAccount.__data.id;
          oTask.type = constants.TASK_TYPE_USER;

          rig.tasks.create(oTask, function (err, data) {
            if (err)
              return callback(err);

            return callback(null, rig);
          });

        })
      });
    }

    async.series(calls, function (err, data) {
      if (err)
        return fnCallback(err);

      return fnCallback(null, null);
    });


  };

  Rig.remoteMethod('command', {
    accepts: [
      {arg: 'req', type: 'object', http: {source: 'req'}},
      {arg: 'body', type: 'object', required: true, http: {source: 'body'}}
    ],
    returns: {arg: 'body', type: 'object', root: true},
    http: {path: '/command', verb: 'put'},
    notes: '-'
  });


  Rig.removeCommands = function (req, oProps, fnCallback) {

    let oJoiResult = Joi.validate(oProps, Joi.object({
      ids: Joi.array().items(Joi.number().required()).min(1).max(100).required()
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

    if (!req.oAccount || !req.oAccount.id)
      return fnCallback("Who are u?", 404);

    let where = {id: {inq: oProps.ids}};

    if (!req.isAdmin) {
      where.ownerId = req.oAccount.id;
    }

    let Task = lb.getModel('Task');

    Task.destroyAll(where, function (err, data) {
      if (data.count === 0)
        return fnCallback(Helpers.fnGetError("Nothing to remove"));

      return fnCallback(err, data);
    })

  };

  Rig.remoteMethod('removeCommands', {
    accepts: [
      {arg: 'req', type: 'object', http: {source: 'req'}},
      {arg: 'body', type: 'object', required: true, http: {source: 'body'}}
    ],
    returns: {arg: 'body', type: 'object', root: true},
    http: {path: '/removeCommands', verb: 'put'},
    notes: '-'
  });


};
