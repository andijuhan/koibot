/* eslint-disable no-undef */
const http = require('http');
const socketIo = require('socket.io');
const express = require('express');
const db = require('./helpers/database');
const config = require('./config/auctionConfig');
const whatsappClient = require('./config/clientConfig');
const socketConfig = require('./config/socketIoConfig');
const adminInput = require('./lib/adminInput');
const userInput = require('./lib/userInput');
const clientEvents = require('./lib/clientEvents');

process.env.TZ = 'Asia/Bangkok';

const app = express();
const server = http.createServer(app);
const ioServer = socketIo(server);

app.get('/', (req, res) => {
   res.sendFile('index.html', { root: __dirname });
});

const client = whatsappClient.client;

socketConfig.socketSetup(ioServer, client);

clientEvents.handle(client);

client.on('message', async (message) => {
   const chats = await message.getChat();
   const messageLwcase = message.body.toLocaleLowerCase();
   const mediaCode = messageLwcase.slice(0, 7);

   if (chats.isGroup === false && messageLwcase.includes('video')) {
      config.setMedia = await db.setMedia(mediaCode);
   }

   //ADMIN MESSAGE COMMAND--------------------------------------------------------
   //admin set OB
   adminInput.setOB(message, chats);
   //admin set KB
   adminInput.setKB(message, chats);
   //admin setup video
   adminInput.setupVideo(client, message, chats);
   //admin send video to group
   adminInput.sendVideoToGroup(client, message, chats);
   //admin save info lelang
   adminInput.setupAuctionInfo(client, message, chats);
   //admin setup lelang
   adminInput.auctionSetup(client, message, chats);
   //admin start lelang
   adminInput.auctionStart(client, message, chats);
   //admin mengatur no lelang
   adminInput.setAuctionNumber(client, message, chats);
   //admin mengatur foto rekap
   adminInput.setRecapImage(client, message, chats);
   //admin tutup lelang paksa
   adminInput.closeAuction(message, chats);

   //USER MESSAGE COMMAND--------------------------------------------------------
   //user check video
   userInput.checkVideo(client, message, chats);
   //user OB
   userInput.OBHandle(client, message, chats);
   //user KB
   userInput.KBHandle(client, message, chats);
   //user jump bid
   userInput.jumpBidHandle(client, message, chats);
   //user helper
   userInput.helper(client, message, chats);
});

client.initialize();

server.listen(3000, () => {
   console.log('App running on *:', 3000);
});
