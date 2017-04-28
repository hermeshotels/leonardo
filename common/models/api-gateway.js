'use strict';
import channelFormatter from '../formatters/channel';
import calendarFormatter from '../formatters/calendar';
import dispoFormatter from '../formatters/dispo';
import portalFormatter from '../formatters/portal';
import confirmFormatter from '../formatters/confirm';
import recoverFormatter from '../formatters/recover';
import reservationFormatter from '../formatters/reservation';
import voucherFormatter from '../formatters/voucher';
import packageFormatter from '../formatters/package';
import request from 'request';
import Xvfb from 'xvfb';
import Nightmare from 'nightmare'
import Ajv from 'ajv';
import Q from 'q';
import logger from '../logger';
import redis from 'redis';
const redisClient = redis.createClient();

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
    let lastRoomIdx = null
    filters.rooms.forEach((room, index) => {
      if (room.rate && room.rate.id) {
        qs['ar_id' + (index + 1)] = room.rate.id
      } else {
        if (lastRoomIdx === null) {
          lastRoomIdx = index
        }
      }
    })

    // set search param based on the last room in the list of rooms
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

    logger.verbose('[CHECKDISPO] ' + JSON.stringify(qs))

    request.get({
      url: 'https://secure.ermeshotels.com/customersflash/avail.do?method=search',
      qs: qs,
      encoding: 'binary',
      useQueryString: true
    }, (error, response, data) => {
      if (error) return cb(error, null)
      dispoFormatter.format(data, (error, dispo) => {
        if (error) return cb(error, null)
        // Registro il risultato della conversione
        ApiGateway.app.models.BolRequest.findOrCreate(
          {
            where: {
              hotelId: qs.ho_id
            }
          },
          {
            hotelId: qs.ho_id,
            success: ((dispo.rooms) ? 1 : 0),
            fail: ((!dispo.rooms) ? 1 : 0)
          },
          (error, instance, created) => {
            if (error) return cb(error, null)
            if (instance) {
              // document found
              let update = {}
              if (dispo.rooms) {
                update['success'] = instance.success + 1
              } else {
                update['fail'] = instance.fail + 1
              }
              instance.updateAttributes(update)
            }
          }
        )
        // return the dispo query
        return cb(null, dispo)
      })
    })
  }

  ApiGateway.packList = function(channel, hotel, cb){
    let qs = {
      ca_id: channel,
      ho_id: hotel
    }
    logger.verbose('[CHECKPACK] ' + JSON.stringify(qs))
    request.get({
      url: 'https://secure.ermeshotels.com/customersflash/package.do?method=search',
      qs: qs,
      enconding: 'binary',
      useQueryString: true
    }, (error, response, data) => {
      if (error) return cb(error, null)
      packageFormatter.format(data, (error, packages) => {
        console.log(packages)
        if (error) return cb(error, null);
        return cb(null, packages)
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
      telefono: reservationData.details.phone,
      note: reservationData.details.note,
      tipoCarta: reservationData.card.type,
      numeroCarta: reservationData.card.number,
      scadenzaCarta: reservationData.card.expire,
      titolareCarta: reservationData.card.holder,
      cvCarta: reservationData.card.cvv,
      servizi: ''
    }
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
    if (reservationData.promoCode && reservationData.promoCode.length > 0) {
      qs.promoCode = reservationData.promoCode
    }
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

    logger.verbose('[CONFIRM] ' + JSON.stringify(qs))

    request.post({
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
      if (!data) {
        // reservation does not exist, lest create it and return back to the client
        recoverFromErmes(reservation.channel, reservation.codes, reservation.email).then((reslist) => {
          if (reslist[0].indexOf('errore') > -1) {
            logger.verbose(`[RECOVER] Reservation not found code: ${data.rescodes}, channel: ${data.channel}, email: ${data.email}`)
            // errore nel recupero della prenotazione
            return cb(null, null)
          }
          logger.verbose(`[RECOVER] Given code ${reservation.codes} does not exist in the current DB`)
          ApiGateway.app.models.BolReservation.create({
            code: Math.random().toString(36).substr(2, 9),
            rescodes: reservation.codes,
            date: new Date(),
            hotel: reservation.hotel,
            channel: reservation.channel,
            email: reservations[0].datiprenotazione.prenotazione.mail.replace(/\s/g, '')
          }, (error, model) => {
            if (error) return cb(error, null);
            logger.verbose(`[RECOVER] New reservation created, send back to the client with the new internal code`)
            return cb(null, model);
          });
        }).fail((error) => {
          return cb(error, null);
        });
      } else {
        // reservation exist, return it
        logger.verbose(`[RECOVER] Given code ${reservation.codes} reservation found! Send back to the client.`)
        return cb(null, data)
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
      if (!data) {
        logger.verbose(`[RECOVER] Reservation not found: ${data} with code: ${code}`)
        return cb(null, null)
      }
      recoverFromErmes(data.channel, data.rescodes, data.email).then((reslist) => {
        if (reslist[0].indexOf('errore') > -1) {
          logger.verbose(`[RECOVER] Reservation not found code: ${data.rescodes}, channel: ${data.channel}, email: ${data.email}`)
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
      if (data) {
        let index = data.rescodes.indexOf(code)
        if (index > -1 && data.rescodes.length > 1) {
          data.rescodes.splice(index, 1)
          data.save()
        }
      }
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
          logger.silly(`Reservation not found code: ${code}`)
          return cb(null, {cancelled: false, error: 'Reservation not found'})
        }
        return cb(null, {cancelled: true, code: code})
      })
    })
  }

  ApiGateway.scrapeGoogle = (hotel, uri, dates, cb) => {
    
    let cacheValue = redisClient.hget(hotel, dates, (err, replies) => {
      if (err) return cb(err, null)
      if (replies) {
        // there is cachce data
        return cb(null, JSON.parse(replies))
      } else {
        let xvfb = new Xvfb()
        xvfb.start((error, xvfbProcess) => {
          if (error) console.log(error)
          let nightmare = Nightmare({
          waitTimeout: 190000
          })
          nightmare.goto(`https://google.com/search?q=${uri}#ahotel_dates=${dates}`)
            .wait((dates) => {
              return document.querySelector('.lujscdp-hci').getAttribute('data-luh-i') === dates.substr(0, dates.indexOf(','))
            }, dates)
            .evaluate(() => {
              let rates = []
              let rateElements = document.getElementsByClassName('_dkf')
              for (var j = 0; j < rateElements.length; j++) {
                let rate = {
                  provider: '',
                  rate: rateElements[j].getAttribute('data-dp').replace(/[$£€]/, '')
                }
                for (var i = 0; i < rateElements[j].childNodes.length; i++) {
                  if (rateElements[j].childNodes[i].className == "_Tjf") {
                    rate.provider = rateElements[j].childNodes[i].getAttribute('alt')
                  }
                }
                rates.push(rate)
              }
              return rates
            })      
            .end()
            .then((document) => {
              xvfb.stop((error) => {
                if (error) console.log(error)
              })
              redisClient.hset(hotel, dates, JSON.stringify(document))
              return cb(null, document)
            })
            .catch(function (error) {
              return cb(error, null)
            })
        })
      }
    })
  }

  function recoverFromErmes (channel, codes, email) {
    let defer = Q.defer()
    let progress = 0
    let resList = []
    codes.forEach((code) => {
      logger.verbose(`[RECOVER] Recover by code from ermes ${code}, channel: ${channel}, email: ${email}`)
      request.get({
        url: 'https://secure.ermeshotels.com/customersflash/retrieve.do?method=retrieve',
        qs: {ca_id: channel, codice_prenotazione: code, mail: email},
        useQueryString: true,
        encoding: 'binary'
      }, (error, response, data) => {
        console.log(response)
        if (error) {
          throw new Error(error)
        }
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

  ApiGateway.remoteMethod('packList', {
    http: {
      verb: 'GET'
    },
    accepts: [
      {arg: 'channel', type: 'string', required: true},
      {arg: 'hotel', type: 'string', required: true}
    ],
    returns: { arg: 'packages', type: 'Object'}
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

  ApiGateway.remoteMethod('scrapeGoogle', {
    http: {
      verb: 'GET'
    },
    accepts: [
      {arg: 'hotel', type: 'string', required: true},
      {arg: 'uri', type: 'string', required: true},
      {arg: 'dates', type: 'string', required: true}
    ],
    returns: { arg: 'scrape', type: 'Object'}
  });

};