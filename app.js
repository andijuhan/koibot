const fs = require('fs');
const qrcode = require('qrcode');
const cron = require('node-cron');
const http = require('http');
const socketIo = require('socket.io');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const db = require('./helpers/db');
const wa = require('./helpers/wa');
const dt = require('./data/data');

process.env.TZ = 'Asia/Bangkok';

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.get('/', (req, res) => {
   res.sendFile('index.html', { root: __dirname });
});

/* const client = new Client({
   puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: '/snap/bin/chromium',
   },
   authStrategy: new LocalAuth(),
}); */

const client = new Client({
   puppeteer: {
      headless: true,
      executablePath:
         'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
   },
   authStrategy: new LocalAuth(),
});

//socket.io setup
io.on('connection', (socket) => {
   socket.emit('message', 'Connecting...');

   client.on('qr', (qr) => {
      console.log('QR RECEIVED', qr);
      qrcode.toDataURL(qr, (err, url) => {
         socket.emit('qr', url);
         socket.emit('message', 'QR Code Received, scan please!');
      });
   });

   client.on('authenticated', () => {
      socket.emit('authenticated', 'Whatsapp is authenticated');
      socket.emit('message', 'Whatsapp is authenticated');
   });

   client.on('ready', () => {
      console.log('Client is ready!');
      socket.emit('ready', 'Whatsapp is ready');
      socket.emit('message', 'Whatsapp is ready');
   });
});

//auction setup
let ob = 100;
let kb = 100;
let isAuctionStarting;
let info;
let userChat;
let groupId;

let extraTime = false;
let count = 0;
let addExtraTime = false;

let setMedia;
//let mediaInfo = false;

client.on('ready', async () => {
   console.log('Mempersiapkan data lelang');
   const data = await db.getSetting();
   userChat = await client.getChats();
   groupId = wa.getGroupId(userChat);

   if (data !== false) {
      isAuctionStarting = data[0].lelang_status;
      info = data[0].info_lelang;
      if (isAuctionStarting) {
         setClosingAuction();
      }
   }
});

client.on('group_join', (notification) => {
   // User has joined or been added to the group.
   console.log(notification);
   notification.reply(
      `Selamat datang di grup *PRATAMA MO' KOI (Auction)*\nKetik *info lelang* untuk cek detail lelang.`
   );
});

client.on('disconnected', (reason) => {
   console.log('Client was logged out', reason);
   return process.exit(1);
});

