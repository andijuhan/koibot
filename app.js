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

const client = new Client({
   puppeteer: {
      executablePath:
         'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
   },
   authStrategy: new LocalAuth(),
});

//socket.io setup
io.on('connection', (socket) => {
   socket.emit('message', 'Connecting...');

   client.on('qr', (qr) => {
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
let kb = 50;
let isAuctionStarting = false;
let extraTime = false;
let count = 0;
let addExtraTime = false;
let info = '';
let setMedia;
let mediaInfo = false;

client.on('message', async (message) => {
   const chats = await message.getChat();
   const userChat = await client.getChats();

   const messageLwcase = message.body.toLocaleLowerCase();
   const mediaCode = messageLwcase.slice(0, 6);

   if (chats.isGroup) {
      setMedia = await db.setMedia(mediaCode);
   }

   if (messageLwcase.includes('info')) {
      mediaInfo = await db.getMediaInfo(messageLwcase);
   }

   //get group id
   const groupId = wa.getGroupId(userChat);

   //setup media - admin
   if (setMedia !== false && message.hasMedia && chats.isGroup === false) {
      const attachmentData = await message.downloadMedia();
      //dapatkan ekstensi media
      const ext = attachmentData.mimetype.split('/');
      //simpan info media ke database
      const path = './upload/' + setMedia + ext[1];
      const desc = message.body;

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
   if (messageLwcase.includes('kirim media') && chats.isGroup === false) {
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

   //info kode ikan - user
   if (mediaInfo !== false && chats.isGroup) {
      try {
         if (fs.existsSync(mediaInfo.path)) {
            //file exists
            const media = MessageMedia.fromFilePath(mediaInfo.path);

            client.sendMessage(message.from, '*[BOT]* Downloading media . . .');
            setTimeout(() => {
               client.sendMessage(message.from, media, {
                  caption: mediaInfo.media_desc,
               });
            }, 2000);
         } else {
            message.reply(
               '*[BOT]* Foto/Video belum tersedia. Silahkan hubungi admin.'
            );
         }
      } catch (err) {
         console.log(err);
      }
   }

   //setup info lelang
   if (message.body.includes('#LELANG') && chats.isGroup === false) {
      info = message.body;
      if (info.length > 20) {
         client.sendMessage(message.from, '*[BOT]* Info lelang tersimpan.');
         client.sendMessage(
            message.from,
            '*[BOT]* Selanjutnya ketik perintah : *lelang mulai (jumlah ikan yg di lelang)*.'
         );
         client.sendMessage(
            message.from,
            '*[BOT]* Contoh : *lelang mulai 10*.'
         );
      }
   }
   //when the auction starts
   if (messageLwcase.includes('lelang mulai') && chats.isGroup === false) {
      //kode ikan
      const messageToArr = message.body.split(' ');
      const numOfFish = Number(messageToArr[2]);
      const fishCodes = wa.generateFishCode(Number(numOfFish));

      if (info.length > 20) {
         if (fishCodes.length >= 1) {
            isAuctionStarting = true;

            //jalankan cron job
            cron.schedule('40 10 * * *', async function () {
               console.log('Extra Time');
               extraTime = true;

               //kirim notif ke grup
               client.sendMessage(groupId, '*[BOT]* Memasuki masa extra time.');
               client.sendMessage(
                  groupId,
                  '*[BOT]* Tidak ada bid *closed* jam 21:10.'
               );
            });

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
            let sendToGroup = false;
            setTimeout(() => {
               fishCodes.map((item, index) => {
                  db.fillRekap(fishCodes[index]);
                  if (sendToGroup === false) {
                     //confirm
                     client.sendMessage(
                        message.from,
                        '*[BOT]* Lelang siap dimulai. Info lelang sudah dikirim ke group.'
                     );
                     client.sendMessage(
                        message.from,
                        '*[BOT]* Jangan lupa setup foto/video & deskripsi Ikan yg akan di lelang.'
                     );
                     //send message to group
                     client.sendMessage(groupId, info);
                     sendToGroup = true;
                  }
               });
            }, 6000);
         }
      } else {
         message.reply('*[BOT]* Silahkan buat *Info Lelang* terlebih dahulu');
      }
   }

   //ob command
   if (
      messageLwcase.includes('ob') &&
      message.body.length < 14 &&
      chats.isGroup &&
      isAuctionStarting
   ) {
      //hapus space di chat
      const messageNoSpace = messageLwcase.split(' ').join('');
      const obPosition = messageNoSpace.search('ob');
      const codeStr = messageNoSpace.slice(0, obPosition);
      const codeArr = codeStr.split('');
      //jika memasuki ekstra time, buat hitungan mundur 10 menit
      //tambah waktu 10 menit jika ada yg bid
      //jika tidak ada yg bid dalam 10 menit. akhiri sesi lelang
      if (extraTime) {
         //jalankan sekali
         addExtraTime = true;
         startTimer(groupId);
      }

      let confirm = false;
      codeArr.map(async (item, index) => {
         //cek apakah nilai bid dari kode koi == 0?
         const checkBid = await db.checkBid(codeArr[index]);

         if (checkBid?.length > 0) {
            if (checkBid[0].bid === 0 || checkBid[0].bid === null) {
               db.setRekap(
                  ob,
                  message.rawData.notifyName,
                  message.author,
                  codeArr[index]
               );

               if (confirm === false) {
                  message.reply('*[BOT]* Bid *SAH*. Trimakasih 🤝');
                  confirm = true;
                  //kirim rekap
                  setTimeout(() => rekap(groupId), 3000);
               }
            }
         }
      });
   }

   //kb command
   if (
      messageLwcase.includes('kb') &&
      message.body.length < 14 &&
      chats.isGroup
   ) {
      //hapus space di chat
      const messageNoSpace = messageLwcase.split(' ').join('');
      const obPosition = messageNoSpace.search('kb');
      const codeStr = messageNoSpace.slice(0, obPosition);
      const codeArr = codeStr.split('');

      //jika memasuki ekstra time, buat hitungan mundur 10 menit
      //tambah waktu 10 menit jika ada yg bid
      //jika tidak ada yg bid dalam 10 menit. akhiri sesi lelang

      if (extraTime) {
         //jalankan sekali
         addExtraTime = true;
         startTimer(groupId);
      }

      let confirm = false;
      codeArr.map(async (item, index) => {
         const getRekapData = await db.checkBid(codeArr[index]);
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

            if (confirm === false) {
               message.reply('*[BOT]* Bid *SAH*. Trimakasih 🤝');
               confirm = true;
               //send rekap
               setTimeout(() => rekap(groupId), 3000);
               if (message.author !== bidder_id) {
                  if (bidder_id !== null) {
                     client.sendMessage(
                        bidder_id,
                        `*[BOT]* BID *${codeArr[
                           index
                        ].toUpperCase()}* dilewati *${
                           message.rawData.notifyName
                        }*`
                     );
                  }
               }
            }
         }
      });
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
      //mendapatkan deret kode dari messageNoSpace
      const codeSstr = messageNoSpace.match(/[a-zA-Z]+/g);
      //pecah jadi array
      const codeArr = codeSstr[0].split('');

      if (extraTime) {
         //jalankan sekali
         addExtraTime = true;
         startTimer(groupId);
      }

      let confirm = false;
      codeArr.map(async (item, index) => {
         const getRekapData = await db.checkBid(codeArr[index]);

         if (getRekapData.length > 0) {
            let bid = getRekapData[0].bid;
            if (bid === null) {
               bid = 100;
            }
            const bidder_id = getRekapData[0].bidder_id;

            if (bid < jumpBid) {
               db.setRekap(
                  jumpBid,
                  message.rawData.notifyName,
                  message.author,
                  codeArr[index]
               );
               if (confirm === false) {
                  message.reply('*[BOT]* Bid *SAH*. Trimakasih 🤝');
                  confirm = true;
                  //kirim rekap
                  setTimeout(() => rekap(groupId), 3000);
                  if (message.author !== bidder_id) {
                     if (bidder_id !== null) {
                        client.sendMessage(
                           bidder_id,
                           `*[BOT]* BID *${codeArr[
                              index
                           ].toUpperCase()}* dilewati *${
                              message.rawData.notifyName
                           }*`
                        );
                     }
                  }
               }
            }
         }
      });
   }

   if (messageLwcase === 'bantuan' && chats.isGroup) {
      const head = '*DAFTAR COMMAND BOT LELANG*';
      const obCom = '*KODE OB* : Open Bid. Contoh: A OB / ABC OB';
      const kbCom = '*KODE KB* : Kelipatan Bid. Contoh: A KB / ABC KB';
      const jbCom =
         '*KODE NILAI_BID* : Jump Bid. Contoh: A 600 (Kelipatan 100)';
      const infoImg =
         '*INFO KODE* : Cek foto/video Ikan & deskripsi Ikan. Contoh: INFO A';
      const infoLel =
         '*INFO LELANG* : Info lelang hari ini. Contoh: INFO LELANG';

      client.sendMessage(message.from, head);
      client.sendMessage(message.from, obCom);
      client.sendMessage(message.from, kbCom);
      client.sendMessage(message.from, jbCom);
      client.sendMessage(message.from, infoImg);
      client.sendMessage(message.from, infoLel);
   }

   if (messageLwcase === 'info lelang' && chats.isGroup) {
      if (info.length > 30) {
         client.sendMessage(message.from, info);
      } else {
         client.sendMessage(message.from, '*[BOT]* Lelang belum dimulai.');
      }
   }
});

const startTimer = (groupId) => {
   if (addExtraTime && count > 0) {
      count += 10;
   }
   if (count === 0) {
      count = 10;
      const intervalID = setInterval(async () => {
         count--;
         if (count <= 0) {
            //reset info lelang
            info = '';
            //akhiri sesi lelang
            isAuctionStarting = false;
            //notifikasi lelang telah berakhir
            client.sendMessage(
               groupId,
               `*[BOT]* Lelang *closed* ${wa.currentDateTime()}`
            );
            auctionWinner(groupId);
            //kirim notif ke pemenang lelang
            const rekapData = await db.getAllRekapData();
            let send = false;
            rekapData?.map((item, index) => {
               const bidder_id = rekapData[index].bidder_id;
               const kode_ikan = rekapData[index].kode_ikan;
               const bid = rekapData[index].bid;
               if (bidder_id !== null) {
                  client.sendMessage(
                     bidder_id,
                     `*[BOT]* selamat Anda pemenang lelang ikan *${kode_ikan}* dengan bid *${bid}*`
                  );
                  //send media

                  if (send === false) {
                     //kirim info pembayaran
                     setTimeout(() => {
                        client.sendMessage(
                           bidder_id,
                           '- *PESAN OTOMATIS DARI BOT* -\n==============================\nSilahkan konfirmasi ke *admin* \nklik wa.me/6282214871668\n==============================\n\n*Pembayaran ke rekening: * \n-BCA an. Mumu Abdul Muti 2990769934\n\n*Pembayaran maksimal 2 hari*\nPenitipan 6 hari, Luar pulau 12 hari\n\n*Trimakasih.*\nAdmin'
                        );
                     }, 3000);
                     send = true;
                  }
               }
            });
            clearInterval(intervalID);
         } else if (count === 9) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 9 menit.'
            );
         } else if (count === 8) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 8 menit.'
            );
         } else if (count === 7) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 7 menit.'
            );
         } else if (count === 6) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 6 menit.'
            );
         } else if (count === 5) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 5 menit.'
            );
         } else if (count === 4) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 4 menit.'
            );
         } else if (count === 3) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 3 menit.'
            );
         } else if (count === 2) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 2 menit.'
            );
         } else if (count === 1) {
            client.sendMessage(
               groupId,
               '*[BOT]* Lelang *closed* dalam 1 menit.'
            );
         }
      }, 1000 * 60);
      addExtraTime = false;
   }
};

