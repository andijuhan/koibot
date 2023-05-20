const qrcode = require('qrcode');

const socketSetup = (ioServer, client) => {
   //socket.io setup
   ioServer.on('connection', (socket) => {
      socket.emit('message', 'Connected to server');

      client.on('qr', (qr) => {
         console.log('QR RECEIVED', qr);
         qrcode.toDataURL(qr, (err, url) => {
            socket.emit('qr', url);
            socket.emit('message', 'QR Code Received, scan please!');
         });
      });

      client.on('authenticated', () => {
         socket.emit('authenticated', 'Whatsapp is authenticated');
         socket.emit('message', 'Whatsapp is authenticated');
      });

      client.on('ready', () => {
         console.log('Client is ready!');
         socket.emit('ready', 'Bot is ready');
         socket.emit('message', 'Bot is ready');
      });
   });
};

module.exports = {
   socketSetup,
};
