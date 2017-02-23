'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _xmlparser = require('./xmlparser');

var _xmlparser2 = _interopRequireDefault(_xmlparser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  format: function format(xmlData, code, cb) {
    var reservations = [];
    xmlData.forEach(function (reservation) {
      _xmlparser2.default.parseString(reservation, function (error, xml) {
        reservations.push(xml);
      });
    });
    var voucher = {
      rooms: [],
      guest: {},
      grandTotal: 0
    };
    var mainRes = reservations[0].datiprenotazione.prenotazione;
    voucher.id = mainRes.id;
    voucher.code = code;
    voucher.arrival = mainRes.dataarrivo;
    voucher.departure = mainRes.datapartenza;
    voucher.currency = mainRes.moneta;
    voucher.guest.name = mainRes.datiguest.nominativo;
    voucher.guest.address = mainRes.datiguest.indirizzo;
    voucher.guest.cap = mainRes.datiguest.cap;
    voucher.guest.city = mainRes.datiguest.citta;
    voucher.guest.province = mainRes.datiguest.provincia;
    voucher.guest.country = mainRes.datiguest.nazione;
    voucher.guest.email = mainRes.datiguest.mail;
    voucher.guest.phone = mainRes.datiguest.telefono;
    voucher.guest.note = mainRes.datiguest.note;
    reservations.forEach(function (reservation) {
      console.log(reservation);
      voucher.rooms.push(formatResRoom(reservation.datiprenotazione.prenotazione));
      voucher.grandTotal += parseFloat(reservation.datiprenotazione.prenotazione.totale);
    });
    return cb(null, voucher);
  }
};


function formatResRoom(reservation) {
  var res = {
    id: reservation.id,
    code: reservation.codice,
    name: reservation.camera.nomecamera,
    adults: parseInt(reservation.adulti),
    childs: parseInt(reservation.bambini),
    rate: {
      id: reservation.tariffa.idtariffa,
      name: reservation.tariffa.nometariffa,
      breakfast: reservation.colazione,
      lunch: reservation.pranzo,
      dinner: reservation.cena,
      prepaid: parseFloat(reservation.prepagato),
      cancellationPolicy: reservation.cancellationpolicy
    },
    total: reservation.totale
  };
  return res;
}