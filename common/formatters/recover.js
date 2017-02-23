import xmlParser from './xmlparser';
export default {
  format: (xmlData, cb) => {
    xmlParser.parseString(xmlData, (error, xml) => {
      if (error) return cb(error, null);
      let voucher = {
        id: xml.datiprenotazione.prenotazione.id,
        code: xml.datiprenotazione.prenotazione.codice,
        arrival: xml.datiprenotazione.prenotazione.dataarrivo,
        departure: xml.datiprenotazione.prenotazione.partenza,
        adults: xml.datiprenotazione.prenotazione.adulti,
        childs: xml.datiprenotazione.prenotazione.bambini,
        rooms: xml.datiprenotazione.prenotazione.camere
      }
      return cb(null, voucher);
    });
  }
}