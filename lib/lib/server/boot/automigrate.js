'use strict';

var async = require('async');
module.exports = function (app) {
  /*
   * The `app` object provides access to a variety of LoopBack resources such as
   * models (e.g. `app.models.YourModelName`) or data sources (e.g.
   * `app.datasources.YourDataSource`). See
   * http://docs.strongloop.com/display/public/LB/Working+with+LoopBack+objects
   * for more info.
   */
  async.parallel({
    rate: async.apply(createRate)
  }, function (err, results) {
    if (err) throw err;
    createRateLevel(results.rate);
  });

  function createRate(cb) {
    app.dataSources.mysql.automigrate('Rate', function (err) {
      if (err) return cb(err);
      var Rate = app.models.Rate;
      Rate.create({
        name: 'bar',
        prepaid: 0,
        minstay: 0,
        maxstay: 1
      }, cb);
    });
  }

  function createRateLevel(rate, cb) {
    app.dataSources.mysql.automigrate('RateLevel', function (err) {
      if (err) return cb(err);
      var RateLevel = app.models.RateLevel;
      RateLevel.create([{
        name: 'bar 1',
        minPrice: 1000,
        maxPrice: 1200,
        order: 1,
        rateId: rate.id
      }, {
        name: 'bar 2',
        minPrice: 1200,
        maxPrice: 1500,
        order: 1,
        rateId: rate.id
      }]);
    });
  }
};