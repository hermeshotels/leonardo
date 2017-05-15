import xmlParser from './xmlparser';
export default {
  format: (xmlData, cb) => {
    xmlParser.parseString(xmlData, (error, xml) => {
      if (error) return cb(error, null);
      let calendar = [];
      if (xml.calendario) {
        if (xml.calendario.mese && xml.calendario.mese.constructor === Array) {
          xml.calendario.mese.forEach((month) => {
            month.giorno.forEach((day) => {
              calendar.push({
                date: day.numerocompleto,
                available: (day.disponibile === 'true'),
                rooms: parseInt(day.numerocamere),
                minStay: parseInt(day.minstay),
                maxStay: parseInt(day.maxstay)
              });
            });
          });
        }
      }
      return cb(null, calendar);
    })
  }
}