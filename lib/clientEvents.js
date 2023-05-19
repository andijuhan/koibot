/* eslint-disable no-undef */
const config = require('../config/auctionConfig');
const utils = require('../helpers/utils');
const db = require('../helpers/database');
const auctionLib = require('./auctionLib');

const handle = (client) => {
   client.on('ready', async () => {
      console.log('Mempersiapkan data lelang');
      const data = await db.getSetting();
      const userChat = await client.getChats();
      config.groupId = utils.getGroupId(userChat);

      if (data !== false) {
         config.isAuctionStarting = data[0].auction_status;

         config.INFO = data[0].auction_info;
         config.auctionNumber = data[0].auction_number;

         if (config.isAuctionStarting) {
            auctionLib.setAuctionClosing(client);
         }
      }
   });

   client.on('group_join', (notification) => {
      // User has joined or been added to the group.
      notification.reply(
         `Selamat datang di grup *${config.groupName}*\nKetik *info lelang* untuk cek detail lelang.`
      );
   });

   client.on('disconnected', (reason) => {
      console.log('Client was logged out', reason);
      return process.exit(1);
   });
};

module.exports = {
   handle,
};
