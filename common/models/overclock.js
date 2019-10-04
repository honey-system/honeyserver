'use strict';

module.exports = function(Overclock) {

  Overclock.getOCs = function (req, oProps, fnCallback) {

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

    let ownerId;
    if (req.isAdmin) {
      if (oProps.accountId)
        ownerId = oProps.accountId;
      else
        ownerId = req.oAccount.id;
    } else {
      ownerId = req.oAccount.id;
    }

    let filter = {where : {} };
    if(oProps.type != null)
      filter.where.type = oProps.type;

    filter.where.ownerId = ownerId;

    Overclock.find(filter, function (err, overclocks) {
      if (err) {
        console.log(err);
        return fnCallback(Helpers.fnGetError());
      }

      fnCallback(null, overclocks);
    });

  };

  Overclock.remoteMethod('getOCs', {
    accepts: [
      {arg: 'req', type: 'object', http: {source: 'req'}},
      {arg: 'body', type: 'object', required: true, http: {source: 'body'}}
    ],
    returns: {arg: 'body', type: 'object', root: true},
    http: {path: '/getOCs', verb: 'put'},
    notes: '-'
  });



  Overclock.changeOverclock = function (req, oProps, fnCallback) {

    /*let oJoiResult = Joi.validate(oProps, Joi.object({
      numId: Joi.number(),
      type: Joi.number().required(),
      pathServer: Joi.string().required(),
      pathClient: Joi.string().required(),
      hash: Joi.string().required(),
      readMe: Joi.string().required()
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

      Overclock.create({
        name: oProps.name,
        type: oProps.type,
        memory: oProps.memory,
        core: oProps.core,
        pl: oProps.pl,
        volt: oProps.volt,
        fan: oProps.fan,
        ownerId: ownerId
        }, function (err, overclock) {
        if (err) {
          console.log(err);
          return fnCallback(err);
        }

        fnCallback(null, overclock);
      });


    } else
      Overclock.findById( oProps.id, {where: {ownerId: ownerId}} , function (err, overclock) {
        if (err)
          return fnCallback(err);
        if(overclock == null)
          return fnCallback(Helpers.fnGetError("No overclock found with id - " + oProps.id));

        if (oProps.delete){
          overclock.destroy(function (err, data) {
            return fnCallback(err);
          })
        } else {
          overclock.__data.name = oProps.name;
          overclock.__data.memory = oProps.memory;
          overclock.__data.core = oProps.core;
          overclock.__data.pl = oProps.pl;
          overclock.__data.volt = oProps.volt;
          overclock.__data.fan = oProps.fan;
          overclock.__data.ownerId = ownerId;

          overclock.save(function (err, data) {
            if (err)
              return fnCallback(err);

            return fnCallback(null, overclock);
          });
        }


      });

  };

  Overclock.remoteMethod('changeOverclock', {
    accepts: [
      {arg: 'req', type: 'object', http: {source: 'req'}},
      {arg: 'body', type: 'object', required: true, http: {source: 'body'}}
    ],
    returns: {arg: 'body', type: 'object', root: true},
    http: {path: '/changeOverclock', verb: 'put'},
    notes: '-'
  });

};
