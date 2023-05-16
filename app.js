/* eslint-disable no-undef */
const http = require('http');
const socketIo = require('socket.io');
const express = require('express');
const db = require('./helpers/database');
const config = require('./config/auctionConfig');
const whatsappClient = require('./config/clientConfig');
const socketConfig = require('./config/socketIoConfig');
const adminInputLib = require('./lib/adminInput');
const userInputLib = require('./lib/userInput');
const clientEvent = require('./lib/clientEvent');

process.env.TZ = 'Asia/Bangkok';

const app = express();
const server = http.createServer(app);
const ioServer = socketIo(server);

app.get('/', (req, res) => {
   res.sendFile('index.html', { root: __dirname });
});

const client = whatsappClient.client;

socketConfig.socketSetup(ioServer, client);

clientEvent.clientEvent(client);

client.on('message', async (message) => {
   const chats = await message.getChat();
   const messageLwcase = message.body.toLocaleLowerCase();
   const mediaCode = messageLwcase.slice(0, 7);

   if (chats.isGroup === false && messageLwcase.includes('video')) {
      config.setMedia = await db.setMedia(mediaCode);
   }

   //ADMIN MESSAGE COMMAND--------------------------------------------------------
   //admin set OB
   adminInputLib.setOB(message, chats);
   //admin set KB
   adminInputLib.setKB(message, chats);
   //admin setup video
   adminInputLib.setupVideo(client, message, chats);
   //admin send video to group
   adminInputLib.sendVideoToGroup(client, message, chats);
   //admin save info lelang
   adminInputLib.setupAuctionInfo(client, message, chats);
   //admin setup lelang
   adminInputLib.auctionSetup(client, message, chats);
   //admin start lelang
   adminInputLib.auctionStart(client, message, chats);
   //admin tutup lelang paksa
   adminInputLib.closeAuction(message, chats);

   //USER MESSAGE COMMAND--------------------------------------------------------
   //user check video
   userInputLib.checkVideo(client, message, chats);
   //user OB
   userInputLib.OBHandle(client, message, chats);
   //user KB
   userInputLib.KBHandle(client, message, chats);
   //user jump bid
   userInputLib.jumpBidHandle(client, message, chats);
   //user helper
   userInputLib.helper(client, message, chats);
});

client.initialize();

server.listen(3000, () => {
   console.log('App running on *:', 3000);
});
