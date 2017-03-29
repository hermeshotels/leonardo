import xmlParser from './xmlparser';
export default {
  format: (xmlData, cb) => {
    xmlParser.parseString(xmlData, (error, xml) => {
      console.log(xml)
      if (error) return cb(error, null);
      let codes = []
      if (xml.errore) {
        return cb(xml.errore, null)
      }
      if (xml.datiprenotazione.prenotazione.constructor === Array) {
        xml.datiprenotazione.prenotazione.forEach((pren) => {
          codes.push(pren.codice);
        });
      } else {
        codes.push(xml.datiprenotazione.prenotazione.codice)
      }
      return cb(null, codes);
    });
  }
}