client.on('message', async (message) => {
   const adminBot = dt.admins.find((admin) => {
      return admin === message.rawData.from;
   });

   const chats = await message.getChat();
   const messageLwcase = message.body.toLocaleLowerCase();
   const mediaCode = messageLwcase.slice(0, 6);

   if (chats.isGroup === false) {
      setMedia = await db.setMedia(mediaCode);
   }

   if (messageLwcase.includes('info') && messageLwcase.length < 7) {
      const mediaInfo = await db.getMediaInfo(messageLwcase);
      //info kode ikan - user
      if (mediaInfo !== false && chats.isGroup) {
         if (isAuctionStarting === 0) {
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

   //tes bot
   if (messageLwcase === 'tes bot' && chats.isGroup === false && adminBot) {
      message.reply('Bot sedang aktif.');
   }

   if (
      messageLwcase.includes('set ob') &&
      chats.isGroup === false &&
      adminBot
   ) {
      let setOb = messageLwcase.match(/(\d+)/);
      if (setOb) {
         ob = setOb[0];
         message.reply(`Berhasil setting OB : ${ob}`);
         console.log(ob);
      }
   }

   if (
      messageLwcase.includes('set kb') &&
      chats.isGroup === false &&
      adminBot
   ) {
      let setKb = messageLwcase.match(/(\d+)/);
      if (setKb) {
         kb = setKb[0];
         message.reply(`Berhasil setting KB : ${kb}`);
         console.log(kb);
      }
   }

   //setup media - admin
   if (
      setMedia !== false &&
      message.hasMedia &&
      chats.isGroup === false &&
      adminBot
   ) {
      const attachmentData = await message.downloadMedia();
      //dapatkan ekstensi media
      const ext = attachmentData.mimetype.split('/');
      //simpan info media ke database
      const path = './upload/' + setMedia + ext[1];
      const desc = message.body.replace(mediaCode, `*${mediaCode}*`);

      db.setMediaPath(path, desc, setMedia);
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

   //kirim media ke group - admin
   if (
      messageLwcase.includes('kirim media') &&
      chats.isGroup === false &&
      adminBot
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

                  setTimeout(() => {
                     client.sendMessage(groupId, media, {
                        caption: mediaInfoArr[index].media_desc,
                     });
                  }, 2000 * index);
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

   if (messageLwcase.includes('video') && isAuctionStarting) {
      message.reply(
         '*[BOT]* Untuk cek video dan deskripsi Ikan, silahkan ketik *info kode*'
      );
   }

   //setup info lelang
   if (
      message.body.includes('#LELANG') &&
      chats.isGroup === false &&
      adminBot
   ) {
      await db.setInfoLelang(message.body);
      info = message.body;
      if (info.length > 20) {
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
   //when the auction starts
   if (
      messageLwcase.includes('lelang mulai') &&
      chats.isGroup === false &&
      adminBot
   ) {
      console.log(message.rawData.from);
      const currentHour = new Date().getHours();
      if (currentHour >= 22) {
         message.reply('*[BOT]* Lelang dapat dimulai besok hari.');
         return;
      }
      //kode ikan
      const messageToArr = message.body.split(' ');
      const numOfFish = Number(messageToArr[2]);
      const fishCodes = wa.generateFishCode(Number(numOfFish));

      if (info.length > 20) {
         if (fishCodes.length >= 1) {
            //jalankan cron job
            setClosingAuction();

            //bersihkan file
            setTimeout(() => {
               client.sendMessage(
                  message.from,
                  '*[BOT]* Membersihkan file di server . . .'
               );
            }, 2000);

            const folder = './upload/';

            fs.readdir(folder, (err, files) => {
               if (err) throw err;
               for (const file of files) {
                  console.log(file + ' : File Deleted Successfully.');
                  fs.unlinkSync(folder + file);
               }
            });

            //bersihkan tabel
            setTimeout(() => {
               client.sendMessage(message.from, '*[BOT]* Reset database . . .');
               db.cleanRekapData();
               db.resetMedia(fishCodes);
            }, 4000);

            //insert kode ikan
            setTimeout(() => {
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
               client.sendMessage(groupId, info);
               client.sendMessage(
                  groupId,
                  `Ketik *bantuan* untuk cek perintah *bot*`
               );
            }, 6000);
         }
      } else {
         message.reply('*[BOT]* Silahkan buat *Info Lelang* terlebih dahulu');
      }
   }

   if (
      messageLwcase === 'lelang dimulai' &&
      chats.isGroup === false &&
      adminBot
   ) {
      isAuctionStarting = db.setStatusLelang(1);
      isAuctionStarting = true;
      client.sendMessage(
         groupId,
         '*[BOT]* Bismillah Hirohman Nirohim.. Lelang dimulai.'
      );
   }

   //ob command
   if (
      messageLwcase.includes('ob') &&
      message.body.length < 14 &&
      chats.isGroup
   ) {
      if (isAuctionStarting === 0) {
         message.reply('*[BOT]* Lelang belum dimulai. Silahkan hubungi admin.');
         return;
      }
      //remove space
      let messageOb = messageLwcase.split(' ').join('');
      //remove coma
      messageOb = messageOb.replace(/,/g, '');
      //remove dot
      messageOb = messageOb.replace(/./g, '');

      const obPosition = messageOb.search('ob');
      const codeStr = messageOb.slice(0, obPosition);
      const codeArr = codeStr.split('');

      //jika jumlah karakter pisan lebih besar dari jumlah kota ikan + ob
      if (messageOb > codeArr.length + 2) {
         message.reply('*[BOT]* Format OB salah. Silahkan ketik *bantuan*');
         return;
      }
      //perintah all ob
      if (messageOb === 'allob') {
         addExtraTime = true;
         const isCanAllOb = await db.checkIsCanAllOb();
         console.log(isCanAllOb);
         if (isCanAllOb === false) {
            message.reply('*[BOT]* Tidak SAH. Sudah Ter OB 🙏');
            return;
         }
         db.allOb(ob, message.rawData.notifyName, message.author);
         message.reply('*[BOT]* Bid *SAH*. Trimakasih 🤝');
         setTimeout(() => rekap(groupId), 3000);
         return;
      }
      //jika memasuki ekstra time, buat hitungan mundur 10 menit
      //tambah waktu 10 menit jika ada yg bid
      //jika tidak ada yg bid dalam 10 menit. akhiri sesi lelang
      addExtraTime = true;
      codeArr.map(async (item, index) => {
         //cek apakah nilai bid dari kode koi == 0?
         const checkBid = await db.checkBid(codeArr[index]);
         const kode = codeArr[index].toLocaleUpperCase();
         if (checkBid === false) {
            message.reply(`*[BOT]* Bid ${kode} Tidak SAH. Kode salah 🙏`);
            return;
         } else {
            if (extraTime) {
               //jalankan sekali
               startTimer(groupId);
            }
         }

         if (checkBid?.length > 0) {
            if (checkBid[0].bid === null) {
               db.setRekap(
                  ob,
                  message.rawData.notifyName,
                  message.author,
                  codeArr[index]
               );

               message.reply(`*[BOT]* Bid ${kode} *SAH*. Trimakasih 🤝`);
            } else {
               message.reply(`*[BOT]* Bid ${kode} Tidak SAH. Sudah ter OB 🙏.`);
            }
         }
      });
      //kirim rekap
      if (codeArr.length > 0) {
         setTimeout(() => rekap(groupId), 3000);
      }
   }

   //kb command
   if (
      messageLwcase.includes('kb') &&
      message.body.length < 14 &&
      chats.isGroup
   ) {
      if (isAuctionStarting === 0) {
         message.reply('*[BOT]* Lelang belum dimulai. Silahkan hubungi admin.');
         return;
      }
      //hapus space di chat
      const messageNoSpace = messageLwcase.split(' ').join('');
      const obPosition = messageNoSpace.search('kb');
      const codeStr = messageNoSpace.slice(0, obPosition);
      const codeArr = codeStr.split('');

      //perintah all ob
      if (messageNoSpace === 'allkb') {
         addExtraTime = true;
         const dataRekap = await db.getAllRekapData();
         if (dataRekap !== false) {
            dataRekap.map((item, index) => {
               let bid = dataRekap[index].bid;

               if (bid === null) {
                  bid = 100;
               }
               const kode = dataRekap[index].kode_ikan;
               const bidder_id = dataRekap[index].bidder_id;

               db.setRekap(
                  (bid += kb),
                  message.rawData.notifyName,
                  message.author,
                  kode
               );

               if (message.author !== bidder_id) {
                  if (bidder_id !== null) {
                     client.sendMessage(
                        bidder_id,
                        `*[BOT]* BID *${kode.toUpperCase()}* dilewati *${
                           message.rawData.notifyName
                        }*`
                     );
                  }
               }
            });
            message.reply('*[BOT]* Bid *SAH*. Trimakasih 🤝');
            setTimeout(() => rekap(groupId), 3000);
            return;
         }

         message.reply('*[BOT]* Bid *SAH*. Trimakasih 🤝');
         setTimeout(() => rekap(groupId), 3000);
         return;
      }

      //jika memasuki ekstra time, buat hitungan mundur 10 menit
      //tambah waktu 10 menit jika ada yg bid
      //jika tidak ada yg bid dalam 10 menit. akhiri sesi lelang
      addExtraTime = true;
      codeArr.map(async (item, index) => {
         const getRekapData = await db.checkBid(codeArr[index]);
         const kode = codeArr[index].toLocaleUpperCase();
         if (getRekapData === false) {
            message.reply(`*[BOT]* Bid ${kode} Tidak SAH. Kode salah 🙏`);
            return;
         } else {
            if (extraTime) {
               //jalankan sekali
               startTimer(groupId);
            }
         }

         if (getRekapData?.length > 0) {
            let bid = getRekapData[0].bid;
            if (bid === null) {
               bid = 100;
            }
            const bidder_id = getRekapData[0].bidder_id;

            db.setRekap(
               (bid += kb),
               message.rawData.notifyName,
               message.author,
               codeArr[index]
            );

            message.reply(`*[BOT]* Bid ${kode} *SAH*. Trimakasih 🤝`);

            if (message.author !== bidder_id) {
               if (bidder_id !== null) {
                  client.sendMessage(
                     bidder_id,
                     `*[BOT]* BID *${kode}* dilewati *${message.rawData.notifyName}*`
                  );
               }
            }
         }
      });
      //send rekap
      if (codeArr.length > 0) {
         setTimeout(() => rekap(groupId), 3000);
      }
   }

   //jump bid command
   const messageNoSpace = messageLwcase.split(' ').join('');
   //dapatkan nilai jump bid dari chat
   const messageToJumpBidValue = messageNoSpace.match(/\d+/g);
   let jumpBid;

   //cek apakah nilai messageToJumpBidValue tersedia?
   if (messageToJumpBidValue !== null) {
      jumpBid = dt.jumpBidPrice.find((num) => {
         return num === Number(messageToJumpBidValue[0]);
      });
   }

   if (jumpBid >= 100 && message.body.length < 14 && chats.isGroup) {
      if (isAuctionStarting === 0) {
         message.reply('*[BOT]* Lelang belum dimulai. Silahkan hubungi admin.');
         return;
      }
      //mendapatkan deret kode dari messageNoSpace
      const codeSstr = messageNoSpace.match(/[a-zA-Z]+/g);
      //pecah jadi array
      const codeArr = codeSstr[0].split('');

      addExtraTime = true;
      codeArr.map(async (item, index) => {
         const getRekapData = await db.checkBid(codeArr[index]);
         const kode = codeArr[index].toLocaleUpperCase();

         if (getRekapData === false) {
            message.reply(`*[BOT]* Bid ${kode} Tidak SAH. Kode salah 🙏`);
            return;
         } else {
            if (extraTime) {
               //jalankan sekali
               startTimer(groupId);
            }
         }

         if (getRekapData.length > 0) {
            let bid = getRekapData[0].bid;
            const bidder_id = getRekapData[0].bidder_id;
            if (bid === null) {
               bid = 100;
            }

            if (bid > jumpBid || bid === jumpBid) {
               message.reply(
                  `*[BOT]* Bid ${kode} Tidak sah. Bid harus lebih besar dari ${bid} 🙏`
               );
            }
            if (bid < jumpBid) {
               db.setRekap(
                  jumpBid,
                  message.rawData.notifyName,
                  message.author,
                  codeArr[index]
               );
               message.reply(`*[BOT]* Bid ${kode} *SAH*. Trimakasih 🤝`);
               confirm = true;
               //kirim rekap

               if (message.author !== bidder_id) {
                  if (bidder_id !== null) {
                     client.sendMessage(
                        bidder_id,
                        `*[BOT]* BID *${kode}* dilewati *${message.rawData.notifyName}*`
                     );
                  }
               }
            }
         }
      });
      if (codeArr.length > 0) {
         setTimeout(() => rekap(groupId), 3000);
      }
   }

   if (messageLwcase === 'bantuan' && chats.isGroup) {
      const head = '- *DAFTAR COMMAND BOT LELANG* -';
      const obCom =
         '*KODE OB* : Open Bid. Contoh: A OB / ABC OB (OB beberapa ikan) / ALL OB (OB semua ikan)';
      const kbCom =
         '*KODE KB* : Kelipatan Bid. Contoh: A KB / ABC KB (KB beberapa ikan) / ALL KB (KB semua ikan)';
      const jbCom =
         '*KODE NILAI_BID* : Jump Bid. Contoh: A 600 (Kelipatan 100) / ABC 500 (Jump Bid beberapa ikan)';
      const infoImg =
         '*INFO KODE* : Cek foto/video Ikan & deskripsi Ikan. Contoh: INFO A';
      const infoLel =
         '*INFO LELANG* : Info lelang hari ini. Contoh: INFO LELANG';
      const infoRekap = '*INFO REKAP* : Info rekap terbaru. Contoh: INFO REKAP';

      client.sendMessage(message.from, head);
      client.sendMessage(message.from, obCom);
      client.sendMessage(message.from, kbCom);
      client.sendMessage(message.from, jbCom);
      client.sendMessage(message.from, infoImg);
      client.sendMessage(message.from, infoLel);
      client.sendMessage(message.from, infoRekap);
   }

   if (messageLwcase === 'info lelang' && chats.isGroup) {
      if (info.length > 30) {
         client.sendMessage(message.from, info);
         client.sendMessage(
            message.from,
            `Ketik *bantuan* untuk cek perintah *bot*`
         );
      } else {
         client.sendMessage(message.from, '*[BOT]* Lelang belum dimulai.');
      }
   }

   if (messageLwcase === 'info rekap' || messageLwcase === 'rekap') {
      if (isAuctionStarting) {
         rekap(groupId);
      } else {
         client.sendMessage(message.from, '*[BOT]* Lelang belum dimulai.');
      }
   }
});

//hitung mundur 10 menit
const startTimer = (groupId) => {
   //jika ada yg bid, reset hitung mundur ke 10 menit lgi
   if (addExtraTime && count > 0) {
      count = 10;
      addExtraTime = false;
   }
   //jika belum ada yg bid, beri nilai awal hitungan mundur 10 menit
   if (count === 0) {
      count = 10;
      const intervalID = setInterval(async () => {
         count--;
         if (count === -1) {
            //reset info lelang
            await db.setInfoLelang('');
            info = '';
            //akhiri sesi lelang
            await db.setStatusLelang(0);
            isAuctionStarting = 0;
            //notifikasi lelang telah berakhir
            client.sendMessage(
               groupId,
               `*[BOT]* Lelang *closed* ${wa.currentDateTime()}`
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
         } else if (count === 9) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 9 menit 50 detik.'
            );
         } else if (count === 8) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 8 menit 50 detik.'
            );
         } else if (count === 7) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 7 menit 50 detik.'
            );
         } else if (count === 6) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 6 menit 50 detik.'
            );
         } else if (count === 5) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 5 menit 50 detik.'
            );
         } else if (count === 4) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 4 menit 50 detik.'
            );
         } else if (count === 3) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 3 menit 50 detik.'
            );
         } else if (count === 2) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 2 menit 50 detik.'
            );
         } else if (count === 1) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 1 menit 50 detik.'
            );
         } else if (count === 0) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 50 detik.'
            );
         }
      }, 1000 * 60);
      addExtraTime = false;
   }
};

