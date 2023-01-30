const qrcode = require('qrcode');
const cron = require('node-cron');
const http = require('http');
const socketIo = require('socket.io');
const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const mysql = require('mysql');

process.env.TZ = 'Asia/Bangkok';

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.get('/', (req, res) => {
   res.sendFile('index.html', { root: __dirname });
});

const client = new Client({
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

const currentDate = new Date().toLocaleString('id-ID', {
   dateStyle: 'short',
   timeStyle: 'short',
});

const currentDateRaw = new Date();
const hourToday = currentDateRaw.toLocaleString('id-ID', {
   hour: '2-digit',
   minute: '2-digit',
});

//auction setup
let ob = 100;
let kb = 50;
let isAuctionStarting = true;
const groupName = 'Rajabot Testing';

con.connect(function (err) {
   if (err) throw err;
   console.log('Connected to database!');
   console.log(currentDate);
   console.log(hourToday);
   client.on('message', async (message) => {
      const chats = await message.getChat();
      const userChat = await client.getChats();

      if (
         message.body.toLocaleLowerCase().includes('lelang mulai') &&
         chats.isGroup === false
      ) {
         //get group id
         const groupObj = userChat
            .filter((chat) => chat.isGroup && chat.name === groupName)
            .map((chat) => {
               return {
                  id: chat.id,
                  name: chat.name,
               };
            });
         const groupId = groupObj[0].id.user + '@g.us';
         console.log(groupId);

         isAuctionStarting = true;
         console.log('auction starts');

         //cron for auction time ends
         cron.schedule('36 0 * * *', function () {
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
         cron.schedule('50 21 * * *', function () {
            client.sendMessage(groupId, 'Lelang akan berakhir dalam 10 menit');
         });
         cron.schedule('55 20 * * *', function () {
            client.sendMessage(groupId, 'Lelang akan berakhir dalam 5 menit');
         });
      }

      //cek apakah chat berisi OB?
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

      //cek apakah chat berisi KB?
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
            });
         });
      }
      //jump bid
      const jumpBidPrice = [
         500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600,
         1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700, 2800,
         2900, 3000, 3100, 3200, 3300, 3400, 3500, 3600, 3700, 3800, 3900, 4000,
         4100, 4200, 4300, 4400, 4500, 4600, 4700, 4800, 4900, 5000, 5100, 5200,
         5300, 5400, 5500, 5600, 5700, 5800, 5900, 6000, 6100, 6200, 6300, 6400,
         6500, 6600, 6700, 6800, 6900, 7000, 7100, 7200, 7300, 7400, 7500, 7600,
         7700, 7800, 7900, 8000, 8100, 8200, 8300, 8400, 8500, 8600, 8700, 8800,
         8900, 9000, 9100, 9200, 9300, 9400, 9500, 9600, 9700, 9800, 9900,
         10000,
      ];
      const messageArr = message.body.toLowerCase().split(' ');
      const jumpBid = jumpBidPrice.find((num) => {
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
