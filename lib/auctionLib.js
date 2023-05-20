const config = require('../config/auctionConfig');
const cron = require('node-cron');
const utils = require('../helpers/utils');
const db = require('../helpers/database');
const fs = require('fs');
const { MessageMedia } = require('whatsapp-web.js');

const setAuctionClosing = (client) => {
   const currentHour = new Date().getHours();

   if (currentHour < 22) {
      console.log('Berhasil set waktu closing');

      cron.schedule('1 22 * * *', async function () {
         console.log('Extra Time');
         config.extraTime = true;
         if (config.extraTime) {
            //jalankan hitung mundur 10 menit
            countdown(client);
         }

         //kirim notif ke grup
         client.sendMessage(
            config.groupId,
            '*[BOT]* Memasuki masa extra time.'
         );
         client.sendMessage(
            config.groupId,
            '*[BOT]* Tidak ada bid *closed* jam 22:11.'
         );
      });
   }
};

const countdown = (client) => {
   //jika ada yg bid, reset hitung mundur ke 10 menit lgi
   if (config.addExtraTime && config.count > 0) {
      config.count = 10;
      config.addExtraTime = false;
   }
   //jika belum ada yg bid, beri nilai awal hitungan mundur 10 menit
   if (config.count === 0) {
      config.count = 10;

      timer(client, config.groupId);

      config.addExtraTime = false;
   }
};

const timer = async (client, groupId) => {
   if (config.count < 0) {
      //reset info lelang
      await db.setAuctionInfo('');
      config.INFO = '';
      //akhiri sesi lelang
      await db.setAuctionStatus(0);
      config.isAuctionStarting = 0;
      //notifikasi lelang telah berakhir
      client.sendMessage(
         groupId,
         `*[BOT]* Lelang *closed* ${utils.currentDateTime()}`
      );
      auctionWinnerNotification(client, groupId);

      //kirim notif ke pemenang lelang
      const dataRecap = await db.getAllDataRecap();
      const sent = {};

      dataRecap?.map((item, index) => {
         const bidderId = dataRecap[index].bidder_id;
         const auctionCode = dataRecap[index].auction_code;
         const bid = dataRecap[index].bid;

         if (bidderId !== null) {
            client.sendMessage(
               bidderId,
               `*[BOT]* Selamat Anda pemenang lelang ke ${config.auctionNumber} *${config.groupName}* kode ikan *${auctionCode}* dengan bid *${bid}*`
            );

            //memastikan mengirim notifikasi info pembayaran 1 kali per user
            if (!sent[bidderId]) {
               sent[bidderId] = true;

               const timerId = setTimeout(() => {
                  client.sendMessage(
                     bidderId,
                     `- *PESAN OTOMATIS DARI BOT* -\n==============================\nSilahkan konfirmasi ke *admin* \nklik ${config.adminContact}\n==============================\n\n*Pembayaran ke rekening: * \n-${config.bankAccount}\n\n*Pembayaran maksimal 2 hari*\nPenitipan 6 hari, Luar pulau 12 hari\n\n*Trimakasih.*\nAdmin`
                  );
                  clearTimeout(timerId);
               }, 10000);
            }
         }
      });
   } else {
      if (config.count === 9) {
         client.sendMessage(
            groupId,
            '*[BOT]* Lelang *closed* dalam 9 menit 50 detik.'
         );
      }
      if (config.count === 8) {
         client.sendMessage(
            groupId,
            '*[BOT]* Lelang *closed* dalam 8 menit 50 detik.'
         );
      }
      if (config.count === 7) {
         client.sendMessage(
            groupId,
            '*[BOT]* Lelang *closed* dalam 7 menit 50 detik.'
         );
      }
      if (config.count === 6) {
         client.sendMessage(
            groupId,
            '*[BOT]* Lelang *closed* dalam 6 menit 50 detik.'
         );
      }
      if (config.count === 5) {
         client.sendMessage(
            groupId,
            '*[BOT]* Lelang *closed* dalam 5 menit 50 detik.'
         );
      }
      if (config.count === 4) {
         client.sendMessage(
            groupId,
            '*[BOT]* Lelang *closed* dalam 4 menit 50 detik.'
         );
      }
      if (config.count === 3) {
         client.sendMessage(
            groupId,
            '*[BOT]* Lelang *closed* dalam 3 menit 50 detik.'
         );
      }
      if (config.count === 2) {
         client.sendMessage(
            groupId,
            '*[BOT]* Lelang *closed* dalam 2 menit 50 detik.'
         );
      }
      if (config.count === 1) {
         client.sendMessage(
            groupId,
            '*[BOT]* Lelang *closed* dalam 1 menit 50 detik.'
         );
      }
      if (config.count === 0) {
         client.sendMessage(groupId, '*[BOT]* Lelang *closed* dalam 50 detik.');
      }
      setTimeout(() => {
         config.count -= 1;
         timer(client, groupId);
      }, 60000);
   }
};

