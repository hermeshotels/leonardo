'use strict';
var hotels = {}
var clients = {}
module.exports = function socketSetup(server) {
  server.on('started', function() {
    /*
    Socket server enabled
    */
    server.io = require('socket.io').listen(server.server);
    /*
    Connessione del socket, a questo punto il socket ha inizializzato una
    connessione con il server ma non sappiamo ne a quale hotel è connesso
    ne il suo nome utente, effettuaimo quindi il bind sulla lista di eventi
    */
    server.io.on('connection', function (socket){
      console.log(`[SOCKET] client connected waiting for actions`)
      /*
      All'avvio della ricerca camere / hotel il client invia tutti i
      dati necessari alla registrazione e viene salvato nella lista dei
      clients, per poter successivamente comunicare.
      Il clinet invia diversi parametri tra cui l'hotelID, si va quindi a creare
      se non esistente viene creato
      */
      socket.on('client-sing-up', function(data) {
        console.log(`[SOCKET] client connected with session id ${data.sessionid} to hotel ${data.hotel}`)
        if (clients[data.hotel]) {
          /*
          Il codice hotel esiste quindi inserisco la sessione
          relativa al socket al suo interno, così che io possa notificare
          direttamente solo l'hotel specifico
          */
          clients[data.hotel][data.sessionid] = {
            socket: socket
          }
        } else {
          /*
          Il codice hotel non esiste, quindi procedo a generarlo
          e salvare al suo interno la sessione corrente
          */
          clients[data.hotel] = {}
          clients[data.hotel][data.sessionid] = {
            socket: socket
          }
        }
        socket.sessionid = data.sessionid
        socket.hotel = data.hotel
        socket.front = true
        // Notifico il server
        server.io.to(data.hotel).emit('backNewSession', data)
      });
      socket.on('client-reset', function () {
        console.log(`[SOCKET] client reset filters session ${socket.sessionid} to hotel ${socket.hotel}`)
      })
      /*
      Il client ha avviato la ricerca, quindi impostato dei filtri
      ma non ha ancora ricevuto una lista camere
      */
      socket.on('client-set-filters', function (data) {
        console.log(`[SOCKET] client set filters and started search ${JSON.stringify(data.filters)}`)
        // Verifico se l'hotel relativo al socket è presente nella lista hotels
        if (clients[socket.hotel]) {
          // verifico se la sessione è stata già creata all'interno dell'hotel
          if (clients[socket.hotel][socket.sessionid]) {
            // la session esiste, la aggiorno quindi con la lista camere relativa
            clients[socket.hotel][socket.sessionid].filters = data.filters
            clients[socket.hotel][socket.sessionid].position = data.position
            // Notifico il server dell'arrivo delle nuove camere
            console.log(`[SOCKET] send filter to server to hotel ${socket.hotel} from session id ${socket.sessionid}`)
            server.io.to(socket.hotel).emit('backSetFilters', {
              hotel: socket.hotel,
              sessionid: socket.sessionid,
              data: data
            })
          }
        }
      })
      /*
      Quando il client invia una ricerca emette questo evento
      ed invia al serve l'elenco delle camere ricevute.
      In questa fase l'hotel viene notificato sull'inizio della ricerca
      viene aggiornato lo step dell'utente e visualizzata la lista dei risultati.
      */
      socket.on('client-room-list', function (data) {
        console.log(`[SOCKET] client received rooms`)
        // Verifico se l'hotel relativo al socket è presente nella lista hotels
        if (clients[socket.hotel]) {
          // verifico se la sessione è stata già creata all'interno dell'hotel
          if (clients[socket.hotel][socket.sessionid]) {
            // la session esiste, la aggiorno quindi con la lista camere relativa
            clients[socket.hotel][socket.sessionid].rooms = data.rooms
            clients[socket.hotel][socket.sessionid].position = data.position
            // Notifico il server dell'arrivo delle nuove camere
            console.log(`[SOCKET] send rooms to server to hotel ${socket.hotel} from session id ${socket.sessionid}`)
            server.io.to(socket.hotel).emit('backSetRooms', {
              hotel: socket.hotel,
              sessionid: socket.sessionid,
              data: data
            })
          }
        }
      })
      /*
      Il client ha selezionato una camera e quindi anche una tariffa
      aggiorno la sessione con la selezione corrente e la notifico al server
      */
      socket.on('client-room-selection', function (data) {
        // verifico se l'hotel relativo al socket è presente nella lista clients
        if (clients[socket.hotel]) {
          // verifico se la sessione esiste nella lista corrente degli hotels
          if (clients[socket.hotel][socket.sessionid]) {
            // la session esiste, aggiorno con la camera selezionata, la posizione è sempre rooms
            clients[socket.hotel][socket.sessionid].room = data.room
            // notifico il server
            console.log(`[SOCKET] send selected room to server to hotel ${socket.hotel} from session id ${socket.sessionid}`)
            server.io.to(socket.hotel).emit('backSelectRoom', {
              hotel: socket.hotel,
              sessionid: socket.sessionid,
              data: data
            })
          }
        }
      })
      /*
      Il client ha superato la ricerca delle camere ed ha ricevuto l'elenco di servizi
      inoltro al server l'elenco e la nuova posizione del client
      */
      socket.on('client-extra-service', function (data) {
        // Verifico se l'hotel relativo al socket è presente nella lista clients
        if (clients[socket.hotel]) {
          // verifico se la sessione è stata già creata nella lista clients
          if (clients[socket.hotel][socket.sessionid]) {
            // la session esiste, la aggiorno con il valor dei serivzi compresa posizione
            clients[socket.hotel][socket.sessionid].rooms = data.services
            clients[socket.hotel][socket.sessionid].position = data.position
            // notifico il server dell'arrivo delle nuove camere
            console.log(`[SOCKET] send extra services to hotel ${socket.hotel} from session id ${socket.sessionid}`)
            server.io.to(socket.hotel).emit('backExtraServices', {
              hotel: socket.hotel,
              sessionid: socket.sessionid,
              data: data
            })
          }
        }
      })
      /*
      Il client ha selezionato un servizio aggiuntivo, lo notifico al server e aggiorno la sessione
      */
      socket.on('client-services-selected', function (data) {
        // verifico se l'hotel relativo al socket è presente nella lista clients
        if (clients[socket.hotel]) {
          // verifico se la session è stata già creta nella lista clients
          if (clients[socket.hotel][socket.sessionid]) {
            // la session esiste, la aggiorno con il valore dei servizi selezionati
            clients[socket.hotel][socket.sessionid].selectedServices = data.services
          }
        }
      })
      /*
      Il client ha avviato la chat ed ha inserito un nome utente
      */
      socket.on('client-chat-username', function (data) {        
        // verifico se l'hotel relativo al socket è presente nella lista clients
        if (clients[socket.hotel]) {
          // verifico se la sessione è stata già creta nella lista clients
          if (clients[socket.hotel][socket.sessionid]) {
            // imposto lo usename sul socket
            console.log(`[SOCKET] set user name ${data.username} to ${socket.hotel} from session id ${socket.sessionid}`)
            clients[socket.hotel][socket.sessionid].username = data.username
            // notifico il server
            server.io.to(socket.hotel).emit('backUserNameSelected', {
              hotel: socket.hotel,
              sessionid: socket.sessionid,
              data: data
            })
          }
        }
      })
      /*
      Nuovo messaggio in chat, può provenire sia dal client che dal server
      in base alla provenienza si instrada il corretto evento al socket
      di riferimento
      */
      socket.on('new-chat-message', function (data) {
        if (data.from === 'front') {
          if (clients[socket.hotel]) {
            // verifico se la sessione è stata già creata nella lista clients
            if (clients[socket.hotel][socket.sessionid]) {
              /*
              Verifico se la sessione ha un elenco di messaggio validi per l'inserimento
              altrimenti lo genero
              */
              let session = clients[socket.hotel][socket.sessionid]
              if (!session.chat || !session.chat.constructor === Array) {
                // l'elenco dei messaggi non esiste o non è nel corretto formato
                session.chat = []
              }
              // inserisco il nuovo messagio all'interno della lista
              session.chat.push({
                from: data.from,
                message: data.message,
                new: true
              })
              console.log(`[SOCKET] new chat message ${socket.hotel} from session id ${socket.sessionid} from ${data.from} sent to server`)
              server.io.to(socket.hotel).emit('backNewMessage', {
                hotel: socket.hotel,
                sessionid: socket.sessionid,
                message: data.message,
                from: data.from,
                new: true
              })
            }
          }
        } else if (data.from === 'back') {
          console.log(`[SOCKET] new chat message ${data.hotel} from session id ${data.sessionid} from ${data.from} sent to client`)
          if (clients[data.hotel]) {
            if (clients[data.hotel][data.sessionid]) {
              clients[data.hotel][data.sessionid].socket.emit('frontNewMessage', {
                hotel: socket.hotel,
                sessionid: socket.sessionid,
                message: data.message,
                from: data.from
              })
            }
          }
        }
      })

      socket.on('hotel-sing-up', function (data) {
        console.log(`[SOCKET] back socket connected with hotel id ${data.hotel}`)
        socket.join(data.hotel)
        console.log(`[SOCKET] back socket joined room ${data.hotel}`)
        if (!hotels[data.hotel]) {
          // l'hotel non ha nessun socket abbinato, procedo quindi a registrarlo
          socket.hotel = data.hotel
          socket.back = true
          hotels[data.hotel] = []
          hotels[data.hotel].push(socket)
        }
      })

      socket.on('new-rate-price', function (data) {
        console.log(`[SOCKET] socket recieved a request for rate override`)
        if (clients[data.hotel]) {
          if (clients[data.hotel][data.sessionid]) {
            clients[data.hotel][data.sessionid].socket.emit('frontNewRatePrice', {
              hotel: socket.hotel,
              sessionid: socket.sessionid,
              room: data.room,
              rate: data.rate,
              newPrice: data.newPrice
            })
          }
        }
      })

      socket.on('disconnect', function(){
        // rimuovo il socket dalla lista dei client connessi
        console.log(`[SOCKET] socket disconnected ${socket.hotel} with id ${socket.sessionid}`)
        if (clients[socket.hotel]) {
          if (clients[socket.hotel][socket.sessionid]) {
            delete clients[socket.hotel][socket.sessionid]
          }
        }
        server.io.to(socket.hotel).emit('backEndSession', socket.sessionid)
        if (socket.back) {
          // se il socket è back lascio la room a cui ho fatto accesso precedentemente
          socket.leave(socket.hotel)
          console.log(`[SOCKET] socket leave room ${socket.hotel}`)
        }
      });
    })
  })
};