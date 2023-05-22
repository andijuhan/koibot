const config = require('../config/auctionConfig');
const utils = require('../helpers/utils');
const db = require('../helpers/database');
const fs = require('fs');
const { MessageMedia } = require('whatsapp-web.js');
const auctionLib = require('./auctionLib');

const testBot = (message) => {
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
   const messageLwcase = message.body.toLocaleLowerCase();
   if (
      config.setMedia !== false &&
      messageLwcase.includes('video') &&
      message.hasMedia &&
      chats.isGroup === false &&
      utils.isAdminBot(message)
   ) {
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
         '*[BOT]* Ketik perintah *kirim video* utk mengirim semua media yg tersimpan ke grup.'
      );
   }
};

const sendVideoToGroup = async (client, message, chats) => {
   const messageLwcase = message.body.toLocaleLowerCase();
   if (
      messageLwcase.includes('kirim video') &&
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

                  client.sendMessage(config.groupId, media, {
                     caption: mediaInfoArr[index].media_desc,
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
      await db.setAuctionInfo(message.body);
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
      //kode ikan
      const messageToArr = message.body.split(' ');
      const codes = Number(messageToArr[2]);
      const auctionCode = utils.generateCode(Number(codes));

      if (config.INFO.length > 20) {
         if (auctionCode.length >= 1) {
            //jalankan cron job
            auctionLib.setAuctionClosing(client);

            //bersihkan file

            const folder = './upload/';

            fs.readdir(folder, (err, files) => {
               if (err) throw err;
               for (const file of files) {
                  console.log(file + ' : File Deleted Successfully.');
                  fs.unlinkSync(folder + file);
               }
            });

            //bersihkan tabel

            db.cleanDataRecap();
            db.resetMedia(auctionCode);

            //reset extratime
            config.count = 0;
            config.addExtraTime = false;

            //insert kode ikan
            auctionCode.map((item, index) => {
               db.fillRecap(auctionCode[index]);
            });

            client.sendMessage(
               message.from,
               '*[BOT]* Setup lelang berhasil. Ketik *lelang dimulai* untuk memulai lelang.'
            );
            client.sendMessage(
               message.from,
               '*[BOT]* Jangan lupa upload video & deskripsi Ikan yg akan di lelang.'
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

const setRecapImage = async (client, message, chats) => {
   const messageLwcase = message.body.toLocaleLowerCase();
   if (
      messageLwcase === 'cover' &&
      message.hasMedia &&
      chats.isGroup === false &&
      utils.isAdminBot(message)
   ) {
      const attachmentData = await message.downloadMedia();
      //dapatkan ekstensi media
      const ext = attachmentData.mimetype.split('/');

      if (ext[1] === 'jpeg') {
         //simpan info media ke database
         const path = `./images/cover.jpg`;
         //simpan ke server
         fs.writeFileSync(path, attachmentData.data, 'base64', function (err) {
            if (err) {
               console.log(err);
            }
         });
         client.sendMessage(message.from, `*[BOT]* Foto rekap tersimpan`);
      } else {
         client.sendMessage(
            message.from,
            `*[BOT]* Gunakan foto dengan format .jpg`
         );
      }
   }
};

const setAuctionNumber = (client, message, chats) => {
   const messageLwcase = message.body.toLocaleLowerCase();
   if (
      messageLwcase.includes('#lelang') &&
      chats.isGroup === false &&
      utils.isAdminBot(message)
   ) {
      let auctionNumber = messageLwcase.match(/(\d+)/);
      if (auctionNumber) {
         config.auctionNumber = Number(auctionNumber[0]);
         db.setAuctionNumber(auctionNumber[0]);
         config.auctionNumber = auctionNumber[0];
         client.sendMessage(
            message.from,
            `*[BOT]* Berhasil setting No lelang : ${config.auctionNumber}`
         );
      }
   }
};

const closeAuction = async (message, chats) => {
   const messageLwcase = message.body.toLocaleLowerCase();
   if (
      messageLwcase === 'Status lelang ditutup' &&
      chats.isGroup === false &&
      utils.isAdminBot(message)
   ) {
      await db.setAuctionStatus(0);
      config.isAuctionStarting = 0;
      message.reply('*[BOT]* Lelang ditutup');
   }
};

const auctionStart = (client, message, chats) => {
   const messageLwcase = message.body.toLocaleLowerCase();
   if (
      messageLwcase === 'lelang dimulai' &&
      chats.isGroup === false &&
      utils.isAdminBot(message)
   ) {
      config.isAuctionStarting = db.setAuctionStatus(1);
      config.isAuctionStarting = true;
      message.reply('*[BOT]* Status lelang dimulai');
      client.sendMessage(
         config.groupId,
         `*[BOT]*  ِبِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيْم Lelang ke ${config.auctionNumber} *${config.groupName}* dimulai. 📣`
      );
   }
};

module.exports = {
   testBot,
   setOB,
   setKB,
   setupVideo,
   sendVideoToGroup,
   setupAuctionInfo,
   auctionSetup,
   auctionStart,
   closeAuction,
   setAuctionNumber,
   setRecapImage,
};
