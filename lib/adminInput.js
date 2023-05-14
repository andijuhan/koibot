const config = require('../config/auctionConfig');
const utils = require('../helpers/utils');
const db = require('../helpers/database');
const fs = require('fs');
const { MessageMedia } = require('whatsapp-web.js');
const auctionLib = require('./auctionLib');

const tesBot = (message) => {
   message.reply('Bot sedang aktif.');
};

const setOB = (message, chats) => {
   const messageLwcase = message.body.toLocaleLowerCase();
   if (
      messageLwcase.includes('set ob') &&
      chats.isGroup === false &&
      utils.isAdminBot(message)
   ) {
      const messageLwcase = message.body.toLocaleLowerCase();
      let setOb = messageLwcase.match(/(\d+)/);
      if (setOb) {
         config.OB = Number(setOb[0]);
         message.reply(`Berhasil setting OB : ${config.OB}`);
      }
   }
};

const setKB = (message, chats) => {
   const messageLwcase = message.body.toLocaleLowerCase();
   if (
      messageLwcase.includes('set kb') &&
      chats.isGroup === false &&
      utils.isAdminBot(message)
   ) {
      let setKb = messageLwcase.match(/(\d+)/);
      if (setKb) {
         config.KB = Number(setKb[0]);
         message.reply(`Berhasil setting KB : ${config.KB}`);
      }
   }
};

const setupVideo = async (client, message, chats) => {
   if (
      config.setMedia !== false &&
      message.hasMedia &&
      chats.isGroup === false &&
      utils.isAdminBot(message)
   ) {
      const messageLwcase = message.body.toLocaleLowerCase();
      const mediaCode = messageLwcase.slice(0, 7);
      const attachmentData = await message.downloadMedia();
      //dapatkan ekstensi media
      const ext = attachmentData.mimetype.split('/');
      //simpan info media ke database
      const path = './upload/' + config.setMedia + ext[1];
      const desc = message.body.replace(mediaCode, `*${mediaCode}*`);

      db.setMediaPath(path, desc, config.setMedia);
      //simpan ke server
      fs.writeFileSync(path, attachmentData.data, 'base64', function (err) {
         if (err) {
            console.log(err);
         }
      });

      client.sendMessage(
         message.from,
         '*[BOT]* Media berhasil disimpan ke server.'
      );
      client.sendMessage(
         message.from,
         '*[BOT]* Ketik perintah *kirim media* utk mengirim semua media yg tersimpan ke grup.'
      );
   }
};

const sendVideoToGroup = async (client, message, chats) => {
   const messageLwcase = message.body.toLocaleLowerCase();
   if (
      messageLwcase.includes('kirim media') &&
      chats.isGroup === false &&
      utils.isAdminBot(message)
   ) {
      const mediaInfoArr = await db.getAllMediaInfo();

      if (mediaInfoArr !== false) {
         mediaInfoArr?.map((item, index) => {
            try {
               if (fs.existsSync(mediaInfoArr[index].path)) {
                  //file exists
                  const media = MessageMedia.fromFilePath(
                     mediaInfoArr[index].path
                  );

                  // eslint-disable-next-line no-undef
                  setImmediate(() => {
                     client.sendMessage(config.groupId, media, {
                        caption: mediaInfoArr[index].media_desc,
                     });
                  });
               }
            } catch (err) {
               console.error(err);
            }
         });
         message.reply('*[BOT]* Media berhasil dikirim ke grup.');
      } else {
         message.reply('*[BOT]* Media terhapus. Silahkan ulangi setup media.');
      }
   }
};

const setupAuctionInfo = async (client, message, chats) => {
   if (
      message.body.includes('#LELANG') &&
      chats.isGroup === false &&
      utils.isAdminBot(message)
   ) {
      await db.setInfoLelang(message.body);
      config.INFO = message.body;
      if (config.INFO.length > 20) {
         client.sendMessage(message.from, '*[BOT]* Info lelang tersimpan.');
         client.sendMessage(
            message.from,
            '*[BOT]* Selanjutnya ketik perintah : *lelang mulai (jumlah ikan yg di lelang)* untuk setup lelang.'
         );
         client.sendMessage(
            message.from,
            '*[BOT]* Contoh : *lelang mulai 10*.'
         );
      }
   }
};

const auctionSetup = (client, message, chats) => {
   const messageLwcase = message.body.toLocaleLowerCase();
   if (
      messageLwcase.includes('lelang mulai') &&
      chats.isGroup === false &&
      utils.isAdminBot(message)
   ) {
      const currentHour = new Date().getHours();
      if (currentHour >= 24) {
         message.reply('*[BOT]* Lelang dapat dimulai besok hari.');
         return;
      }
      //kode ikan
      const messageToArr = message.body.split(' ');
      const numOfFish = Number(messageToArr[2]);
      const fishCodes = utils.generateCode(Number(numOfFish));

      if (config.INFO.length > 20) {
         if (fishCodes.length >= 1) {
            //jalankan cron job
            auctionLib.setClosingAuction(client);

            //bersihkan file
            client.sendMessage(
               message.from,
               '*[BOT]* Membersihkan file di server . . .'
            );

            const folder = './upload/';

            fs.readdir(folder, (err, files) => {
               if (err) throw err;
               for (const file of files) {
                  console.log(file + ' : File Deleted Successfully.');
                  fs.unlinkSync(folder + file);
               }
            });

            //bersihkan tabel
            client.sendMessage(message.from, '*[BOT]* Reset database . . .');
            db.cleanRekapData();
            db.resetMedia(fishCodes);

            //insert kode ikan
            fishCodes.map((item, index) => {
               db.fillRekap(fishCodes[index]);
            });

            client.sendMessage(
               message.from,
               '*[BOT]* Lelang sudah di setup. Ketik *lelang dimulai* untuk memulai lelang.'
            );
            client.sendMessage(
               message.from,
               '*[BOT]* Jangan lupa setup foto/video & deskripsi Ikan yg akan di lelang.'
            );
            //send message to group
            client.sendMessage(config.groupId, config.INFO);
            client.sendMessage(
               config.groupId,
               `Ketik *bantuan* untuk cek perintah *bot*`
            );
         }
      } else {
         message.reply('*[BOT]* Silahkan buat *Info Lelang* terlebih dahulu');
      }
   }
};

const auctionStart = (client, message, chats) => {
   const messageLwcase = message.body.toLocaleLowerCase();
   if (
      messageLwcase === 'lelang dimulai' &&
      chats.isGroup === false &&
      utils.isAdminBot(message)
   ) {
      config.isAuctionStarting = db.setStatusLelang(1);
      config.isAuctionStarting = true;
      client.sendMessage(
         config.groupId,
         '*[BOT]* Bismillah Hirohman Nirohim.. Lelang dimulai.'
      );
   }
};

module.exports = {
   tesBot,
   setOB,
   setKB,
   setupVideo,
   sendVideoToGroup,
   setupAuctionInfo,
   auctionSetup,
   auctionStart,
};
