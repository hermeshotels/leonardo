import xmlParser from './xmlparser';
export default {
  format: (xmlData, code, cb) => {
    console.log(xmlData)
    let reservations = [];
    xmlData.forEach((reservation) => {
      xmlParser.parseString(reservation, (error, xml) => {
        reservations.push(xml)
      });
    });
    let voucher = {
      rooms: [],
      guest: {},
      grandTotal: 0
    };
    let mainRes = reservations[0].datiprenotazione.prenotazione;
    voucher.id = mainRes.id;
    voucher.code = code;
    voucher.arrival = mainRes.dataarrivo;
    voucher.departure = mainRes.datapartenza;
    voucher.currency = mainRes.moneta;
    voucher.guest.name = mainRes.datiguest.nominativo;
    voucher.guest.address = mainRes.datiguest.indirizzo;
    voucher.guest.cap = mainRes.datiguest.cap;
    voucher.guest.city = mainRes.datiguest.citta;
    voucher.guest.province = mainRes.datiguest.provincia;
    voucher.guest.country = mainRes.datiguest.nazione;
    voucher.guest.email = mainRes.datiguest.mail;
    voucher.guest.phone = mainRes.datiguest.telefono;
    voucher.guest.note = mainRes.datiguest.note;
    reservations.forEach((reservation) => {
      voucher.rooms.push(formatResRoom(reservation.datiprenotazione.prenotazione));
      voucher.grandTotal += parseFloat(reservation.datiprenotazione.prenotazione.totale);
    });
    return cb(null, voucher);
  }
}

function formatResRoom (reservation) {
  let res = {
    id: reservation.id,
    code: reservation.codice,
    name: reservation.camera.nomecamera,
    adults: parseInt(reservation.adulti),
    childs: parseInt(reservation.bambini),
    rate: {
      id: reservation.tariffa.idtariffa,
      name: reservation.tariffa.nometariffa,
      breakfast: reservation.colazione,
      lunch: reservation.pranzo,
      dinner: reservation.cena,
      prepaid: parseFloat(reservation.prepagato),
      cancellationPolicy: reservation.cancellationpolicy
    },
    total: reservation.totale
  }
  return res;
}