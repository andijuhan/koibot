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
      const chats = await message.getChat();
      const userChat = await client.getChats();

      //get group id
      const groupId = wa.getGroupId(userChat, groupName);

      //setup media
      if (setMedia !== false && message.hasMedia && chats.isGroup === false) {
         const attachmentData = await message.downloadMedia();
         //dapatkan ekstensi media
         const ext = attachmentData.mimetype.split('/');
         //simpan info media ke database
         const path = './upload/' + setMedia + ext[1];
         const desc = message.body;
         console.log(ext + path);
         db.setMediaPath(path, desc, setMedia);
         //simpan ke server
         fs.writeFileSync(path, attachmentData.data, 'base64', function (err) {
            if (err) {
               console.log(err);
            }
         });

         client.sendMessage(groupId, attachmentData, {
            caption: message.body,
         });
      }

      //info kode ikan
      if (
         message.body.toLocaleLowerCase().includes('info a') &&
         chats.isGroup &&
         aMediaPath.length > 0
      ) {
         const media = MessageMedia.fromFilePath(aMediaPath);

         client.sendMessage(message.from, 'Downloading media...');
         setTimeout(() => {
            client.sendMessage(message.from, media, {
               caption: aMediaDesc,
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
         info.length > 20
      ) {
         //kode ikan
         const rawMsg = message.body.toString().split(' ');
         const numOfFish = Number(rawMsg[2]);
         const fishCodes = wa.generateFishCode(Number(numOfFish));

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
            //bersihkan tabel dulu
            con.query('DELETE FROM rekap', function (err, result) {
               if (err) throw err;
               console.log('tabel rekap sudah dibersihkan');
               //insert kode ikan
               let sendToGroup = false;
               fishCodes.map((item, index) => {
                  const sql = `INSERT INTO rekap (kode_ikan) VALUES ('${fishCodes[index]}')`;
                  con.query(sql, function (err, result) {
                     if (err) throw err;
                     console.log('sukses');
                     if (sendToGroup === false) {
                        //confirm
                        client.sendMessage(
                           message.from,
                           'Lelang sedang dimulai. Info lelang hari ini sudah dikirim ke group.'
                        );
                        //send message to group
                        client.sendMessage(groupId, info);
                        sendToGroup = true;
                     }
                  });
               });
            });
         }

         isAuctionStarting = true;
         console.log('auction starts');

         //cron for auction time ends
         cron.schedule('0 21 * * *', function () {
            info = '';
            console.log('Auction ends');
            isAuctionStarting = false;
            //send notification to group
            client.sendMessage(groupId, 'Lelang berakhir');
            auctionWinner(groupId);
            //send notification to the auction winner
            const sql = 'SELECT * FROM rekap';
            con.query(sql, function (err, result) {
               if (err) throw err;
               result.map((item, index) => {
                  const bidder_id = result[index].bidder_id;
                  const kode_ikan = result[index].kode_ikan;
                  const bid = result[index].bid;
                  client.sendMessage(
                     bidder_id,
                     `selamat anda pemenang lelang ikan ${kode_ikan} dengan bid ${bid}`
                  );
               });
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
                           setTimeout(() => rekap(), 3000);
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
                           setTimeout(() => rekap(), 3000);
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
                              setTimeout(() => rekap(), 3000);
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
      //for to display summary data
      const rekap = () => {
         let rekapStr =
            '- Rekap Bid Tertinggi Sementara -\n==========================\n';
         const sql = 'SELECT * FROM rekap';
         con.query(sql, function (err, result) {
            if (err) throw err;
            result.map((item, index) => {
               const dataRekap = `${result[index].kode_ikan.toUpperCase()} = ${
                  result[index].bid
               } ${result[index].bidder}\n`;
               rekapStr = rekapStr.concat(dataRekap);
            });
            client.sendMessage(message.from, rekapStr);
         });
      };
      //to display auction Winner data
      const auctionWinner = (groupId) => {
         let rekapStr =
            '- Selamat Pemenang Lelang ke x -\n==========================\n';
         const sql = 'SELECT * FROM rekap';
         con.query(sql, function (err, result) {
            if (err) throw err;
            result.map((item, index) => {
               const dataRekap = `Ikan ${result[
                  index
               ].kode_ikan.toUpperCase()} ${result[index].bid} ${
                  result[index].bidder
               }\n`;
               rekapStr = rekapStr.concat(dataRekap);
            });
            client.sendMessage(groupId, rekapStr);
         });
      };
   });
});

client.initialize();

server.listen(8000, () => {
   console.log('App running on *:', 8000);
});
