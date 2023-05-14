const config = require('../config/auctionConfig');
const cron = require('node-cron');
const utils = require('../helpers/utils');
const db = require('../helpers/database');

const setClosingAuction = (client) => {
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
   if (currentHour > 22) {
      console.log('Berhasil set waktu closing');
      cron.schedule('1 22 * * *', async function () {
         console.log('Extra Time');
         config.extraTime = true;
         if (config.extraTime) {
            //jalankan hitung mundur 10 menit
            startTimer(client, config.groupId);
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

const startTimer = (client, groupId) => {
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
            await db.setInfoLelang('');
            config.INFO = '';
            //akhiri sesi lelang
            await db.setStatusLelang(0);
            config.isAuctionStarting = 0;
            //notifikasi lelang telah berakhir
            client.sendMessage(
               groupId,
               `*[BOT]* Lelang *closed* ${utils.currentDateTime()}`
            );
            auctionWinner(groupId);

            //kirim notif ke pemenang lelang
            const rekapData = await db.getAllRekapData();

            rekapData?.map((item, index) => {
               const bidder_id = rekapData[index].bidder_id;
               const kode_ikan = rekapData[index].kode_ikan;
               const bid = rekapData[index].bid;
               if (bidder_id !== null) {
                  client.sendMessage(
                     bidder_id,
                     `*[BOT]* selamat Anda pemenang lelang Ikan kode *${kode_ikan}* dengan bid *${bid}*`
                  );
                  //send media

                  //kirim info pembayaran
                  client.sendMessage(
                     bidder_id,
                     `- *PESAN OTOMATIS DARI BOT* -\n==============================\nSilahkan konfirmasi ke *admin* \nklik wa.me/6282214871668\n==============================\n\n*Pembayaran ke rekening: * \n-BCA an. Hanny Wijaya 3440523365\n\n*Pembayaran maksimal 2 hari*\nPenitipan 6 hari, Luar pulau 12 hari\n\n*Trimakasih.*\nAdmin`
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

const auctionWinner = async (client, groupId) => {
   let rekapStr = `- *Selamat Kepada Pemenang Lelang Hari ini* -\n- ${utils.currentDateTime()}\n==============================\n`;
   let rekapFooter = `\nSilahkan konfirmasi ke *admin* \nklik wa.me/6282214871668\n\n*Pembayaran ke rekening: * \n-BCA a/n Hanny Wijaya 3440523365\n\n*Pembayaran maksimal 2 hari*\nPenitipan 6 hari, Luar pulau 12 hari\n\n*Trimakasih.*\nAdmin`;
   const rekap = await db.getAllRekapData();

   rekap?.map((item, index) => {
      const bidder_id = rekap[index].bidder_id;
      const dataRekap = `Kode Ikan *${rekap[
         index
      ].kode_ikan.toUpperCase()}* Bid ${rekap[index].bid} Bidder *${
         rekap[index].bidder
      }* \n`;
      if (bidder_id !== null) {
         rekapStr = rekapStr.concat(dataRekap);
      }
   });
   rekapStr = rekapStr.concat(rekapFooter);
   client.sendMessage(groupId, rekapStr);
};

const rekap = async (client, groupId) => {
   const timerId = setTimeout(async () => {
      let rekapStr = `- *Rekap Bid Tertinggi Sementara* -\n=================================\n`;
      let rekapFooter = `\n=================================\n*Close lelang* : \n- Jam 22:11 WIB, ${utils.currentDateTime()}\n- Extratime 10 menit berkelanjutan`;
      let rekapFooterExtraTime = `\n=================================\n*Close lelang* : \n- Extratime 10 menit berkelanjutan\n- Tidak ada bid, *CLOSE ${utils.addSomeMinutes(
         config.count + 1
      )} WIB*\n- Sisa waktu *${config.count} menit*`;

      const rekap = await db.getAllRekapData();

      rekap.map((item, index) => {
         const bidder_id = rekap[index].bidder_id;
         const dataRekap = `Kode : *${rekap[
            index
         ].kode_ikan.toUpperCase()}*, Bid : ${rekap[index].bid}, Bidder : *${
            rekap[index].bidder
         }* \n`;

         const dataRekapNull = `Kode : *${rekap[
            index
         ].kode_ikan.toUpperCase()}* . . . \n`;

         if (bidder_id !== null) {
            rekapStr = rekapStr.concat(dataRekap);
         } else {
            rekapStr = rekapStr.concat(dataRekapNull);
         }
      });
      if (config.extraTime) {
         rekapStr = rekapStr.concat(rekapFooterExtraTime);
      } else {
         rekapStr = rekapStr.concat(rekapFooter);
      }

      client.sendMessage(groupId, rekapStr);
      clearTimeout(timerId);
   }, 3000);
};

module.exports = {
   setClosingAuction,
   startTimer,
   auctionWinner,
   rekap,
};
