'use strict';
import channelFormatter from '../formatters/channel';
import calendarFormatter from '../formatters/calendar';
import dispoFormatter from '../formatters/dispo';
import portalFormatter from '../formatters/portal';
import confirmFormatter from '../formatters/confirm';
import recoverFormatter from '../formatters/recover';
import reservationFormatter from '../formatters/reservation';
import voucherFormatter from '../formatters/voucher';
import request from 'request';
import ajv from 'ajv';
import Q from 'q';

module.exports = function(ApiGateway) {
  ApiGateway.channel = function (channel, hotel, language, cb) {
    /*
      Recupera le informazioni dal canale
    */
    let qs = {
      ca_id: channel,
      ln_id: language || 2,
      ho_id: hotel || ''
    }
  
    request.get({
      url: 'https://secure.ermeshotels.com/customersflash/hotellist.do?method=hotelList',
      qs: qs,
      useQueryString: true
    }, (error, response, data) => {
      if (error) return cb(error, null);
      channelFormatter.format(data, (error, channel) => {
        if (error) return cb(error, null);
        return cb(null, channel);
      });
    });
  }

  ApiGateway.calendar = function (channel, hotel, month, year, cb) {
    let qs = {
      ca_id: channel,
      ho_id: hotel,
      mese: month,
      anno: year
    }
    request.get({
      url: 'https://secure.ermeshotels.com/customersflash/calendar.do?method=calendar',
      qs: qs,
      useQueryString: true
    }, (error, response, data) => {
      if (error) return cb(error, null);
      calendarFormatter.format(data, (error, calendar) => {
        if (error) return cb(error, null);
        return cb(null, calendar)
      });
    });
  }

  ApiGateway.checkDispo = function (filters, cb) {
    let qs = {
      ca_id: filters.channel,
      ho_id: filters.hotel,
      ln_id: filters.language,
      dataArrivo: filters.arrival,
      dataPartenza: filters.departure,
    }

    // Check for pre-selected rooms
    filters.rooms.forEach((room, index) => {
      if (room.rate && room.rate.id) {
        qs['ar_id' + (index + 1)] = room.rate.id
      }
    })

    // set search param based on the last room in the list of rooms
    let lastRoomIdx = filters.rooms.length - 1
    qs.adulti = filters.rooms[lastRoomIdx].adults
    qs.bambini = filters.rooms[lastRoomIdx].childs

    // if there are childs lest add the ages
    if (filters.rooms[lastRoomIdx].childs > 0) {
      qs.avail_etaBambini = filters.rooms[lastRoomIdx].childsAge.join(',')
    }

    if (filters.macroId) {
      qs.macroId = filters.macroId
    }

    if (filters.username && filters.password) {
      qs.username = filters.username
      qs.password = filters.password
    }

    if (filters.promocode) {
      qs.promocode = filters.promocode
    }

    request.get({
      url: 'https://secure.ermeshotels.com/customersflash/avail.do?method=search',
      qs: qs,
      useQueryString: true
    }, (error, response, data) => {
      if (error) return cb(error, null)
      dispoFormatter.format(data, (error, dispo) => {
        if (error) return cb(error, null)
        return cb(null, dispo)
      })
    })
  }

  ApiGateway.checkPortal = function(filters, cb) {
    let qs = {
      ca_id: filters.channel,
      lc_id: filters.location || '',
      ln_id: filters.language || 2,
      dataArrivo: filters.arrival,
      dataPartenza: filters.departure,
    }

    // inserisco i parametri per le camere
    filters.rooms.forEach((room, index) => {
      if (index === 0) {
        qs.adulti = room.adults;
        qs.bambini = room.childs || 0;
        if (room.childs > 0) {
          qs.etaBambini = room.childsAge.join(',')
        }
      } else {
        qs['adulti' + (index + 1)] = room.adults;
        qs['bambini' + (index + 1)] = room.childs || 0;
        if (room.childs > 0) {
          qs['etaBambini' + (index + 1)] = room.childsAge.join(',')
        }
      }
    })

    // codice cliente se specificato

    if (filters.customerId) {
      qs.cl_id = customerId
    }

    request.get({
      'url': 'https://secure.ermeshotels.com/customersflash/availChannelCheck.do?method=search',
      qs: qs,
      useQueryString: true
    }, (error, response, data) => {
      if (error) return cb(error, null)
      portalFormatter.format(data, (error, dispo) => {
        if (error) return cb(error, null)
        return cb(null, dispo)
      })
    })
  }

  ApiGateway.confirm = (reservation, cb) => {
    // json validation
    let schema = {
      type: 'object',
      required: [
        'channel',
        'hotel',
        'arrival',
        'departure',
        'fullname',
        'zip',
        'address',
        'city',
        'province',
        'country',
        'mail',
        'note',
        'cardType',
        'cardNumber',
        'carDate',
        'cardName',
        'cardCv'
      ]
    }

    let valid = ajv.validate(schema, reservation);
    
    let qs = {
      ca_id: reservation.channel,
      ho_id: reservation.hotel,
      ln_id: reservation.language,
      dataArrivo: reservation.arrival,
      dataPartenza: reservation.departure,
      nominativo: reservation.details.fullname,
      indirizzo: reservation.details.address,
      cap: reservation.details.zip,
      provincia: reservation.details.province,
      nazione: reservation.details.country,
      mail: reservation.details.email,
      smoking: false,
      note: reservation.note,
      tipoCarta: reservation.card.type,
      numeroCarta: reservation.card.number,
      scadenzaCarta: reservation.card.expire,
      titolareCarta: reservation.card.holder,
      cvCarta: reservation.card.cv
    }

    reservation.rooms.forEach((room, index) => {
      let indexPrefix = '';
      if (index > 0) {
        indexPrefix = (index + 1)
      }
      qs['adults' + indexPrefix] = room.adults
      qs['childs' + indexPrefix] = room.childs || 0
      if (room.childs > 0) {
        qs['avail_etaBambini' + indexPrefix] = room.childsAge.join(',')
      }
      // check if there is a overrided rate
      if (room.rate.overrided) {
        qs['prezzi' + indexPrefix] = []
        room.rate.prices.forEach((day) => {
          reservationData['prezzi' + indexPrefix].push(day.price)
        })
      }
    })

    request.get({
      url: 'https://secure.ermeshotels.com/customersflash/guestdata.do?method=confirm',
      qs: qs,
      userQueryString: true
    }, (error, response, data) => {
      if (error) return cb(error, null)
      reservationFormatter.format(data, (error, reservation) => {
        if (error) return cb(error, null);
        ApiGateway.app.models.BolReservation.create({
          code: Math.random().toString(36).substr(2, 9),
          rescodes: reservation,
          date: new Date(),
          hotel: reservationData.hotel,
          channel: reservationData.channel,
          email: reservationData.mail
        }, (error, model) => {
          if (error) return cb(error, null);
          return cb(null, model);
        });
      });
    })
  }

  ApiGateway.recover = (reservation, cb) => {
    ApiGateway.app.models.BolReservation.findOne({
      where: {
        rescodes: {
          inq: reservation.codes
        }
      }
    }, (error, data) => {
      if (error) return cb(error, null);
      if (data) {
       recoverFromErmes(reservation.channel, data.rescodes, reservation.email).then((reslist) => {
          voucherFormatter.format(reslist, data.code, (error, voucher) => {
            if (error) return cb(error, null);
            return cb(null, voucher);
          });
        }).fail((error) => {
          return cb(error, null);
        }); 
      } else {
        return cb(null, {})
      }
    });
  }

  ApiGateway.recoverByCode = (code, cb) => {
    ApiGateway.app.models.BolReservation.findOne({
      where: {
        code: code
      }
    }, (error, data) => {
      if (error) return cb(error, null);
      recoverFromErmes(data.channel, data.rescodes, data.email).then((reslist) => {
        voucherFormatter.format(reslist, data.code, (error, voucher) => {
          if (error) return cb(error, null);
          return cb(null, voucher);
        });
      }).fail((error) => {
        return cb(error, null);
      });
    });
  }

  function recoverFromErmes (channel, codes, email) {
    let defer = Q.defer()
    let progress = 0
    let resList = []
    codes.forEach((code) => {
      request.get({
        url: 'https://seure.ermeshotels.com/customersflash/retrieve.do?method=retrieve',
        qs: { ca_id: channel, codice_prenotazione: code, mail: email},
        userQueryString: true
      }, (error, response, data) => {
        if (error) throw new Error(error)
        resList.push(data);
        progress++;
        if (progress === codes.length) {
          defer.resolve(resList);
        }
      })
    })
    return defer.promise;
  }

  ApiGateway.remoteMethod('channel', {
    http: {
      verb: 'GET'
    },
    accepts: [
      {arg: 'channel', type: 'string', required: true},
      {arg: 'hotel', type: 'string'},
      {arg: 'language', type: 'string'}
    ],
    returns: { arg: 'channel', type: 'object'}
  });

  ApiGateway.remoteMethod('calendar', {
    http: {
      verb: 'GET'
    },
    accepts: [
      {arg: 'channel', type: 'string', required: true},
      {arg: 'hotel', type: 'string', required: true},
      {arg: 'month', type: 'string', required: true},
      {arg: 'year', type: 'string', required: true}
    ],
    returns: { arg: 'calendar', type: 'Object'}
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
    returns: {arg: 'dispo', type: 'Object'}
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
    returns: {arg: 'dispo', type: 'Object'}
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
    returns: {arg: 'voucher', type: 'Object'}
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
    returns: { arg: 'voucher', type: 'Object'}
  });

  ApiGateway.remoteMethod('recoverByCode', {
    http: {
      verb: 'GET'
    },
    accepts: [
      {arg: 'code', type: 'string', required: true}
    ],
    returns: { arg: 'voucher', type: 'Object'}
  });

};