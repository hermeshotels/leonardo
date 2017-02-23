import xmlParser from './xmlparser';
export default {
  format: (xmlData, cb) => {
    xmlParser.parseString(xmlData, function (error, xml) {
      return cb(xml);
    });
  }
}