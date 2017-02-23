'use strict';

module.exports = function(Inventory) {

  Inventory.availability = function (from, to, cb) {
    Inventory.find({
      where: {
        and: [
          {dateTo: { gte: from }},
          {dateFrom: { lte: to}}
        ]
      }
    }, function (err, availability) {
      if (err) return cb(err, null);
      return cb(null, availability);
    });
  }

  Inventory.remoteMethod('availability', {
    accepts: [
      { arg: 'from', type: 'date' },
      { arg: 'to', type: 'date' }
    ],
    returns: { arg: 'dates', type: 'string' }
  });

};
