'use strict';

var _channel = require('../formatters/channel');

var _channel2 = _interopRequireDefault(_channel);

var _calendar = require('../formatters/calendar');

var _calendar2 = _interopRequireDefault(_calendar);

var _dispo = require('../formatters/dispo');

var _dispo2 = _interopRequireDefault(_dispo);

var _portal = require('../formatters/portal');

var _portal2 = _interopRequireDefault(_portal);

var _confirm = require('../formatters/confirm');

var _confirm2 = _interopRequireDefault(_confirm);

var _recover = require('../formatters/recover');

var _recover2 = _interopRequireDefault(_recover);

var _reservation = require('../formatters/reservation');

var _reservation2 = _interopRequireDefault(_reservation);

var _voucher = require('../formatters/voucher');

var _voucher2 = _interopRequireDefault(_voucher);

var _package = require('../formatters/package');

var _package2 = _interopRequireDefault(_package);

var _service = require('../formatters/service');

var _service2 = _interopRequireDefault(_service);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _xvfb = require('xvfb');

var _xvfb2 = _interopRequireDefault(_xvfb);

var _nightmare = require('nightmare');

var _nightmare2 = _interopRequireDefault(_nightmare);

var _ajv = require('ajv');

var _ajv2 = _interopRequireDefault(_ajv);

var _q = require('q');

var _q2 = _interopRequireDefault(_q);

var _logger = require('../logger');

var _logger2 = _interopRequireDefault(_logger);

var _redis = require('redis');

var _redis2 = _interopRequireDefault(_redis);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var redisClient = _redis2.default.createClient();