const auctionWinnerNotification = async (client, groupId) => {
   let recapStr = `- *Selamat Kepada Pemenang Lelang ke ${
      config.auctionNumber
   }* -\n- ${utils.currentDateTime()}\n==============================\n`;
   let footerRecap = `\nSilahkan konfirmasi ke *admin* \nklik ${config.adminContact}\n\n*Pembayaran ke rekening: * \n-${config.bankAccount}\n\n*Pembayaran maksimal 2 hari*\nPenitipan 6 hari, Luar pulau 12 hari\n\n*Trimakasih.*\nAdmin`;
   const recap = await db.getAllDataRecap();

   recap?.map((item, index) => {
      const bidderId = recap[index].bidder_id;
      const recapData = `Kode Ikan *${recap[
         index
      ].auction_code.toUpperCase()}* Bid ${recap[index].bid} Bidder *${
         recap[index].bidder
      }* \n`;
      if (bidderId !== null) {
         recapStr = recapStr.concat(recapData);
      }
   });
   recapStr = recapStr.concat(footerRecap);
   client.sendMessage(groupId, recapStr);
};

const recapBid = async (client) => {
   const timerId = setTimeout(async () => {
      let recapStr = `- *Rekap Bid Tertinggi Sementara -*\n*- ${config.groupName} lelang ke ${config.auctionNumber}* -\n==============================\n`;
      let footerRecap = `\n==============================\n*Close lelang* : \n- Jam 22:11 WIB, ${utils.currentDateTime()}\n- Extratime 10 menit berkelanjutan`;
      let footerRecapExtraTime = `\n==============================\n*Close lelang* : \n- Extratime 10 menit berkelanjutan\n- Tidak ada bid, *CLOSE ${utils.addSomeMinutes(
         config.count + 1
      )} WIB*\n- Sisa waktu *${config.count} menit*`;

      const recap = await db.getAllDataRecap();

      recap.map((item, index) => {
         const bidderId = recap[index].bidder_id;
         const recapData = `Kode : *${recap[
            index
         ].auction_code.toUpperCase()}*, Bid : ${recap[index].bid}, Bidder : *${
            recap[index].bidder
         }* \n`;

         const recapDataNull = `Kode : *${recap[
            index
         ].auction_code.toUpperCase()}* . . . \n`;

         if (bidderId !== null) {
            recapStr = recapStr.concat(recapData);
         } else {
            recapStr = recapStr.concat(recapDataNull);
         }
      });
      if (config.extraTime) {
         recapStr = recapStr.concat(footerRecapExtraTime);
      } else {
         recapStr = recapStr.concat(footerRecap);
      }

      try {
         const path = './images/cover.jpg';
         if (fs.existsSync(path)) {
            //file exists
            const media = MessageMedia.fromFilePath(path);

            client.sendMessage(config.groupId, media, {
               caption: recapStr,
            });
         }
      } catch (err) {
         console.error(err);
      }
      //client.sendMessage(groupId, recapStr);
      clearTimeout(timerId);
   }, 3000);
};

module.exports = {
   setAuctionClosing,
   countdown,
   auctionWinnerNotification,
   recapBid,
};
