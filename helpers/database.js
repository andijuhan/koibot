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
   const [rows] = await pool.execute('SELECT * FROM `media` WHERE `info` = ?', [
      info,
   ]);
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

const cleanRekapData = async () => {
   await pool.query('DELETE FROM `rekap`');
};

const resetMedia = async (codes) => {
   const [rows] = await pool.execute('DELETE FROM `media`');

   if (rows.affectedRows > 0) {
      codes.map(async (item, index) => {
         await pool.execute(
            'INSERT INTO media (command, reply, info) VALUES (?, ?, ?)',
            [
               `video ${codes[index].toLocaleLowerCase()}`,
               `${codes[index].toLocaleLowerCase()}.`,
               `video ${codes[index].toLocaleLowerCase()}`,
            ]
         );
      });
   }
};

const fillRekap = async (code) => {
   await pool.execute('INSERT INTO rekap (kode_ikan) VALUES (?)', [code]);
};

const getAllRekapData = async () => {
   const [rows] = await pool.execute('SELECT * FROM `rekap`');
   if (rows.length > 0) {
      return rows;
   } else return false;
};

const checkBid = async (code) => {
   const [rows] = await pool.execute(
      'SELECT * FROM `rekap` WHERE `kode_ikan` = ?',
      [code]
   );
   if (rows.length > 0) {
      return rows;
   } else return false;
};

const setRekap = async (bid, bidder, bidder_id, kode_ikan) => {
   await pool.execute(
      'UPDATE `rekap` SET `bid` = ?, bidder = ?, bidder_id = ? WHERE kode_ikan = ?',
      [bid, bidder, bidder_id, kode_ikan]
   );
};

const allOb = async (bid, bidder, bidder_id) => {
   await pool.execute(
      'UPDATE `rekap` SET `bid` = ?, bidder = ?, bidder_id = ? WHERE `bid` IS NULL',
      [bid, bidder, bidder_id]
   );
};

const checkIsCanAllOb = async () => {
   const [rows] = await pool.execute(
      'SELECT `bid` FROM `rekap` WHERE `bid` IS NULL'
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

const setInfoLelang = async (info_lelang) => {
   await pool.execute('UPDATE `setting` SET `info_lelang` = ?', [info_lelang]);
};

const setStatusLelang = async (lelang_status) => {
   await pool.execute('UPDATE `setting` SET `lelang_status` = ?', [
      lelang_status,
   ]);
};

module.exports = {
   setMedia,
   setMediaPath,
   getMediaInfo,
   getAllMediaInfo,
   cleanRekapData,
   fillRekap,
   getAllRekapData,
   checkBid,
   setRekap,
   resetMedia,
   allOb,
   checkIsCanAllOb,
   getSetting,
   setInfoLelang,
   setStatusLelang,
};
