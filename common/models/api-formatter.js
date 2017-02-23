'use strict';
import channelFormatter from '../formatters/channel';
import calendarFormatter from '../formatters/calendar';
import dispoFormatter from '../formatters/dispo';
import portalFormatter from '../formatters/portal';
import confirmFormatter from '../formatters/confirm';
import recoverFormatter from '../formatters/recover';
import reservationFormatter from '../formatters/reservation';
import voucherFormatter from '../formatters/voucher';
import Q from 'q'

module.exports = function(Apiformatter) {
  Apiformatter.channel = function (channel, hotel, language, cb) {
    Apiformatter.app.models.ApiGateway.channelData(channel, hotel, language, function (error, data) {
      if (error) return cb(error, null);
      channelFormatter.format(data, function(error, channel) {
        if (error) return cb(error, null);
        return cb(null, channel);
      });
    });
  }

  Apiformatter.calendar = function (channel, hotel, month, year, cb) {
    Apiformatter.app.models.ApiGateway.calendar(channel, hotel, month, year, function(error, data) {
      if (error) return cb(error, null);
      calendarFormatter.format(data, (error, calendar) => {
        if (error) return cb(error, null);
        return cb(null, calendar);
      });
    });
  }

  Apiformatter.checkDispo = function (filters, cb) {
    Apiformatter.app.models.ApiGateway.dispo(
      filters.channel,
      filters.hotel,
      filters.language,
      filters.arrival,
      filters.departure,
      filters.rateid1,
      filters.rateid2,
      filters.rateid3,
      filters.adults,
      filters.childs,
      filters.childsAge,
      filters.macroId,
      filters.packageId,
      filters.customerId,
      filters.username,
      filters.password,
      filters.promoCode,
      filters.ignoreDispo,
      (error, data) => {
        if (error) return cb(error, null);
        dispoFormatter.format(data, (error, dispo) => {
          if (error) return cb(error, null);
          return cb(null, dispo);
        });
      }
    );
  }

  Apiformatter.checkPortal = function(filters, cb) {
    Apiformatter.app.models.ApiGateway.portal(
      filters.channel,
      filters.destination,
      filters.language,
      filters.arrival,
      filters.departure,
      filters.adults,
      filters.childs,
      filters.childsAge,
      filters.adult2,
      filters.childs2,
      filters.childsAge2,
      filters.adults3,
      filters.childs3,
      filters.childsAge3,
      filters.adults4,
      filters.childs4,
      filters.childsAge4,
      filters.customerId,
      (error, data) => {
        if (error) return cb(error, null);
        portalFormatter.format(data, (error, dispo) => {
          if (error) return cb(error, null);
          return cb(null, dispo);
        });
      }
    )
  }

  Apiformatter.confirm = (reservation, cb) => {
    let reservationData = {
      channel: reservation.channel,
      hotel: reservation.hotel,
      language: reservation.language,
      arrival: reservation.arrival,
      departure: reservation.departure,
      adults: reservation.rooms[0].adults,
      adults2: ((reservation.rooms[1]) ? reservation.rooms[1].adults : 0),
      adults3: ((reservation.rooms[2]) ? reservation.rooms[1].adults : 0),
      adults4: ((reservation.rooms[3]) ? reservation.rooms[1].adults : 0),
      childs: reservation.rooms[0].childs,
      childs2: ((reservation.rooms[1]) ? reservation.rooms[1].childs : 0),
      childs3: ((reservation.rooms[2]) ? reservation.rooms[2].childs : 0),
      childs4: ((reservation.rooms[3]) ? reservation.rooms[3].childs : 0),
      rateid1: ((reservation.rooms[0]) ? reservation.rooms[0].rate.id : 0),
      rateid2: ((reservation.rooms[1]) ? reservation.rooms[1].rate.id : 0),
      rateid3: ((reservation.rooms[2]) ? reservation.rooms[2].rate.id : 0),
      rateid4: ((reservation.rooms[3]) ? reservation.rooms[3].rate.id : 0),
      fullname: reservation.details.name,
      address: reservation.details.address,
      zip: reservation.details.cap,
      city: reservation.details.city,
      province: reservation.details.province,
      country: reservation.details.country,
      mail: reservation.details.email,
      note: reservation.details.note,
      cardType: reservation.card.type,
      cardNumber: reservation.card.number,
      cardDate: reservation.card.date,
      cardName: reservation.card.holder,
      cardCv: reservation.card.securecode,
      services: ''
    }

    if (reservation.services.length > 0) {
      // ci sono servizi aggiuntivi nella prenotazione
      reservation.services.forEach((service) => {
        service.days.forEach((day) => {
          if (day.selected > 0) {
            reservationData.services += `${day.date};${service.id};${service.fascia};${day.selected}/`
          }
        });
      });
    }

    if (reservation.rooms[0]) {
      if (reservation.rooms[0].childs > 0) {
        reservationData.avail_etaBambini = `${reservation.rooms[0].childAge0},${reservation.rooms[0].childAge1},${reservation.rooms[0].childAge2},${reservation.rooms[0].childAge3}`
      }
      if (reservation.rooms[0].rate.overrided) {
        qs['prezzi'] = []
        reservation.rooms[0].rate.prices.forEach((day) => {
          qs['prezzi'].push(day.price)
        })
      }
    }
    if (reservation.rooms[1]) {
      if (reservation.rooms[1].childs > 0) {
        reservationData.avail_etaBambini2 = `${reservation.rooms[1].childAge0},${reservation.rooms[1].childAge1},${reservation.rooms[1].childAge2},${reservation.rooms[1].childAge3}`
      }
      if (reservation.rooms[1].rate.overrided) {
        qs['prezzi2'] = []
        reservation.rooms[1].rate.prices.forEach((day) => {
          qs['prezzi2'].push(day.price)
        })
      }
    }
    if (reservation.rooms[2]) {
      if (reservation.rooms[2].childs > 0) {
        reservationData.avail_etaBambini3 = `${reservation.rooms[2].childAge0},${reservation.rooms[2].childAge1},${reservation.rooms[2].childAge2},${reservation.rooms[2].childAge3}`
      }
      if (reservation.rooms[2].rate.overrided) {
        qs['prezzi3'] = []
        reservation.rooms[2].rate.prices.forEach((day) => {
          qs['prezzi3'].push(day.price)
        })
      }
    }
    if (reservation.rooms[3]) {
      if (reservation.rooms[3].childs > 0) {
        reservationData.avail_etaBambini4 = `${reservation.rooms[3].childAge0},${reservation.rooms[3].childAge1},${reservation.rooms[3].childAge2},${reservation.rooms[3].childAge3}`
      }
      if (reservation.rooms[3].rate.overrided) {
        qs['prezzi4'] = []
        reservation.rooms[3].rate.prices.forEach((day) => {
          qs['prezzi4'].push(day.price)
        })
      }
    }
    Apiformatter.app.models.ApiGateway.confirm(
      reservationData.channel,
      reservationData.hotel,
      reservationData.language,
      reservationData.arrival,
      reservationData.departure,
      reservationData.rateid1,
      reservationData.adults,
      reservationData.childs,
      reservationData.childsAge,
      reservationData.prices,
      reservationData.services,
      reservationData.rateid2,
      reservationData.adults2,
      reservationData.childs2,
      reservationData.childsAge2,
      reservationData.prices2,
      reservationData.services2,
      reservationData.rateid3,
      reservationData.adults3,
      reservationData.childs3,
      reservationData.childsAge3,
      reservationData.prices3,
      reservationData.services3,
      reservationData.rateid4,
      reservationData.adults4,
      reservationData.childs4,
      reservationData.childsAge4,
      reservationData.prices4,
      reservationData.services4,
      reservationData.customerId,
      reservationData.promoCode,
      reservationData.fullname,
      reservationData.address,
      reservationData.zip,
      reservationData.city,
      reservationData.province,
      reservationData.country,
      reservationData.mail,
      reservationData.note,
      reservationData.cardType,
      reservationData.cardNumber,
      reservationData.cardDate,
      reservationData.cardName,
      reservationData.cardCv,
      (error, data) => {
        if (error) return cb(error, null);
        reservationFormatter.format(data, (error, reservation) => {
          if (error) return cb(error, null);
          Apiformatter.app.models.BolReservation.create({
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
      }
    )
  }

  Apiformatter.recover = (reservation, cb) => {
    Apiformatter.app.models.BolReservation.findOne({
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

  Apiformatter.recoverByCode = (code, cb) => {
    Apiformatter.app.models.BolReservation.findOne({
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
      Apiformatter.app.models.ApiGateway.recover(
        channel,
        code,
        email,
        (error, resData) => {
          if (error) throw new Error(error);
          resList.push(resData);
          progress++;
          if (progress === codes.length) {
            defer.resolve(resList);
          }
        }
      )
    })
    return defer.promise;
  }

  Apiformatter.remoteMethod('channel', {
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

  Apiformatter.remoteMethod('calendar', {
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

  Apiformatter.remoteMethod('checkDispo', {
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
  
  Apiformatter.remoteMethod('checkPortal', {
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

  Apiformatter.remoteMethod('confirm', {
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

  Apiformatter.remoteMethod('recover', {
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

  Apiformatter.remoteMethod('recoverByCode', {
    http: {
      verb: 'GET'
    },
    accepts: [
      {arg: 'code', type: 'string', required: true}
    ],
    returns: { arg: 'voucher', type: 'Object'}
  });

};