module.exports = function (ApiGateway) {
  ApiGateway.channel = function (channel, hotel, language, cb) {
    /*
      Recupera le informazioni dal canale
    */
    var qs = {
      ca_id: channel,
      ln_id: language || 2,
      ho_id: hotel || ''
    };

    _request2.default.get({
      url: 'https://secure.ermeshotels.com/customersflash/hotellist.do?method=hotelList',
      qs: qs,
      encoding: 'binary',
      useQueryString: true
    }, function (error, response, data) {
      if (error) return cb(error, null);
      _channel2.default.format(data, function (error, channel) {
        if (error) return cb(error, null);
        return cb(null, channel);
      });
    });
  };

  ApiGateway.calendar = function (channel, hotel, month, year, cb) {
    var qs = {
      ca_id: channel,
      ho_id: hotel,
      mese: month,
      anno: year
    };
    _request2.default.get({
      url: 'https://secure.ermeshotels.com/customersflash/calendar.do?method=calendar',
      qs: qs,
      encoding: 'binary',
      useQueryString: true
    }, function (error, response, data) {
      if (error) return cb(error, null);
      _calendar2.default.format(data, function (error, calendar) {
        if (error) return cb(error, null);
        return cb(null, calendar);
      });
    });
  };

  ApiGateway.checkDispo = function (filters, cb) {
    /*
    Richiesta serve per log ermes
    */
    var qs = {
      ca_id: filters.channel,
      ho_id: filters.hotel,
      ln_id: filters.language,
      dataArrivo: filters.arrival,
      dataPartenza: filters.departure,
      richiesta: true,
      servizi: false,
      cross: false
    };
    /*
    Il cross booking funziona solo se la richiesta prevede
    una sola camera
    */
    if (filters.rooms.length === 1) {
      qs.cross = true;
    }

    // Check for pre-selected rooms
    var lastRoomIdx = null;
    filters.rooms.forEach(function (room, index) {
      if (room.rate && room.rate.id) {
        qs['ar_id' + (index + 1)] = room.rate.id;
      } else {
        if (lastRoomIdx === null) {
          lastRoomIdx = index;
        }
      }
    });

    // set search param based on the last room in the list of rooms
    qs.adulti = filters.rooms[lastRoomIdx].adults;
    qs.bambini = filters.rooms[lastRoomIdx].childs;

    // if there are childs lest add the ages
    if (filters.rooms[lastRoomIdx].childs > 0) {
      qs.avail_etaBambini = filters.rooms[lastRoomIdx].childsAge.join(',');
    }

    if (filters.macroId) {
      qs.macroId = filters.macroId;
    }

    if (filters.username && filters.password) {
      qs.username = filters.username;
      qs.password = filters.password;
    }

    if (filters.promocode) {
      qs.promoCode = filters.promocode;
    }

    _logger2.default.verbose('[CHECKDISPO] ' + JSON.stringify(qs));

    _request2.default.get({
      url: 'https://secure.ermeshotels.com/customersflash/avail.do?method=search',
      qs: qs,
      encoding: 'binary',
      useQueryString: true
    }, function (error, response, data) {
      if (error) return cb(error, null);
      _dispo2.default.format(data, function (error, dispo) {
        if (error) return cb(error, null);
        // Registro il risultato della conversione
        ApiGateway.app.models.BolRequest.findOrCreate({
          where: {
            hotelId: qs.ho_id
          }
        }, {
          hotelId: qs.ho_id,
          success: dispo.rooms ? 1 : 0,
          fail: !dispo.rooms ? 1 : 0
        }, function (error, instance, created) {
          if (error) return cb(error, null);
          if (instance) {
            // document found
            var update = {};
            if (dispo.rooms) {
              update['success'] = instance.success + 1;
            } else {
              update['fail'] = instance.fail + 1;
            }
            instance.updateAttributes(update);
          }
        });
        // return the dispo query
        return cb(null, dispo);
      });
    });
  };
  // TODO: creare remote method for calls
  ApiGateway.checkService = function (filters, cb) {
    var qs = {
      ca_id: filters.channel,
      ho_id: filters.hotel,
      ln_id: filters.language,
      dataArrivo: filters.arrival,
      dataPartenza: filters.departure,
      cm_id: []
    };
    if (filters.rooms && filters.rooms.constructor === Array) {
      qs.cm_id = filters.rooms;
    }
    // cm_id - array di camere selezionate per servizi specifici
    _logger2.default.verbose('[CHEFCK-SERVICE] ' + JSON.stringify(qs));
    _request2.default.get({
      useQuerystring: true,
      url: 'https://secure.ermeshotels.com/customersflash/serviceAvail.do?method=search',
      qs: qs,
      encoding: 'binary'
    }, function (error, response, data) {
      console.log(response);
      if (error) return cb(error, null);
      _service2.default.format(data, function (error, services) {
        if (error) return cb(error, null);
        return cb(null, services);
      });
    });
  };

  ApiGateway.packList = function (channel, hotel, packid, cb) {
    var qs = {
      ca_id: channel,
      ho_id: hotel
    };
    if (packid) {
      qs.pcId = packid;
    }
    _logger2.default.verbose('[CHECKPACK] ' + JSON.stringify(qs));
    _request2.default.get({
      url: 'https://secure.ermeshotels.com/customersflash/package.do?method=search',
      qs: qs,
      enconding: 'binary',
      useQueryString: true
    }, function (error, response, data) {
      if (error) return cb(error, null);
      _package2.default.format(data, function (error, packages) {

        if (error) return cb(error, null);
        return cb(null, packages);
      });
    });
  };

  ApiGateway.checkPortal = function (filters, cb) {
    var qs = {
      ca_id: filters.channel,
      lc_id: filters.location || '',
      ln_id: filters.language || 2,
      dataArrivo: filters.arrival,
      dataPartenza: filters.departure
    };

    // inserisco i parametri per le camere
    filters.rooms.forEach(function (room, index) {
      if (index === 0) {
        qs.adulti = room.adults;
        qs.bambini = room.childs || 0;
        if (room.childs > 0) {
          qs.etaBambini = room.childsAge.join(',');
        }
      } else {
        qs['adulti' + (index + 1)] = room.adults;
        qs['bambini' + (index + 1)] = room.childs || 0;
        if (room.childs > 0) {
          qs['etaBambini' + (index + 1)] = room.childsAge.join(',');
        }
      }
    });

    // codice cliente se specificato

    if (filters.customerId) {
      qs.cl_id = customerId;
    }

    _request2.default.get({
      'url': 'https://secure.ermeshotels.com/customersflash/availChannelCheck.do?method=search',
      qs: qs,
      encoding: 'binary',
      useQueryString: true
    }, function (error, response, data) {
      if (error) return cb(error, null);
      _portal2.default.format(data, function (error, dispo) {
        if (error) return cb(error, null);
        return cb(null, dispo);
      });
    });
  };

  ApiGateway.confirm = function (reservationData, cb) {

    var qs = {
      ca_id: reservationData.channel,
      ho_id: reservationData.hotel,
      ln_id: reservationData.language,
      dataArrivo: reservationData.arrival,
      dataPartenza: reservationData.departure,
      nominativo: reservationData.details.fullname,
      indirizzo: reservationData.details.address,
      cap: reservationData.details.zip,
      citta: reservationData.details.city,
      provincia: reservationData.details.province,
      nazione: reservationData.details.country,
      mail: reservationData.details.email,
      smoking: false,
      telefono: reservationData.details.phone,
      note: reservationData.details.note,
      tipoCarta: reservationData.card.type,
      numeroCarta: reservationData.card.number,
      scadenzaCarta: reservationData.card.expire,
      titolareCarta: reservationData.card.holder,
      cvCarta: reservationData.card.cvv,
      servizi: ''
    };
    /*
    Parse delle camere, scorro ogni camera agganciata alla prenotazione
    ed imposto la tariffa selezionata gli adulti i possibili bambini e le
    relative età, se ci sono override di prezzi per la tariffa specifica
    li imposto così da sovrascriverla
    */
    reservationData.rooms.forEach(function (room, index) {
      var indexPrefix = '';
      if (index > 0) {
        indexPrefix = index + 1;
      }
      qs['ar_id' + indexPrefix] = room.rate.id;
      qs['adulti' + indexPrefix] = room.adults;
      qs['bambini' + indexPrefix] = room.childs || 0;
      if (room.childs > 0) {
        qs['avail_etaBambini' + indexPrefix] = room.childsAge.join(',');
      }
      // check if there is a overrided rate
      if (room.rate.overrided) {
        qs['prezzi' + indexPrefix] = [];
        room.rate.prices.forEach(function (day) {
          qs['prezzi' + indexPrefix].push(day.price);
        });
      }
    });
    if (reservationData.promoCode && reservationData.promoCode.length > 0) {
      qs.promoCode = reservationData.promoCode;
    }
    /*
    Parse dei servizi, scorro ogni servizio e controllo se la quantità
    selezionata è maggiore di 0, in caso positivo controllo per quali giorni
    è stato selezionato e lo aggiungo alla prima camera.
    TODO: distinzione dei servizi per camera
    */
    reservationData.services.forEach(function (service) {
      if (service.qty > 0) {
        service.days.forEach(function (day) {
          if (day.selected > 0) {
            qs.servizi += day.date + ';' + service.id + ';' + service.fascia + ';' + day.selected + '/';
          }
        });
      }
    });

    _logger2.default.verbose('[CONFIRM] ' + JSON.stringify(qs));

    _request2.default.post({
      url: 'https://secure.ermeshotels.com/customersflash/guestdata.do?method=confirm',
      qs: qs,
      encoding: 'binary',
      useQueryString: true
    }, function (error, response, data) {
      if (error) return cb(error, null);
      _reservation2.default.format(data, function (error, reservation) {
        if (error) return cb(error, null);
        ApiGateway.app.models.BolReservation.create({
          code: Math.random().toString(36).substr(2, 9),
          rescodes: reservation,
          date: new Date(),
          hotel: reservationData.hotel,
          channel: reservationData.channel,
          email: reservationData.details.email
        }, function (error, model) {
          if (error) return cb(error, null);
          return cb(null, model);
        });
      });
    });
  };

  ApiGateway.recover = function (reservation, cb) {
    ApiGateway.app.models.BolReservation.findOne({
      where: {
        rescodes: {
          inq: reservation.codes
        }
      }
    }, function (error, data) {
      if (error) return cb(error, null);
      if (!data) {
        // reservation does not exist, lest create it and return back to the client
        recoverFromErmes(reservation.channel, reservation.codes, reservation.email).then(function (reslist) {
          if (reslist[0].indexOf('errore') > -1) {
            _logger2.default.verbose('[RECOVER] Reservation not found code: ' + data.rescodes + ', channel: ' + data.channel + ', email: ' + data.email);
            // errore nel recupero della prenotazione
            return cb(null, null);
          }
          _logger2.default.verbose('[RECOVER] Given code ' + reservation.codes + ' does not exist in the current DB');
          ApiGateway.app.models.BolReservation.create({
            code: Math.random().toString(36).substr(2, 9),
            rescodes: reservation.codes,
            date: new Date(),
            hotel: reservation.hotel,
            channel: reservation.channel,
            email: reservations[0].datiprenotazione.prenotazione.mail.replace(/\s/g, '')
          }, function (error, model) {
            if (error) return cb(error, null);
            _logger2.default.verbose('[RECOVER] New reservation created, send back to the client with the new internal code');
            return cb(null, model);
          });
        }).fail(function (error) {
          return cb(error, null);
        });
      } else {
        // reservation exist, return it
        _logger2.default.verbose('[RECOVER] Given code ' + reservation.codes + ' reservation found! Send back to the client.');
        return cb(null, data);
      }
    });
  };

  ApiGateway.recoverByCode = function (code, cb) {
    ApiGateway.app.models.BolReservation.findOne({
      where: {
        code: code
      }
    }, function (error, data) {
      if (error) return cb(error, null);
      if (!data) {
        _logger2.default.verbose('[RECOVER] Reservation not found: ' + data + ' with code: ' + code);
        return cb(null, null);
      }
      recoverFromErmes(data.channel, data.rescodes, data.email).then(function (reslist) {
        if (reslist[0].indexOf('errore') > -1) {
          _logger2.default.verbose('[RECOVER] Reservation not found code: ' + data.rescodes + ', channel: ' + data.channel + ', email: ' + data.email);
          // errore nel recupero della prenotazione
          return cb(null, null);
        }
        _voucher2.default.format(reslist, data.code, function (error, voucher) {
          if (error) return cb(error, null);
          return cb(null, voucher);
        });
      }).fail(function (error) {
        return cb(error, null);
      });
    });
  };

  ApiGateway.delete = function (id, code, cb) {
    ApiGateway.app.models.BolReservation.findOne({
      where: {
        rescodes: code
      }
    }, function (error, data) {
      if (error) return cb(error, null);
      if (data) {
        var index = data.rescodes.indexOf(code);
        if (index > -1 && data.rescodes.length > 1) {
          data.rescodes.splice(index, 1);
          data.save();
        }
      }
      _request2.default.get({
        url: 'https://secure.ermeshotels.com/customersflash/delete.do?method=delete',
        qs: {
          pr_id: id,
          ca_id: data.channel
        },
        useQueryString: true,
        enconding: 'binary'
      }, function (error, response, data) {
        if (error) return cb(error, null);
        if (data.indexOf('errore') > -1) {
          _logger2.default.silly('Reservation not found code: ' + code);
          return cb(null, { cancelled: false, error: 'Reservation not found' });
        }
        return cb(null, { cancelled: true, code: code });
      });
    });
  };

  ApiGateway.scrapeGoogle = function (hotel, uri, dates, cb) {

    var cacheValue = redisClient.hget(hotel, dates, function (err, replies) {
      if (err) return cb(err, null);
      if (replies) {
        // there is cachce data
        return cb(null, JSON.parse(replies));
      } else {
        var xvfb = new _xvfb2.default();
        xvfb.start(function (error, xvfbProcess) {
          if (error) console.log(error);
          var nightmare = (0, _nightmare2.default)({
            waitTimeout: 190000
          });
          nightmare.goto('https://google.com/search?q=' + uri + '#ahotel_dates=' + dates).wait(function (dates) {
            return document.querySelector('.lujscdp-hci').getAttribute('data-luh-i') === dates.substr(0, dates.indexOf(','));
          }, dates).evaluate(function () {
            var rates = [];
            var rateElements = document.getElementsByClassName('_dkf');
            for (var j = 0; j < rateElements.length; j++) {
              var rate = {
                provider: '',
                rate: rateElements[j].getAttribute('data-dp').replace(/[$£€]/, '')
              };
              for (var i = 0; i < rateElements[j].childNodes.length; i++) {
                if (rateElements[j].childNodes[i].className == "_Tjf") {
                  rate.provider = rateElements[j].childNodes[i].getAttribute('alt');
                }
              }
              rates.push(rate);
            }
            return rates;
          }).end().then(function (document) {
            xvfb.stop(function (error) {
              if (error) console.log(error);
            });
            redisClient.hset(hotel, dates, JSON.stringify(document));
            return cb(null, document);
          }).catch(function (error) {
            return cb(error, null);
          });
        });
      }
    });
  };

  function recoverFromErmes(channel, codes, email) {
    var defer = _q2.default.defer();
    var progress = 0;
    var resList = [];
    codes.forEach(function (code) {
      _logger2.default.verbose('[RECOVER] Recover by code from ermes ' + code + ', channel: ' + channel + ', email: ' + email);
      _request2.default.get({
        url: 'https://secure.ermeshotels.com/customersflash/retrieve.do?method=retrieve',
        qs: { ca_id: channel, codice_prenotazione: code, mail: email },
        useQueryString: true,
        encoding: 'binary'
      }, function (error, response, data) {
        console.log(response);
        if (error) {
          throw new Error(error);
        }
        resList.push(data);
        progress++;
        if (progress === codes.length) {
          defer.resolve(resList);
        }
      });
    });
    return defer.promise;
  }

  ApiGateway.remoteMethod('channel', {
    http: {
      verb: 'GET'
    },
    accepts: [{ arg: 'channel', type: 'string', required: true }, { arg: 'hotel', type: 'string' }, { arg: 'language', type: 'string' }],
    returns: { arg: 'channel', type: 'object' }
  });

  ApiGateway.remoteMethod('calendar', {
    http: {
      verb: 'GET'
    },
    accepts: [{ arg: 'channel', type: 'string', required: true }, { arg: 'hotel', type: 'string', required: true }, { arg: 'month', type: 'string', required: true }, { arg: 'year', type: 'string', required: true }],
    returns: { arg: 'calendar', type: 'Object' }
  });

  ApiGateway.remoteMethod('checkDispo', {
    http: {
      verb: 'POST'
    },
    accepts: {
      arg: 'filters',
      type: 'Object',
      http: {
        source: "body"
      },
      required: true
    },
    returns: { arg: 'dispo', type: 'Object' }
  });

  ApiGateway.remoteMethod('checkService', {
    http: {
      verb: 'POST'
    },
    accepts: {
      arg: 'filters',
      type: 'Object',
      http: {
        source: "body"
      },
      required: true
    },
    returns: { arg: 'services', type: 'Object' }
  });

  ApiGateway.remoteMethod('packList', {
    http: {
      verb: 'GET'
    },
    accepts: [{ arg: 'channel', type: 'string', required: true }, { arg: 'hotel', type: 'string', required: true }, { arg: 'packid', type: 'string', required: false }],
    returns: { arg: 'packages', type: 'Object' }
  });

  ApiGateway.remoteMethod('checkPortal', {
    http: {
      verb: 'POST'
    },
    accepts: {
      arg: 'filters',
      type: 'Object',
      http: {
        source: "body"
      },
      required: true
    },
    returns: { arg: 'dispo', type: 'Object' }
  });

  ApiGateway.remoteMethod('confirm', {
    http: {
      verb: 'POST'
    },
    accepts: {
      arg: 'reservation',
      type: 'Object',
      http: {
        source: "body"
      },
      required: true
    },
    returns: { arg: 'voucher', type: 'Object' }
  });

  ApiGateway.remoteMethod('recover', {
    http: {
      verb: 'POST'
    },
    accepts: {
      arg: 'reservation',
      type: 'Object',
      http: {
        source: "body"
      },
      required: true
    },
    returns: { arg: 'voucher', type: 'Object' }
  });

  ApiGateway.remoteMethod('recoverByCode', {
    http: {
      verb: 'GET'
    },
    accepts: [{ arg: 'code', type: 'string', required: true }],
    returns: { arg: 'voucher', type: 'Object' }
  });

  ApiGateway.remoteMethod('delete', {
    http: {
      verb: 'GET'
    },
    accepts: [{ arg: 'id', type: 'string', required: true }, { arg: 'code', type: 'string', required: true }],
    returns: { arg: 'deleted', type: 'Object' }
  });

  ApiGateway.remoteMethod('scrapeGoogle', {
    http: {
      verb: 'GET'
    },
    accepts: [{ arg: 'hotel', type: 'string', required: true }, { arg: 'uri', type: 'string', required: true }, { arg: 'dates', type: 'string', required: true }],
    returns: { arg: 'scrape', type: 'Object' }
  });
};