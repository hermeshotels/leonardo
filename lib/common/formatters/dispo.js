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
      var dispo = {
        rooms: [],
        services: []
      };
      /*
      Ermes ritorna nella risposta più camere con lo stesso nome
      ma con tariffa differente. Per evitare duplicati devo raggruppare
      le camere per id per poi inviare al cliente un output sensato.
      */
      if (xml.datidisponibilita) {
        // transform in array for processing
        if (xml.datidisponibilita.disponibilita.constructor !== Array) {
          xml.datidisponibilita.disponibilita = [xml.datidisponibilita.disponibilita];
        }
        xml.datidisponibilita.disponibilita.forEach(function (rate) {
          var room = dispo.rooms.find(function (processedRoom) {
            return processedRoom.id === rate.camera.idcamera;
          });
          if (room) {
            // la camera esiste, aggancio la tariffe
            room.rates.push(formatRate(rate));
          } else {
            // la camera non esiste, la genero ed aggancio la tariffa
            var idx = dispo.rooms.push(formatRoom(rate));
            dispo.rooms[idx - 1].rates.push(formatRate(rate));
          }
        });
        /*
        Formatto i servizi
        */
        if (xml.datidisponibilita.servizi && xml.datidisponibilita.servizi.data) {
          dispo.services = formatServices(xml.datidisponibilita.servizi);
        }
        return cb(null, dispo);
      } else {
        return cb(null, {});
      }
    });
  }
};


function formatRoom(rate) {
  var formattedRoom = {
    id: rate.camera.idcamera,
    name: rate.camera.nomecamera,
    description: rate.camera.descrizionecameralunga,
    minGuest: rate.camera.minpers,
    maxGuest: rate.camera.maxpers,
    dimension: rate.camera.dimensione,
    roomsLeft: rate.camera.numerocamere,
    inRoom: {
      ariConditioning: rate.camera.ariacond === 'true',
      wifi: rate.camera.wifi === 'true',
      tvSat: rate.camera.tvsat === 'true',
      bath: rate.camera.jacuzzi === 'true',
      shower: rate.camera.doccia === 'true'
    },
    bedSelection: rate.camera.sceltaletto === 'true',
    rates: [],
    gallery: []
  };

  if (rate.camera.fotocamera) {
    formattedRoom.gallery.push(rate.camera.fotocamera.replace(/\s+/g, '%20'));
  }

  if (rate.camera.fotocamera2) {
    formattedRoom.gallery.push(rate.camera.fotocamera2.replace(/\s+/g, '%20'));
  }

  if (rate.camera.fotocamera3) {
    formattedRoom.gallery.push(rate.camera.fotocamera3.replace(/\s+/g, '%20'));
  }

  if (rate.camera.fotocamera4) {
    formattedRoom.gallery.push(rate.camera.fotocamera4.replace(/\s+/g, '%20'));
  }

  if (rate.camera.fotocamera5) {
    formattedRoom.gallery.push(rate.camera.fotocamera5.replace(/\s+/g, '%20'));
  }

  if (rate.camera.fotocamera6) {
    formattedRoom.gallery.push(rate.camera.fotocamera6.replace(/\s+/g, '%20'));
  }

  return formattedRoom;
}

function formatRate(rate) {
  var formattedRate = {
    id: rate.id,
    rateid: parseInt(rate.tariffa.id),
    roomid: parseInt(rate.camera.idcamera),
    name: rate.tariffa.nometariffa,
    description: rate.tariffa.descrizionetariffa,
    package: rate.tariffa.pacchetto === 'true',
    packageId: parseInt(rate.tariffa.idpacchetto),
    cancellable: rate.tariffa.cancellabile === 'true',
    offer: rate.offerta === 'true',
    total: parseFloat(rate.totale),
    originTotal: parseFloat(rate.totaleOriginario),
    prepaid: parseFloat(rate.prepagato),
    currency: rate.moneta,
    includes: {
      breakfast: rate.colazione === 'true',
      lunch: rate.pranzo === 'true',
      dinner: rate.cena === 'true'
    },
    policy: rate.cancellationpolicy,
    dailyPrices: []
  };
  // aggiungo i costi giornalieri
  if (rate.costi.giorno.constructor === Array) {
    for (var i = 0; i < rate.costi.giorno.length; i++) {
      formattedRate.dailyPrices.push({
        day: rate.costi.giorno[i],
        price: parseFloat(rate.costi.costo[i])
      });
    }
  } else {
    formattedRate.dailyPrices.push({
      day: rate.costi.giorno,
      price: parseFloat(rate.costi.costo)
    });
  }
  return formattedRate;
}

function formatServices(services) {
  var formattedServices = [];
  if (services.data.constructor !== Array) {
    var serviceArray = [];
    serviceArray.push(services.data);
    services.data = serviceArray;
  }
  var serviceFound = false;
  services.data.forEach(function (day) {
    // scorro la lista dei giorni che includono la lista dei servizi disponibili
    if (day.lista.servizio.constructor !== Array) {
      day.lista.servizio = [day.lista.servizio];
    }
    day.lista.servizio.forEach(function (service) {
      // scorro tutti i servizi disponibili per questo giorno
      // controllo se il servizio è già presente nell'array
      serviceFound = false;
      formattedServices.forEach(function (processedService) {
        if (parseInt(service.idservizio) === processedService.id) {
          // il servizio esiste, aggiungo data a e quantita
          processedService.days.push({
            date: day.$.date,
            quantity: service.numerodisponibile,
            max: 1000,
            selected: 0,
            price: service.prezzoservizio
          });
          serviceFound = true;
          return;
        }
      });
      if (!serviceFound) {
        formattedServices.push({
          id: parseInt(service.idservizio),
          fascia: service.idfascia,
          name: service.nomeservizio,
          description: service.descrizioneservizio,
          image: service.fotoservizio && service.fotoservizio.length > 0 ? service.fotoservizio.replace(/\s+/g, '%20') : '',
          price: service.prezzoservizio,
          fullStay: service.interosogg === 'true',
          qty: 0,
          days: [{
            date: day.$.date,
            quantity: service.numerodisponibile,
            max: 1000,
            selected: 0,
            price: service.prezzoservizio
          }]
        });
      }
    });
  });
  return formattedServices;
}