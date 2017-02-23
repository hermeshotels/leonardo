'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _xmlparser = require('./xmlparser');

var _xmlparser2 = _interopRequireDefault(_xmlparser);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = {
  format: function format(xmlData, cb) {
    _xmlparser2.default.parseString(xmlData, function (error, xml) {
      if (error) return cb(error, null);
      var voucher = {
        id: xml.datiprenotazione.prenotazione.id,
        code: xml.datiprenotazione.prenotazione.codice,
        arrival: xml.datiprenotazione.prenotazione.dataarrivo,
        departure: xml.datiprenotazione.prenotazione.partenza,
        adults: xml.datiprenotazione.prenotazione.adulti,
        childs: xml.datiprenotazione.prenotazione.bambini,
        rooms: xml.datiprenotazione.prenotazione.camere
      };
      return cb(null, voucher);
    });
  }
};