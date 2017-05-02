import xmlParser from './xmlparser';
export default {
  format: (xmlData, cb) => {
    xmlParser.parseString(xmlData, (error, xml) => {
      if (error) return cb(error, null);
      if (xml.errore) return cb(xml.errore, null);
      let packList = []
      if (xml.pacchettihotel && xml.pacchettihotel.pacchetto) {
        if (xml.pacchettihotel.pacchetto.constructor !== Array) {
          xml.pacchettihotel.pacchetto = [xml.pacchettihotel.pacchetto]
        }
        xml.pacchettihotel.pacchetto.forEach((pack) => {
          packList.push(formatPackage(pack))
        })
        return cb(null, packList);
      } else {
        return cb(null, null);
      }
    });
  }
}

function formatPackage(pack) {
  let formattedPackage = {
    id: parseInt(pack.id),
    name: pack.nome,
    description: pack.descrizione,
    includes: {
      breakfast: (pack.colazione === 'true'),
      lunch: (pack.pranzo === 'true'),
      dinner: (pack.cena === 'true')
    },
    dates: {
      startDate: pack.datainizio,
      endDate: pack.datafine,
    },
    restrictions: {
      childs: parseInt(pack.bambini),
      minStay: parseInt(pack.minstay),
      maxStay: parseInt(pack.maxstay),
      advance: parseInt(pack.advance),
      lastminute: parseInt(pack.lastminute)
    },
    cancellationPolicy: pack.cancellation,
    arrivals: []
  }
  if (pack.arrivaldomenica === 'true') {
    formattedPackage.arrivals.push('0')
  }
  if (pack.arrivallunedi === 'true') {
    formattedPackage.arrivals.push('1')
  }
  if (pack.arrivalmartedi === 'true') {
    formattedPackage.arrivals.push('2')
  }
  if (pack.arrivalmercoledi === 'true') {
    formattedPackage.arrivals.push('3')
  }
  if (pack.arrivalgiovedi === 'true') {
    formattedPackage.arrivals.push('4')
  }
  if (pack.arrivalvenerdi === 'true') {
    formattedPackage.arrivals.push('5')
  }
  if (pack.arrivalsabato === 'true') {
    formattedPackage.arrivals.push('6')
  }
  if (pack.foto.length > 0) {
    formattedPackage.image = pack.foto.replace(/\s+/g, '%20')
  }
  return formattedPackage;
}