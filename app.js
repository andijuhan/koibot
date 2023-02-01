const fs = require('fs');
const qrcode = require('qrcode');
const cron = require('node-cron');
const http = require('http');
const socketIo = require('socket.io');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const mysql = require('mysql');
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

//database connection
const con = mysql.createConnection({
   host: 'localhost',
   user: 'root',
   password: '',
   database: 'koibot',
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
let info = '';
let aMediaPath = '';
let aMediaDesc = '';
const groupName = 'Rajabot Testing';

con.connect(function (err) {
   if (err) throw err;

   client.on('message', async (message) => {
      const messageLwcase = message.body.toLocaleLowerCase();
      const mediaCode = messageLwcase.slice(0, 6);
      const setMedia = await db.setMedia(mediaCode);
      const mediaInfo = await db.getMediaInfo(messageLwcase);
      const chats = await message.getChat();
      const userChat = await client.getChats();

      //get group id
      const groupId = wa.getGroupId(userChat, groupName);

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

         message.reply('Media berhasil disimpan.');
      }

      //kirim media ke group - admin
      if (messageLwcase.includes('kirim info') && chats.isGroup === false) {
         const mediaInfoArr = await db.getAllMediaInfo();

         mediaInfoArr.map((item, index) => {
            const media = MessageMedia.fromFilePath(mediaInfoArr[index].path);
            setTimeout(() => {
               client.sendMessage(groupId, media, {
                  caption: mediaInfoArr[index].media_desc,
               });
            }, 2000 * index);
         });
      }

      //info kode ikan - user
      if (mediaInfo !== false && chats.isGroup) {
         const media = MessageMedia.fromFilePath(mediaInfo.path);

         client.sendMessage(message.from, 'Downloading media . . .');
         setTimeout(() => {
            client.sendMessage(message.from, media, {
               caption: mediaInfo.media_desc,
            });
         }, 2000);
      }

      //setup info lelang
      if (message.body.includes('#LELANG') && chats.isGroup === false) {
         info = message.body;
         if (info.length > 20) console.log('info lelang tersimpan.');
         client.sendMessage(message.from, 'Info lelang tersimpan');
         client.sendMessage(
            message.from,
            'ketik : lelang mulai (jumlah ikan yg di lelang)\nContoh : lelang mulai 10'
         );
      }
      //when the auction starts
      if (
         messageLwcase.includes('lelang mulai') &&
         chats.isGroup === false &&
         info > 20
      ) {
         //kode ikan
         const messageToArr = message.body.split(' ');
         const numOfFish = Number(messageToArr[2]);
         const fishCodes = wa.generateFishCode(Number(numOfFish));
         console.log(fishCodes);

         if (fishCodes.length >= 1) {
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
            db.cleanRekapData();
            //insert kode ikan
            let sendToGroup = false;
            setTimeout(() => {
               fishCodes.map((item, index) => {
                  db.fillRekap(fishCodes[index]);
                  if (sendToGroup === false) {
                     //confirm
                     client.sendMessage(
                        message.from,
                        'Lelang telah dimulai. Info lelang sudah dikirim ke group.'
                     );
                     //send message to group
                     client.sendMessage(groupId, info);
                     sendToGroup = true;
                  }
               });
            }, 3000);
         }

         isAuctionStarting = true;
         console.log('Lelang telah dimulai');

         //jalankan cron job
         cron.schedule('46 21 * * *', async function () {
            info = '';
            console.log('Lelang berakhir');
            isAuctionStarting = false;
            //kirim notif ke grup
            client.sendMessage(groupId, 'Lelang berakhir');
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
                     `selamat Anda pemenang lelang ikan ${kode_ikan} dengan bid ${bid}`
                  );
               }
            });
         });
         //send notification of remaining auction time
         cron.schedule('50 20 * * *', function () {
            client.sendMessage(groupId, 'Lelang akan berakhir dalam 10 menit');
         });
         cron.schedule('55 20 * * *', function () {
            client.sendMessage(groupId, 'Lelang akan berakhir dalam 5 menit');
         });
      }

      //ob command
      if (
         message.body.toLowerCase().includes('ob') &&
         message.body.length < 14 &&
         chats.isGroup &&
         isAuctionStarting
      ) {
         //hapus space di chat
         const messageNoSpace = message.body.toLowerCase().split(' ').join('');
         const obPosition = messageNoSpace.search('ob');
         const codeStr = messageNoSpace.slice(0, obPosition);
         const codeArr = codeStr.split('');

         let confirm = false;
         codeArr.map((item, index) => {
            //cek apakah nilai bid dari kode koi == 0?
            const sql = `SELECT bid FROM rekap WHERE kode_ikan = '${codeArr[index]}'`;
            con.query(sql, function (err, result, fields) {
               if (err) throw err;
               if (result.length > 0) {
                  if (result[0].bid === 0 || result[0].bid === null) {
                     const sql = `UPDATE rekap SET bid = ${ob}, bidder = '${message.rawData.notifyName}', bidder_id = '${message.author}' WHERE kode_ikan = '${codeArr[index]}'`;
                     con.query(sql, function (err, result) {
                        if (err) throw err;
                        if (confirm === false) {
                           message.reply('OB diterima');
                           confirm = true;
                           //kirim rekap
                           setTimeout(() => rekap(groupId), 3000);
                        }
                     });
                  }
               }
            });
         });
      }

      //kb command
      if (
         message.body.toLowerCase().includes('kb') &&
         message.body.length < 14 &&
         chats.isGroup &&
         isAuctionStarting
      ) {
         //hapus space di chat
         const messageNoSpace = message.body.toLowerCase().split(' ').join('');
         const obPosition = messageNoSpace.search('kb');
         const codeStr = messageNoSpace.slice(0, obPosition);
         const codeArr = codeStr.split('');

         let confirm = false;
         codeArr.map((item, index) => {
            const sql = `SELECT * FROM rekap WHERE kode_ikan = '${codeArr[index]}'`;
            con.query(sql, function (err, result, fields) {
               if (err) throw err;
               if (result.length > 0) {
                  if (result[0].bid >= ob) {
                     let bid = result[0].bid;
                     const bidder_id = result[0].bidder_id;
                     const sql = `UPDATE rekap SET bid = ${(bid +=
                        kb)}, bidder = '${
                        message.rawData.notifyName
                     }', bidder_id = '${message.author}' WHERE kode_ikan = '${
                        codeArr[index]
                     }'`;

                     con.query(sql, function (err, result) {
                        if (err) throw err;
                        if (confirm === false) {
                           message.reply('Bid diterima');
                           confirm = true;
                           //send rekap
                           setTimeout(() => rekap(groupId), 3000);
                           if (message.author !== bidder_id) {
                              client.sendMessage(
                                 bidder_id,
                                 `bid ${codeStr.toUpperCase()} dilewati ${
                                    message.rawData.notifyName
                                 }`
                              );
                           }
                        }
                     });
                  }
               }
            });
         });
      }

      //jump bid command
      const messageArr = messageLwcase.split(' ');
      const jumpBid = dt.jumpBidPrice.find((num) => {
         return num === Number(messageArr[1]);
      });

      if (
         jumpBid >= 500 &&
         message.body.length < 14 &&
         chats.isGroup &&
         isAuctionStarting
      ) {
         //hapus space di chat
         const codeStr = messageArr[0];
         const codeArr = codeStr.split('');

         let confirm = false;
         codeArr.map((item, index) => {
            const sql = `SELECT * FROM rekap WHERE kode_ikan = '${codeArr[index]}'`;
            con.query(sql, function (err, result, fields) {
               if (err) throw err;
               if (result.length > 0) {
                  if (result[0].bid >= ob) {
                     const bid = result[0].bid;
                     const bidder_id = result[0].bidder_id;
                     const sql = `UPDATE rekap SET bid = ${jumpBid}, bidder = '${message.rawData.notifyName}', bidder_id = '${message.author}' WHERE kode_ikan = '${codeArr[index]}'`;
                     if (bid < jumpBid) {
                        con.query(sql, function (err, result) {
                           if (err) throw err;
                           if (confirm === false) {
                              message.reply('Bid diterima');
                              confirm = true;
                              //kirim rekap
                              setTimeout(() => rekap(groupId), 3000);
                              if (message.author !== bidder_id) {
                                 client.sendMessage(
                                    bidder_id,
                                    `bid ${codeStr.toUpperCase()} dilewati ${
                                       message.rawData.notifyName
                                    }`
                                 );
                              }
                           }
                        });
                     }
                  }
               }
            });
         });
      }
   });
});

const rekap = async (groupId) => {
   let rekapStr =
      '- Rekap Bid Tertinggi Sementara -\n==========================\n';

   const rekap = await db.getAllRekapData();
   rekap.map((item, index) => {
      const bidder_id = rekap[index].bidder_id;
      const dataRekap = `${rekap[index].kode_ikan.toUpperCase()} = ${
         rekap[index].bid
      } ${rekap[index].bidder}\n`;
      if (bidder_id !== null) {
         rekapStr = rekapStr.concat(dataRekap);
      }
   });
   client.sendMessage(groupId, rekapStr);
};

const auctionWinner = async (groupId) => {
   let rekapStr =
      '- Selamat Pemenang Lelang ke x -\n==========================\n';
   const rekap = await db.getAllRekapData();

   rekap?.map((item, index) => {
      const bidder_id = rekap[index].bidder_id;
      const dataRekap = `Ikan ${rekap[index].kode_ikan.toUpperCase()} ${
         rekap[index].bid
      } ${rekap[index].bidder}\n`;
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
