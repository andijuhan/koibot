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
   //ADMIN MESSAGE COMMAND HANDLER--------------------------------------------------------
   //admin can setup auction bot using message

   //admin set OB
   auctionSetupHandler.setOB(message);
   //admin set KB
   auctionSetupHandler.setKB(message);
   //admin setup video
   auctionSetupHandler.setupVideo(client, message);
   //admin send video to group
   auctionSetupHandler.sendVideoToGroup(client, message);
   //admin save info lelang
   auctionSetupHandler.setupAuctionInfo(client, message);
   //admin setup lelang
   auctionSetupHandler.auctionSetup(client, message);
   //admin start lelang
   auctionSetupHandler.auctionStart(client, message);
   //admin mengatur no lelang
   auctionSetupHandler.setAuctionNumber(client, message);
   //admin mengatur foto rekap
   auctionSetupHandler.setRecapImage(client, message);
   //admin mengatur tanggal closing lelang
   auctionSetupHandler.setAuctionClosingDate(client, message);
   //admin menambah item lelang baru
   auctionSetupHandler.addAuctionItem(client, message);
   //admin tutup lelang paksa
   auctionSetupHandler.closeAuction(message);

   //USER MESSAGE COMMAND HANDLER--------------------------------------------------------
   //user can bid (ob, kb, jb), check video, and help

   //user check video
   userInputHandler.checkVideo(client, message);
   //user OB
   userInputHandler.ob(client, message);
   //user KB
   userInputHandler.kb(client, message);
   //user jump bid
   userInputHandler.jb(client, message);
   //user helper
   userInputHandler.helper(client, message);
};

module.exports = messageServices;
