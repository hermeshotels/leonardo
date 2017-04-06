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
      console.log(xml);
      if (error) return cb(error, null);
      var codes = [];
      if (xml.errore) {
        return cb(xml.errore, null);
      }
      if (xml.datiprenotazione.prenotazione.constructor === Array) {
        xml.datiprenotazione.prenotazione.forEach(function (pren) {
          codes.push(pren.codice);
        });
      } else {
        codes.push(xml.datiprenotazione.prenotazione.codice);
      }
      return cb(null, codes);
    });
  }
};