const auctionSetupHandler = require('./auctionSetupHandler');
const userInputHandler = require('./userInputHandler');
const db = require('../utils/database');
const config = require('../config/auction');

const messageServices = async (client, message) => {
   const chats = await message.getChat();
   const messageLwcase = message.body.toLocaleLowerCase();
   const mediaCode = messageLwcase.slice(0, 7);

   if (chats.isGroup === false && messageLwcase.includes('video')) {
      config.setMedia = await db.setMedia(mediaCode);
   }
   //ADMIN MESSAGE COMMAND--------------------------------------------------------
   //admin set OB
   auctionSetupHandler.setOB(message, chats);
   //admin set KB
   auctionSetupHandler.setKB(message, chats);
   //admin setup video
   auctionSetupHandler.setupVideo(client, message, chats);
   //admin send video to group
   auctionSetupHandler.sendVideoToGroup(client, message, chats);
   //admin save info lelang
   auctionSetupHandler.setupAuctionInfo(client, message, chats);
   //admin setup lelang
   auctionSetupHandler.auctionSetup(client, message, chats);
   //admin start lelang
   auctionSetupHandler.auctionStart(client, message, chats);
   //admin mengatur no lelang
   auctionSetupHandler.setAuctionNumber(client, message, chats);
   //admin mengatur foto rekap
   auctionSetupHandler.setRecapImage(client, message, chats);
   //admin tutup lelang paksa
   auctionSetupHandler.closeAuction(message, chats);

   //USER MESSAGE COMMAND--------------------------------------------------------
   //user check video
   userInputHandler.checkVideo(client, message, chats);
   //user OB
   userInputHandler.ob(client, message, chats);
   //user KB
   userInputHandler.kb(client, message, chats);
   //user jump bid
   userInputHandler.jb(client, message, chats);
   //user helper
   userInputHandler.helper(client, message, chats);
};

module.exports = messageServices;
