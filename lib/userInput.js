const db = require('../helpers/database');
const config = require('../config/auctionConfig');
const utils = require('../helpers/utils');
const fs = require('fs');
const { MessageMedia } = require('whatsapp-web.js');
const auctionLib = require('./auctionLib');

const checkVideo = async (client, message, chats) => {
   const messageLwcase = message.body.toLocaleLowerCase();

   if (messageLwcase.includes('video') && messageLwcase.length < 8) {
      const mediaInfo = await db.getMediaInfo(messageLwcase);
      //info kode ikan - user
      if (mediaInfo !== false && chats.isGroup) {
         if (config.isAuctionStarting === 0) {
            message.reply(
               '*[BOT]* Lelang belum dimulai. Silahkan hubungi admin.'
            );
            return;
         }
         try {
            if (fs.existsSync(mediaInfo.path)) {
               //file exists
               const media = MessageMedia.fromFilePath(mediaInfo.path);

               client.sendMessage(
                  message.from,
                  '*[BOT]* Downloading media . . .'
               );
               client.sendMessage(message.from, media, {
                  caption: mediaInfo.media_desc,
               });
               //mediaInfo = false;
            } else {
               message.reply(
                  '*[BOT]* Foto/Video belum tersedia. Silahkan hubungi admin.'
               );
            }
         } catch (err) {
            console.log(err);
         }
      }
   }
};

const OBHandle = async (client, message, chats) => {
   const messageLwcase = message.body.toLocaleLowerCase();
   if (
      messageLwcase.includes('ob') &&
      message.body.length < 14 &&
      chats.isGroup
   ) {
      if (config.isAuctionStarting === 0) {
         message.reply('*[BOT]* Lelang belum dimulai. Silahkan hubungi admin.');
         return;
      }
      if (messageLwcase.includes('kb')) {
         message.reply('*[BOT]* Format OB salah. Silahkan ketik *bantuan*');
         return;
      }
      if (messageLwcase.includes('\n')) {
         message.reply('*[BOT]* Format OB salah. Silahkan ketik *bantuan*');
         return;
      }
      //remove space
      let messageOb = messageLwcase.split(' ').join('');
      //remove coma
      messageOb = messageOb.replace(/,/g, '');
      //remove dot
      messageOb = messageOb.replace(/\./g, '');

      const obPosition = messageOb.search('ob');
      const codeStr = messageOb.slice(0, obPosition);
      const codeArr = codeStr.split('');

      //perintah all ob
      if (messageOb === 'allob') {
         config.addExtraTime = true;
         const isCanAllOb = await db.checkIsCanAllOb();

         if (isCanAllOb === false) {
            message.reply('*[BOT]* Tidak SAH. Sudah Ter OB 🙏');
            return;
         }
         db.allOb(config.OB, message.rawData.notifyName, message.author);
         message.reply('*[BOT]* Bid *SAH*. Trimakasih 🤝');
         auctionLib.recapBid(client, config.groupId);
         return;
      }

      //jika jumlah karakter pisan lebih besar dari jumlah kota ikan + ob
      if (messageOb.length > codeArr.length + 2) {
         message.reply('*[BOT]* Format OB salah. Silahkan ketik *bantuan*');
         return;
      }
      //jika memasuki ekstra time, buat hitungan mundur 10 menit
      //tambah waktu 10 menit jika ada yg bid
      //jika tidak ada yg bid dalam 10 menit. akhiri sesi lelang
      config.addExtraTime = true;

      codeArr.map(async (item, index) => {
         //cek apakah nilai bid dari kode koi == 0?
         const checkBid = await db.checkBid(codeArr[index]);
         const code = codeArr[index].toLocaleUpperCase();
         if (checkBid === false) {
            message.reply(`*[BOT]* Bid ${code} Tidak SAH. Kode salah 🙏`);
            return;
         } else {
            if (config.extraTime) {
               //jalankan sekali
               auctionLib.countdown(client);
            }
         }

         if (checkBid?.length > 0) {
            if (checkBid[0].bid === null) {
               db.setRecap(
                  config.OB,
                  message.rawData.notifyName,
                  message.author,
                  codeArr[index]
               );

               message.reply(`*[BOT]* Bid ${code} *SAH*. Trimakasih 🤝`);
            } else {
               message.reply(`*[BOT]* Bid ${code} Tidak SAH. Sudah ter OB 🙏.`);
            }
         }
      });
      //send rekap
      if (codeArr.length > 0) {
         auctionLib.recapBid(client, config.groupId);
      }
   }
};

