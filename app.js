/* eslint-disable no-undef */
const http = require('http');
const socketIo = require('socket.io');
const express = require('express');
const whatsappBotClientConfig = require('./config/client');
const socketClientAuth = require('./services/socketClientAuth');
const messageServices = require('./services');
const clientEventListenerHandler = require('./services/clientEventListenerHandler');

process.env.TZ = 'Asia/Bangkok';

const app = express();
const server = http.createServer(app);
const ioServer = socketIo(server);

app.get('/', (req, res) => {
   res.sendFile('index.html', { root: __dirname });
});

const client = whatsappBotClientConfig;

socketClientAuth(ioServer, client);

clientEventListenerHandler(client);

client.on('message', async (message) => {
   messageServices(client, message);
});

client.initialize();

server.listen(3000, () => {
   console.log('App running on *:', 3000);
});
