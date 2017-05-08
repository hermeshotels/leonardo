'use strict';

module.exports = function(Bolsettings) {
  Bolsettings.saveGeneral = (hotelId, settings, cb) => {
    console.log(settings)
    Bolsettings.findOrCreate(
      {
        where: {
          hotelId: hotelId
        }
      },
      settings,
      (error, instance, created) => {
        if (error) return cb(error, null)
        if (instance) {
          // Document found needs to update
          instance.updateAttributes(settings, (error, instance) => {
            if (error) return cb(error, null)
            return cb(null, instance)
          })
        }
      }
    )
  }
  /*
  #######
  REMOTE
  #######
  */
  Bolsettings.remoteMethod('saveGeneral', {
    http: {
      verb: 'POST'
    },
    accepts: [
      {
        arg: 'hotelId',
        type: 'string',
        required: true
      },
      {
        arg: 'settings',
        type: 'Object',
        http: {
          source: "body"
        },
        required: true
      }
    ],
    returns: { arg: 'generalSettings', type: 'Object'}
  });
};
