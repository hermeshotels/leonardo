import xmlParser from './xmlparser';
export default {
  format: (xmlData, cb) => {
    xmlParser.parseString(xmlData, function (error, xml) {
      if (error) return cb(error, null);
      if (xml.errore) {
        let error = new Error('no channel found')
        error.statusCode = 404
        return cb(error, null)
      }
      if (!xml.daticanale || xml.daticanale.hotellist === '\r\n\t\r\n') {
        let error = new Error('no hotels found')
        error.statusCode = 404
        return cb(error, null)
      }
      if (xml.daticanale) {
        let channel = {
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
        if (xml.daticanale.mappa && xml.daticanale.mappa.listacitta) {
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
            })
          }
        }
        // setup active hotels
        if (xml.daticanale.hotellist.hotel.constructor === Array) {
          xml.daticanale.hotellist.hotel.forEach(function (hotel) {
            channel.hotels.push(formatHotel(hotel));
          });
        } else {
          channel.hotels.push(formatHotel(xml.daticanale.hotellist.hotel));
        }
        return cb(null, channel);
      } else {
        return cb(null, {});
      }
    });
  }
}

function formatHotel (hotel) {
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
  }
}