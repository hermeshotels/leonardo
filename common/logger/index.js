import winston from 'winston'
let logger = new (winston.Logger)({
  exitOnError: false,
  transports: [
    new (winston.transports.Console)({ level: 'verbose' }),
    new (winston.transports.File)({ filename: 'godblessyou.log', level: 'error' })
  ]
})
export default logger