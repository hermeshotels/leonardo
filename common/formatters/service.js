import xmlParser from './xmlparser';
export default {
  format: (xmlData, cb) => {
    xmlParser.parseString(xmlData, (error, xml) => {
      if (error) return cb(error, null);
      let services = []
      console.log(xml)
      if (xml.datidisponibilita.servizi && xml.datidisponibilita.servizi.data) {
        services = formatServices(xml.datidisponibilita.servizi);
        return cb(null, services);
      } else {
        return cb(null, services)
      }
    });
  }
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
      if (day.lista.servizio.constructor !== Array) {
        day.lista.servizio = [day.lista.servizio]
      }
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
            image: ((service.fotoservizio && service.fotoservizio.length > 0) ? service.fotoservizio.replace(/\s+/g, '%20') : ''),
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