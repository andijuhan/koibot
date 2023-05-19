/* eslint-disable no-undef */
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
   host: process.env.NODE_ENV === 'development' ? 'localhost' : '127.0.0.1',
   user: process.env.NODE_ENV === 'development' ? 'root' : process.env.DB_USER,
   password: process.env.NODE_ENV === 'production' && process.env.DB_PASS,
   database: process.env.DB_NAME,
   waitForConnections: true,
   connectionLimit: 20,
   maxIdle: 20, // max idle connections, the default value is the same as `connectionLimit`
   idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
   queueLimit: 0,
});

//cek apakah ada command yg sesuai dgn field command di tbl media
const setMedia = async (command) => {
   const [rows] = await pool.execute(
      'SELECT `reply` FROM `media` WHERE `command` = ?',
      [command]
   );
   //jika ada kembalikan isi tbl reply
   if (rows.length > 0) {
      return rows[0].reply;
   } else return false;
};

const setMediaPath = async (path, desc, setMediaReply) => {
   await pool.execute(
      'UPDATE `media` SET `path` = ?, `media_desc` = ? WHERE reply = ?',
      [path, desc, setMediaReply]
   );
};

const getMediaInfo = async (info) => {
   const [rows] = await pool.execute(
      'SELECT * FROM `media` WHERE `command` = ?',
      [info]
   );
   if (rows.length > 0) {
      return rows[0];
   } else return false;
};

const getAllMediaInfo = async () => {
   const [rows] = await pool.execute(
      'SELECT * FROM `media` WHERE `path` IS NOT NULL'
   );
   if (rows.length > 0) {
      return rows;
   } else return false;
};

const cleanDataRecap = async () => {
   await pool.query('DELETE FROM `recap`');
};

const resetMedia = async (codes) => {
   await pool.execute('DELETE FROM `media`');

   codes.map(async (item, index) => {
      await pool.execute('INSERT INTO media (command, reply) VALUES (?, ?)', [
         `video ${codes[index].toLocaleLowerCase()}`,
         `${codes[index].toLocaleLowerCase()}.`,
      ]);
   });
};

const fillRecap = async (code) => {
   await pool.execute('INSERT INTO recap (auction_code) VALUES (?)', [code]);
};

const getAllDataRecap = async () => {
   const [rows] = await pool.execute(
      'SELECT * FROM `recap` ORDER BY `auction_code` ASC'
   );
   if (rows.length > 0) {
      return rows;
   } else return false;
};

const checkBid = async (code) => {
   const [rows] = await pool.execute(
      'SELECT * FROM `recap` WHERE `auction_code` = ?',
      [code]
   );
   if (rows.length > 0) {
      return rows;
   } else return false;
};

const setRecap = async (bid, bidder, bidderId, code) => {
   await pool.execute(
      'UPDATE `recap` SET `bid` = ?, bidder = ?, bidder_id = ? WHERE auction_code = ?',
      [bid, bidder, bidderId, code]
   );
};

const allOb = async (bid, bidder, bidderId) => {
   await pool.execute(
      'UPDATE `recap` SET `bid` = ?, bidder = ?, bidder_id = ? WHERE `bid` IS NULL',
      [bid, bidder, bidderId]
   );
};

const checkIsCanAllOb = async () => {
   const [rows] = await pool.execute(
      'SELECT `bid` FROM `recap` WHERE `bid` IS NULL'
   );
   if (rows.length > 0) {
      return rows;
   } else return false;
};

const getSetting = async () => {
   const [rows] = await pool.execute('SELECT * FROM `setting`');
   if (rows.length > 0) {
      return rows;
   } else return false;
};

const setAuctionInfo = async (AuctionInfo) => {
   await pool.execute('UPDATE `setting` SET `auction_info` = ?', [AuctionInfo]);
};

const setAuctionStatus = async (auctionStatus) => {
   await pool.execute('UPDATE `setting` SET `auction_status` = ?', [
      auctionStatus,
   ]);
};

const setAuctionNumber = async (auctionNumber) => {
   await pool.execute('UPDATE `setting` SET `auction_number` = ?', [
      auctionNumber,
   ]);
};

module.exports = {
   setMedia,
   setMediaPath,
   getMediaInfo,
   getAllMediaInfo,
   cleanDataRecap,
   fillRecap,
   getAllDataRecap,
   checkBid,
   setRecap,
   resetMedia,
   allOb,
   checkIsCanAllOb,
   getSetting,
   setAuctionInfo,
   setAuctionStatus,
   setAuctionNumber,
};
