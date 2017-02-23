'use strict';

module.exports = function(server) {
  // Install a `/` route that returns server status
  var router = server.loopback.Router();
  router.get('/', server.loopback.status());
  router.post('/socket.io', (req, res) => {
    res.send('');
  });
  server.use(router);
};
