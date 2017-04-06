'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logger = new _winston2.default.Logger({
  exitOnError: false,
  transports: [new _winston2.default.transports.Console({ level: 'verbose' }), new _winston2.default.transports.File({ filename: 'godblessyou.log', level: 'error' })]
});
exports.default = logger;