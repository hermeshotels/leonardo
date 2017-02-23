'use strict';

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
  return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

var _xmlparser = require('./xmlparser');

var _xmlparser2 = _interopRequireDefault(_xmlparser);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = {
  format: function format(xmlData, cb) {
    _xmlparser2.default.parseString(xmlData, function (error, xml) {
      if (error) return cb(error, null);
      if (xml.daticanale) {
        var _ret = function () {
          var channel = {
            id: xml.daticanale.id,
            name: xml.daticanale.nome,
            scripts: xml.daticanale.scriptpers,
            css: xml.daticanale.csspers,
            website: xml.daticanale.linksito,
            googleUA: xml.daticanale.googleid,
            destinations: [],
            hotels: []
          };
          // set up channel active destinations
          if (xml.daticanale.mappa.listacitta.citta.constructor === Array) {
            // there are multiple destinations linked to the channel
            xml.daticanale.mappa.listacitta.citta.forEach(function (city) {
              channel.destinations.push({
                id: city.id,
                name: city.nome
              });
            });
          } else {
            channel.destinations.push({
              id: xml.daticanale.mappa.listacitta.citta.id,
              name: xml.daticanale.mappa.listacitta.citta.nome
            });
          }
          // setup active hotels
          if (xml.daticanale.hotellist.hotel.constructor === Array) {
            xml.daticanale.hotellist.hotel.forEach(function (hotel) {
              channel.hotels.push(formatHotel(hotel));
            });
          } else {
            channel.hotels.push(formatHotel(hotel));
          }
          return {
            v: cb(null, channel)
          };
        }();

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
      } else {
        return cb(null, {});
      }
    });
  }
};

function formatHotel(hotel) {
  return {
    id: hotel.id,
    name: hotel.nome,
    address: hotel.indirizzo,
    zip: hotel.cap,
    cityId: hotel.idcitta,
    city: hotel.citta,
    province: hotel.province,
    country: hotel.nazione,
    description: hotel.descrizione,
    shortDescription: hotel.descrizionebreve,
    terms: hotel.termini,
    image: hotel.foto,
    logo: hotel.logo,
    rating: hotel.rating,
    maxChildAge: hotel.etamaxbambini,
    mail: hotel.mail,
    phone: hotel.tel,
    checkIn: hotel.checkIn,
    checkOut: hotel.checkOut,
    pos: {
      lat: hotel.latitudine,
      lng: hotel.longitudine
    }
  };
}