const rekap = async (groupId) => {
   let rekapStr = `- *Rekap Bid Tertinggi Sementara ${wa.currentDateTime()}* -\n=================================\n`;

   const rekap = await db.getAllRekapData();
   rekap.map((item, index) => {
      const bidder_id = rekap[index].bidder_id;
      const dataRekap = `*${rekap[index].kode_ikan.toUpperCase()}* = ${
         rekap[index].bid
      } *${rekap[index].bidder}* \n`;

      const dataRekapNull = `*${rekap[index].kode_ikan.toUpperCase()}* = \n`;

      if (bidder_id !== null) {
         rekapStr = rekapStr.concat(dataRekap);
      } else {
         rekapStr = rekapStr.concat(dataRekapNull);
      }
   });
   client.sendMessage(groupId, rekapStr);
};

const auctionWinner = async (groupId) => {
   let rekapStr = `- *Selamat Kepada Pemenang Lelang Hari ini ${wa.currentDateTime()}* -\n==============================\n`;
   const rekap = await db.getAllRekapData();

   rekap?.map((item, index) => {
      const bidder_id = rekap[index].bidder_id;
      const dataRekap = `Ikan *${rekap[index].kode_ikan.toUpperCase()}* ${
         rekap[index].bid
      } *${rekap[index].bidder}* \n`;
      if (bidder_id !== null) {
         rekapStr = rekapStr.concat(dataRekap);
      }
   });
   client.sendMessage(groupId, rekapStr);
};

client.initialize();

server.listen(8000, () => {
   console.log('App running on *:', 8000);
});
