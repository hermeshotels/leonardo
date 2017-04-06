'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _xmlparser = require('./xmlparser');

var _xmlparser2 = _interopRequireDefault(_xmlparser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  format: function format(xmlData, cb) {
    _xmlparser2.default.parseString(xmlData, function (error, xml) {
      if (error) return cb(error, null);
      var calendar = [];
      if (xml.calendario.mese.constructor === Array) {
        xml.calendario.mese.forEach(function (month) {
          month.giorno.forEach(function (day) {
            calendar.push({
              date: day.numerocompleto,
              available: day.disponibile === 'true',
              rooms: parseInt(day.numerocamere),
              minStay: parseInt(day.minstay),
              maxStay: parseInt(day.maxstay)
            });
          });
        });
      }
      return cb(null, calendar);
    });
  }
};