/* eslint-disable no-undef */

let OB = 100;
let KB = 50;
let INFO = '';
let isAuctionStarting;
let groupId;
let extraTime = false;
let count = 0;
let addExtraTime = false;
let setMedia;
let auctionNumber;

const auctionGroups = ["PRATAMA MO' KOI (Auction)", '*MAHKOTA KOI AUCTION*'];
const bankAccount =
   'BCA a/n Mumu abdul muti 2990769934, BRI a/n Mumu abdul muti 427601020407538';
const adminContact = 'wa.me/6282214871668';

const jumpBidPrice = [
   100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400,
   1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700,
   2800, 2900, 3000, 3100, 3200, 3300, 3400, 3500, 3600, 3700, 3800, 3900, 4000,
   4100, 4200, 4300, 4400, 4500, 4600, 4700, 4800, 4900, 5000, 5100, 5200, 5300,
   5400, 5500, 5600, 5700, 5800, 5900, 6000, 6100, 6200, 6300, 6400, 6500, 6600,
   6700, 6800, 6900, 7000, 7100, 7200, 7300, 7400, 7500, 7600, 7700, 7800, 7900,
   8000, 8100, 8200, 8300, 8400, 8500, 8600, 8700, 8800, 8900, 9000, 9100, 9200,
   9300, 9400, 9500, 9600, 9700, 9800, 9900, 10000,
];

const groupName =
   process.env.NODE_ENV === 'development'
      ? 'Rajabot Testing'
      : auctionGroups[1];

const admins = ['6281324046606@c.us'];

module.exports = {
   jumpBidPrice,
   groupName,
   admins,
   OB,
   KB,
   INFO,
   isAuctionStarting,
   groupId,
   extraTime,
   count,
   addExtraTime,
   setMedia,
   bankAccount,
   adminContact,
   auctionNumber,
};