const KBHandle = async (client, message, chats) => {
   const messageLwcase = message.body.toLocaleLowerCase();
   if (
      messageLwcase.includes('kb') &&
      message.body.length < 14 &&
      chats.isGroup
   ) {
      if (config.isAuctionStarting === 0) {
         message.reply('*[BOT]* Lelang belum dimulai. Silahkan hubungi admin.');
         return;
      }
      if (messageLwcase.includes('ob')) {
         message.reply('*[BOT]* Format KB salah. Silahkan ketik *bantuan*');
         return;
      }
      if (messageLwcase.includes('\n')) {
         message.reply('*[BOT]* Format KB salah. Silahkan ketik *bantuan*');
         return;
      }
      //hapus space di chat
      let messageKb = messageLwcase.split(' ').join('');
      //remove coma
      messageKb = messageKb.replace(/,/g, '');
      //remove dot
      messageKb = messageKb.replace(/\./g, '');

      const obPosition = messageKb.search('kb');
      const codeStr = messageKb.slice(0, obPosition);
      const codeArr = codeStr.split('');

      //perintah all ob
      if (messageKb === 'allkb') {
         config.addExtraTime = true;
         const dataRecap = await db.getAllDataRecap();
         if (dataRecap !== false) {
            dataRecap.map((item, index) => {
               let bid = dataRecap[index].bid;

               if (bid === null) {
                  bid = config.OB;
               }
               const code = dataRecap[index].auction_code;
               const bidderId = dataRecap[index].bidder_id;

               db.setRecap(
                  (bid += config.KB),
                  message.rawData.notifyName,
                  message.author,
                  code
               );

               if (message.author !== bidderId) {
                  if (bidderId !== null) {
                     client.sendMessage(
                        bidderId,
                        `*[BOT]* BID *${code.toUpperCase()}* dilewati *${
                           message.rawData.notifyName
                        }*`
                     );
                  }
               }
            });
            message.reply('*[BOT]* Bid *SAH*. Trimakasih 🤝');
            auctionLib.recapBid(client, config.groupId);
            return;
         }

         message.reply('*[BOT]* Bid *SAH*. Trimakasih 🤝');
         auctionLib.recapBid(client, config.groupId);
         return;
      }

      //jika jumlah karakter pisan lebih besar dari jumlah kota ikan + ob
      if (messageKb.length > codeArr.length + 2) {
         message.reply('*[BOT]* Format KB salah. Silahkan ketik *bantuan*');
         return;
      }

      //jika memasuki ekstra time, buat hitungan mundur 10 menit
      //tambah waktu 10 menit jika ada yg bid
      //jika tidak ada yg bid dalam 10 menit. akhiri sesi lelang
      config.addExtraTime = true;
      codeArr.map(async (item, index) => {
         const getDataRecap = await db.checkBid(codeArr[index]);
         const code = codeArr[index].toLocaleUpperCase();
         if (getDataRecap === false) {
            message.reply(`*[BOT]* Bid ${code} Tidak SAH. Kode salah 🙏`);
            return;
         } else {
            if (config.extraTime) {
               //jalankan sekali
               auctionLib.countdown(client);
            }
         }

         if (getDataRecap?.length > 0) {
            let bid = getDataRecap[0].bid;
            if (bid === null) {
               bid = config.OB;
            }
            const bidderId = getDataRecap[0].bidder_id;

            db.setRecap(
               (bid += config.KB),
               message.rawData.notifyName,
               message.author,
               codeArr[index]
            );

            message.reply(`*[BOT]* Bid ${code} *SAH*. Trimakasih 🤝`);

            if (message.author !== bidderId) {
               if (bidderId !== null) {
                  client.sendMessage(
                     bidderId,
                     `*[BOT]* BID *${code}* dilewati *${message.rawData.notifyName}*`
                  );
               }
            }
         }
      });
      //send rekap
      if (codeArr.length > 0) {
         auctionLib.recapBid(client, config.groupId);
      }
   }
};

