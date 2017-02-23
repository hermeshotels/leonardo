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
      /*
      Eseguo il parse degli hotel disponibili per le date dichiarate.
      Ermes ritorna anche hotel non disponibili con tariffa a 0, li escludo
      */
      var availableHotels = [];
      if (xml.checkdisponibilita.hotellist.hotel.constructor === Array) {
        xml.checkdisponibilita.hotellist.hotel.forEach(function (hotel) {
          if (hotel.prezzominimo > 0) {
            availableHotels.push(formatHotel(hotel));
          }
        });
      }
      return cb(null, availableHotels);
    });
  }
};


function formatHotel(hotel) {
  return {
    id: hotel.id,
    name: hotel.nome,
    address: hotel.indirizzo,
    zip: hotel.cap,
    country: hotel.nazione,
    shortDescription: hotel.descrizionebreve,
    longDescription: hotel.descrizione,
    terms: hotel.termini,
    photo: hotel.foto,
    maxChildAge: hotel.etamaxbambini,
    pos: {
      lat: hotel.latitudine,
      lng: hotel.longitudine
    },
    type: hotel.struttura.nome,
    gallery: hotel.gallery.foto,
    rating: {
      value: parseInt(hotel.rating.id),
      name: hotel.rating.nome
    },
    bestRate: parseFloat(hotel.prezzominimo)
  };
}