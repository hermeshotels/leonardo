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
import Ajv from 'ajv';
import Q from 'q';
import logger from '../logger';

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
      encoding: 'binary',
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
      encoding: 'binary',
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
      qs.promoCode = filters.promocode
    }

    logger.verbose('checkDispo ' + JSON.stringify(qs))

    request.get({
      url: 'https://secure.ermeshotels.com/customersflash/avail.do?method=search',
      qs: qs,
      encoding: 'binary',
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
      encoding: 'binary',
      useQueryString: true
    }, (error, response, data) => {
      if (error) return cb(error, null)
      portalFormatter.format(data, (error, dispo) => {
        if (error) return cb(error, null)
        return cb(null, dispo)
      })
    })
  }

  ApiGateway.confirm = (reservationData, cb) => {
    /* json validation
    let schema = {
      type: 'object',
      required: [
        'channel',
        'hotel',
        'arrival',
        'departure',
        'details.fullname',
        'details.zip',
        'details.address',
        'details.city',
        'details.province',
        'details.country',
        'details.email',
        'details.note',
        'card.type',
        'card.number',
        'card.expire',
        'card.holder',
        'card.cvv'
      ]
    }

    let ajv = new Ajv()
    let valid = ajv.validate(schema, reservationData);
    */
    
    let qs = {
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
      note: reservationData.details.note,
      tipoCarta: reservationData.card.type,
      numeroCarta: reservationData.card.number,
      scadenzaCarta: reservationData.card.expire,
      titolareCarta: reservationData.card.holder,
      cvCarta: reservationData.card.cvv
    }

    logger.verbose(qs)
    /*
    Parse delle camere, scorro ogni camera agganciata alla prenotazione
    ed imposto la tariffa selezionata gli adulti i possibili bambini e le
    relative età, se ci sono override di prezzi per la tariffa specifica
    li imposto così da sovrascriverla
    */
    reservationData.rooms.forEach((room, index) => {
      let indexPrefix = '';
      if (index > 0) {
        indexPrefix = (index + 1)
      }
      qs['ar_id' + indexPrefix] = room.rate.id
      qs['adulti' + indexPrefix] = room.adults
      qs['bambini' + indexPrefix] = room.childs || 0
      if (room.childs > 0) {
        qs['avail_etaBambini' + indexPrefix] = room.childsAge.join(',')
      }
      // check if there is a overrided rate
      if (room.rate.overrided) {
        qs['prezzi' + indexPrefix] = []
        room.rate.prices.forEach((day) => {
          qs['prezzi' + indexPrefix].push(day.price)
        })
      }
    })
    /*
    Parse dei servizi, scorro ogni servizio e controllo se la quantità
    selezionata è maggiore di 0, in caso positivo controllo per quali giorni
    è stato selezionato e lo aggiungo alla prima camera.
    TODO: distinzione dei servizi per camera
    */
    reservationData.services.forEach((service) => {
      if (service.qty > 0) {
        service.days.forEach((day) => {
          if (day.selected > 0) {
            qs.servizi += `${day.date};${service.id};${service.fascia};${day.selected}/`
          }
        })
      }
    })

    request.get({
      url: 'https://secure.ermeshotels.com/customersflash/guestdata.do?method=confirm',
      qs: qs,
      encoding: 'binary',
      useQueryString: true
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
          email: reservationData.details.email
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
      return cb(null, data)
    });
  }

  ApiGateway.recoverByCode = (code, cb) => {
    ApiGateway.app.models.BolReservation.findOne({
      where: {
        code: code
      }
    }, (error, data) => {
      if (error) return cb(error, null);
      if (!data) {
        return cb(null, null)
      }
      recoverFromErmes(data.channel, data.rescodes, data.email).then((reslist) => {
        if (reslist[0].indexOf('errore') > -1) {
          // errore nel recupero della prenotazione
          return cb(null, null)
        }
        voucherFormatter.format(reslist, data.code, (error, voucher) => {
          if (error) return cb(error, null);
          return cb(null, voucher);
        });
      }).fail((error) => {
        return cb(error, null);
      });
    });
  }

  ApiGateway.delete = (id, code, cb) => {
    ApiGateway.app.models.BolReservation.findOne({
      where: {
        rescodes: code
      }
    }, (error, data) => {
      if (error) return cb(error, null)
      request.get({
        url: 'https://secure.ermeshotels.com/customersflash/delete.do?method=delete',
        qs: {
          pr_id: id,
          ca_id: data.channel
        },
        useQueryString: true,
        enconding: 'binary'
      }, (error, response, data) => {
        if (error) return cb(error, null)
        if (data.indexOf('errore') > -1) {
          return cb(null, {cancelled: false, error: 'Reservation not found'})
        }
        return cb(null, {cancelled: true})
      })
    })
  }

  function recoverFromErmes (channel, codes, email) {
    let defer = Q.defer()
    let progress = 0
    let resList = []
    codes.forEach((code) => {
      request.get({
        url: 'https://secure.ermeshotels.com/customersflash/retrieve.do?method=retrieve',
        qs: { ca_id: channel, codice_prenotazione: code, mail: email},
        useQueryString: true,
        encoding: 'binary'
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

  ApiGateway.remoteMethod('delete', {
    http: {
      verb: 'GET'
    },
    accepts: [
      {arg: 'id', type: 'string', required: true},
      {arg: 'code', type: 'string', required: true}
    ],
    returns: { arg: 'deleted', type: 'Object'}
  });

};