const rekap = async (groupId) => {
   let rekapStr = `- *Rekap Bid Tertinggi Sementara* -\n=================================\n`;
   let rekapFooter = `\n=================================\n*Close lelang* : \n- Jam 22:11 WIB, ${wa.currentDateTime()}\n- Extratime 10 menit berkelanjutan`;
   let rekapFooterExtraTime = `\n=================================\n*Close lelang* : \n- Extratime 10 menit berkelanjutan\n- Tidak ada bid, *CLOSE ${wa.addSomeMinutes(
      count + 1
   )} WIB*\n- Sisa waktu *${count} menit*`;

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
   if (extraTime) {
      rekapStr = rekapStr.concat(rekapFooterExtraTime);
   } else {
      rekapStr = rekapStr.concat(rekapFooter);
   }

   client.sendMessage(groupId, rekapStr);
};

const auctionWinner = async (groupId) => {
   let rekapStr = `- *Selamat Kepada Pemenang Lelang Hari ini* -\n- ${wa.currentDateTime()}\n==============================\n`;
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

//setup waktu closing
const setClosingAuction = () => {
   const currentHour = new Date().getHours();
   //jika server mengalami error di jam 22 ke atas
   if (currentHour >= 22 && extraTime === false) {
      console.log('Tidak bisa set waktu closing karena di atas jam 22');
      client.sendMessage(groupId, '*[BOT]* Server bot telah di restart.');
      client.sendMessage(
         groupId,
         '*[BOT]* Transaksi lelang dilakukan secara manual.'
      );
      isAuctionStarting = 0;
   }
   if (currentHour < 22) {
      console.log('Berhasil set waktu closing');
      cron.schedule('1 22 * * *', async function () {
         console.log('Extra Time');
         extraTime = true;
         if (extraTime) {
            //jalankan hitung mundur 10 menit
            startTimer(groupId);
         }

         //kirim notif ke grup
         client.sendMessage(groupId, '*[BOT]* Memasuki masa extra time.');
         client.sendMessage(
            groupId,
            '*[BOT]* Tidak ada bid *closed* jam 22:11.'
         );
      });
   }
};

client.initialize();

server.listen(3000, () => {
   console.log('App running on *:', 3000);
});
