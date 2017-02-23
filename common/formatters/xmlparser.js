import xml2js from 'xml2js';
const parser = new xml2js.Parser({
  explicitArray: false
});
export default parser;