'use strict';
import moment from 'moment';

module.exports = function(Bolreservation) {

  Bolreservation.dateRange = (start, end, cb) => {
    let startDate = moment(start, 'YYYYMMDD0000')
    let endDate = moment(end, 'YYYYMMDD0000')

    Bolreservation.find({
      where: {
        and: [
          {
            date: {
              gt: startDate.toDate()
            }
          },
          {
            date: {
              lt: endDate.toDate()
            }
          }
        ]
      }
    }, (error, reservations) => {
      if (error) return cb(error, null)
      return cb(null, reservations)
    })
  }

  Bolreservation.remoteMethod('dateRange', {
    http: {
      verb: 'GET'
    },
    accepts: [
      {arg: 'start', type: 'string', required: true},
      {arg: 'end', type: 'string', required: true}
    ],
    returns: { arg: 'reservations', type: 'object'}
  });

};
