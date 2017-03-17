import xmlParser from './xmlparser';
export default {
  format: (xmlData, cb) => {
    xmlParser.parseString(xmlData, (error, xml) => {
      if (error) return cb(error, null);
      /*
      Eseguo il parse degli hotel disponibili per le date dichiarate.
      Ermes ritorna anche hotel non disponibili con tariffa a 0, li escludo
      */
      let availableHotels = [];
      if (!xml.errore) {
        if (xml.checkdisponibilita.hotellist.hotel) {
          if (xml.checkdisponibilita.hotellist.hotel.constructor === Array) {
            xml.checkdisponibilita.hotellist.hotel.forEach((hotel) => {
              if (parseFloat(hotel.prezzominimo) > 0) {
                availableHotels.push(formatHotel(hotel));
              }
            });
          }
        }
      }
      return cb(null, availableHotels);
    });
  }
}

function formatHotel (hotel) {
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
  }
}