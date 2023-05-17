const config = require('../config/auctionConfig');
const cron = require('node-cron');
const utils = require('../helpers/utils');
const db = require('../helpers/database');

const setAuctionClosing = (client) => {
   const currentHour = new Date().getHours();
   //jika server mengalami error di jam 22 ke atas
   if (currentHour >= 22 && config.extraTime === false) {
      console.log('Tidak bisa set waktu closing karena di atas jam 22');
      client.sendMessage(
         config.groupId,
         '*[BOT]* Server bot telah di restart.'
      );
      client.sendMessage(
         config.groupId,
         '*[BOT]* Transaksi lelang dilakukan secara manual.'
      );
      config.isAuctionStarting = 0;
   }
   if (currentHour < 22) {
      console.log('Berhasil set waktu closing');
      cron.schedule('1 22 * * *', async function () {
         console.log('Extra Time');
         config.extraTime = true;
         if (config.extraTime) {
            //jalankan hitung mundur 10 menit
            countdown(client, config.groupId);
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

const countdown = (client, groupId) => {
   //jika ada yg bid, reset hitung mundur ke 10 menit lgi
   if (config.addExtraTime && config.count > 0) {
      config.count = 10;
      config.addExtraTime = false;
   }
   //jika belum ada yg bid, beri nilai awal hitungan mundur 10 menit
   if (config.count === 0) {
      config.count = 10;
      const intervalID = setInterval(async () => {
         config.count--;
         if (config.count === -1) {
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

            dataRecap?.map((item, index) => {
               const bidderId = dataRecap[index].bidder_id;
               const auctionCode = dataRecap[index].auction_code;
               const bid = dataRecap[index].bid;
               if (bidderId !== null) {
                  client.sendMessage(
                     bidderId,
                     `*[BOT]* Selamat Anda pemenang lelang Ikan kode *${auctionCode}* dengan bid *${bid}*`
                  );

                  //kirim info pembayaran
                  client.sendMessage(
                     bidderId,
                     `- *PESAN OTOMATIS DARI BOT* -\n==============================\nSilahkan konfirmasi ke *admin* \nklik ${config.adminContact}\n==============================\n\n*Pembayaran ke rekening: * \n-${config.bankAccount}\n\n*Pembayaran maksimal 2 hari*\nPenitipan 6 hari, Luar pulau 12 hari\n\n*Trimakasih.*\nAdmin`
                  );
               }
            });
            clearInterval(intervalID);
         } else if (config.count === 9) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 9 menit 50 detik.'
            );
         } else if (config.count === 8) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 8 menit 50 detik.'
            );
         } else if (config.count === 7) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 7 menit 50 detik.'
            );
         } else if (config.count === 6) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 6 menit 50 detik.'
            );
         } else if (config.count === 5) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 5 menit 50 detik.'
            );
         } else if (config.count === 4) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 4 menit 50 detik.'
            );
         } else if (config.count === 3) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 3 menit 50 detik.'
            );
         } else if (config.count === 2) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 2 menit 50 detik.'
            );
         } else if (config.count === 1) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 1 menit 50 detik.'
            );
         } else if (config.count === 0) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 50 detik.'
            );
         }
      }, 1000 * 60);
      config.addExtraTime = false;
   }
};

const auctionWinnerNotification = async (client, groupId) => {
   let recapStr = `- *Selamat Kepada Pemenang Lelang Hari ini* -\n- ${utils.currentDateTime()}\n==============================\n`;
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

const recapBid = async (client, groupId) => {
   const timerId = setTimeout(async () => {
      let recapStr = `- *Rekap Bid Tertinggi Sementara* -\n=================================\n`;
      let rekapFooter = `\n=================================\n*Close lelang* : \n- Jam 22:11 WIB, ${utils.currentDateTime()}\n- Extratime 10 menit berkelanjutan`;
      let rekapFooterExtraTime = `\n=================================\n*Close lelang* : \n- Extratime 10 menit berkelanjutan\n- Tidak ada bid, *CLOSE ${utils.addSomeMinutes(
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
         recapStr = recapStr.concat(rekapFooterExtraTime);
      } else {
         recapStr = recapStr.concat(rekapFooter);
      }

      client.sendMessage(groupId, recapStr);
      clearTimeout(timerId);
   }, 3000);
};

module.exports = {
   setAuctionClosing,
   countdown,
   auctionWinnerNotification,
   recapBid,
};
