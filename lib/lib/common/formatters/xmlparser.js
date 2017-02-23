'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _xml2js = require('xml2js');

var _xml2js2 = _interopRequireDefault(_xml2js);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var parser = new _xml2js2.default.Parser({
  explicitArray: false
});
exports.default = parser;