const jumpBidHandle = (client, message, chats) => {
   const messageLwcase = message.body.toLocaleLowerCase();
   const messageNoSpace = messageLwcase.split(' ').join('');
   //dapatkan nilai jump bid dari chat
   const messageToJumpBidValue = messageNoSpace.match(/\d+/g);

   //cek apakah nilai messageToJumpBidValue tersedia?
   if (messageToJumpBidValue !== null) {
      const jumpBid = config.jumpBidPrice.find((num) => {
         return num === Number(messageToJumpBidValue[0]);
      });

      if (jumpBid >= 100 && message.body.length < 14 && chats.isGroup) {
         if (config.isAuctionStarting === 0) {
            message.reply(
               '*[BOT]* Lelang belum dimulai. Silahkan hubungi admin.'
            );
            return;
         }
         //mendapatkan deret kode dari messageNoSpace
         const codeSstr = messageNoSpace.match(/[a-zA-Z]+/g);
         //pecah jadi array
         const codeArr = codeSstr[0].split('');

         config.addExtraTime = true;
         codeArr.map(async (item, index) => {
            const getDataRecap = await db.checkBid(codeArr[index]);
            const code = codeArr[index].toLocaleUpperCase();

            if (getDataRecap === false) {
               message.reply(`*[BOT]* Bid ${code} Tidak SAH. Kode salah 🙏`);
               return;
            } else {
               if (config.extraTime) {
                  //jalankan sekali
                  auctionLib.countdown(client);
               }
            }

            if (getDataRecap.length > 0) {
               let bid = getDataRecap[0].bid;
               const bidderId = getDataRecap[0].bidder_id;
               if (bid === null) {
                  bid = 100;
               }

               if (bid > jumpBid || bid === jumpBid) {
                  message.reply(
                     `*[BOT]* Bid ${code} Tidak sah. Bid harus lebih besar dari ${bid} 🙏`
                  );
               }
               if (bid < jumpBid) {
                  db.setRecap(
                     jumpBid,
                     message.rawData.notifyName,
                     message.author,
                     codeArr[index]
                  );
                  message.reply(`*[BOT]* Bid ${code} *SAH*. Trimakasih 🤝`);
                  //kirim rekap

                  if (message.author !== bidderId) {
                     if (bidderId !== null) {
                        client.sendMessage(
                           bidderId,
                           `*[BOT]* BID *${code}* dilewati *${message.rawData.notifyName}*`
                        );
                     }
                  }
               }
            }
         });
         if (codeArr.length > 0) {
            auctionLib.recapBid(client, config.groupId);
         }
      }
   }
};

const helper = (client, message, chats) => {
   const messageLwcase = message.body.toLocaleLowerCase();
   if (messageLwcase === 'bantuan' && chats.isGroup) {
      const head = '- *DAFTAR COMMAND BOT LELANG* -';
      const obCom =
         'Open Bid. Contoh: A OB / ABC OB (OB beberapa ikan) / ALL OB (OB semua ikan)';
      const kbCom =
         'Kelipatan Bid. Contoh: A KB / ABC KB (KB beberapa ikan) / ALL KB (KB semua ikan)';
      const jbCom =
         'Jump Bid. Contoh: A 600 (Kelipatan 100) / ABC 500 (Jump Bid beberapa ikan)';
      const VideoInfo = 'Cek video Ikan. Contoh: VIDEO A';
      const AuctionInfo = 'Info lelang hari ini. Contoh: INFO LELANG';
      const recapInfo = 'Info rekap terbaru. Contoh: INFO REKAP';

      client.sendMessage(message.from, head);
      client.sendMessage(message.from, obCom);
      client.sendMessage(message.from, kbCom);
      client.sendMessage(message.from, jbCom);
      client.sendMessage(message.from, VideoInfo);
      client.sendMessage(message.from, AuctionInfo);
      client.sendMessage(message.from, recapInfo);
   }

   if (messageLwcase === 'info lelang' && chats.isGroup) {
      if (config.INFO.length > 30 && config.isAuctionStarting) {
         client.sendMessage(message.from, config.INFO);
         client.sendMessage(
            message.from,
            `Ketik *bantuan* untuk cek perintah *bot*`
         );
      } else {
         client.sendMessage(message.from, '*[BOT]* Lelang belum dimulai.');
      }
   }

   if (messageLwcase === 'info rekap' || messageLwcase === 'rekap') {
      if (config.isAuctionStarting) {
         auctionLib.recapBid(client, config.groupId);
      } else {
         client.sendMessage(message.from, '*[BOT]* Lelang belum dimulai.');
      }
   }

   if (
      messageLwcase === 'tes bot' &&
      chats.isGroup === false &&
      utils.isAdminBot(message)
   ) {
      message.reply('Bot sedang aktif.');
   }
};

module.exports = {
   checkVideo,
   OBHandle,
   KBHandle,
   jumpBidHandle,
   helper,
};
