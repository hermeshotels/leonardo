import xmlParser from './xmlparser';
export default {
  format: (xmlData, cb) => {
    xmlParser.parseString(xmlData, (error, xml) => {
      if (error) return cb(error, null);
      let dispo = {
        rooms: [],
        services: []
      }
      /*
      Ermes ritorna nella risposta più camere con lo stesso nome
      ma con tariffa differente. Per evitare duplicati devo raggruppare
      le camere per id per poi inviare al cliente un output sensato.
      */
      if (xml.datidisponibilita) {
        xml.datidisponibilita.disponibilita.forEach((rate) => {
          let room = dispo.rooms.find((processedRoom) => {
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
        return cb(null, {})
      }
    });
  }
}

function formatRoom (rate) {
  let formattedRoom = {
    id: rate.camera.idcamera,
    name: rate.camera.nomecamera,
    description: rate.camera.descrizionecameralunga,
    minGuest: rate.camera.minpers,
    maxGuest: rate.camera.maxpers,
    dimension: rate.camera.dimensione,
    inRoom: {
      ariConditioning: (rate.camera.ariacond === 'true'),
      wifi: (rate.camera.wifi === 'true'),
      tvSat: (rate.camera.tvsta === 'true'),
      bath: (rate.camera.jacuzzi === 'true'),
      shower: (rate.camera.doccia === 'true')
    },
    bedSelection: (rate.camera.sceltaletto === 'true'),
    rates: [],
    gallery: []
  }

  if(rate.camera.fotocamera) {
    formattedRoom.gallery.push(rate.camera.fotocamera.replace(/\s+/g, '%20'))
  }

  if(rate.camera.fotocamera2) {
    formattedRoom.gallery.push(rate.camera.fotocamera2.replace(/\s+/g, '%20'))
  }

  if(rate.camera.fotocamera3) {
    formattedRoom.gallery.push(rate.camera.fotocamera3.replace(/\s+/g, '%20'))
  }

  if(rate.camera.fotocamera4) {
    formattedRoom.gallery.push(rate.camera.fotocamera4.replace(/\s+/g, '%20'))
  }

  if(rate.camera.fotocamera5) {
    formattedRoom.gallery.push(rate.camera.fotocamera5.replace(/\s+/g, '%20'))
  }

  if(rate.camera.fotocamera6) {
    formattedRoom.gallery.push(rate.camera.fotocamera6.replace(/\s+/g, '%20'))
  }

  return formattedRoom;
}

function formatRate (rate) {
  var formattedRate = {
    id: rate.id,
    name: rate.tariffa.nometariffa,
    description: rate.tariffa.descrizionetariffa,
    package: (rate.tariffa.pacchetto === 'true'),
    cancellable: (rate.tariffa.cancellabile === 'true'),
    offer: (rate.offerta === 'true'),
    total: parseFloat(rate.totale),
    originTotal: parseFloat(rate.totaleOriginario),
    prepaid: parseFloat(rate.prepagato),
    currency: rate.moneta,
    includes: {
      breakfast: (rate.colazione === 'true'),
      lunch: (rate.pranzo === 'true'),
      dinner: (rate.cena === 'true')
    },
    policy: rate.cancellationpolicy,
    dailyPrices: []
  }
  // aggiungo i costi giornalieri
  if (rate.costi.giorno.constructor === Array) {
    for (let i = 0; i < rate.costi.giorno.length; i++) {
      formattedRate.dailyPrices.push({
        day: rate.costi.giorno[i],
        price: parseFloat(rate.costi.costo[i])
      });
    }
  } else {
    formattedRate.dailyPrices.push({
      day: rate.costi.giorno,
      price: parseFloat(rate.costi.costo)
    })
  }
  return formattedRate;
}

function formatServices (services) {
  let formattedServices = [];
  if (services.data.constructor !== Array) {
    let serviceArray = []
    serviceArray.push(services.data)
    services.data = serviceArray
  }
  let serviceFound = false;
    services.data.forEach((day) => {
      // scorro la lista dei giorni che includono la lista dei servizi disponibili
      day.lista.servizio.forEach((service) => {
        // scorro tutti i servizi disponibili per questo giorno
        // controllo se il servizio è già presente nell'array
        serviceFound = false;
        formattedServices.forEach((processedService) => {
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
        })
        if (!serviceFound) {
          formattedServices.push({
            id: parseInt(service.idservizio),
            fascia: service.idfascia,
            name: service.nomeservizio,
            description: service.descrizioneservizio,
            image: service.fotoservizio.replace(/\s+/g, '%20'),
            price: service.prezzoservizio,
            fullStay: (service.interosogg === 'true'),
            qty: 0,
            days: [
              {
                date: day.$.date,
                quantity: service.numerodisponibile,
                max: 1000,
                selected: 0,
                price: service.prezzoservizio
              }
            ]
          });
        }
      });
    });
  return formattedServices;
}