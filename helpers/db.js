const msql = require('mysql2/promise');

const createConnection = async () => {
   return await msql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'koibot',
   });
};

//cek apakah ada command yg sesuai dgn field command di tbl media
const setMedia = async (command) => {
   const connection = await createConnection();
   const [rows] = await connection.execute(
      'SELECT `reply` FROM `media` WHERE `command` = ?',
      [command]
   );
   //jika ada kembalikan isi tbl reply
   if (rows.length > 0) {
      return rows[0].reply;
   } else return false;
};

const setMediaPath = async (path, desc, setMediaReply) => {
   const connection = await createConnection();
   await connection.execute(
      'UPDATE `media` SET `path` = ?, `media_desc` = ? WHERE reply = ?',
      [path, desc, setMediaReply]
   );
};

const getMediaInfo = async (info) => {
   const connection = await createConnection();
   const [rows] = await connection.execute(
      'SELECT * FROM `media` WHERE `info` = ?',
      [info]
   );
   if (rows.length > 0) {
      return rows[0];
   } else return false;
};

const getAllMediaInfo = async () => {
   const connection = await createConnection();
   const [rows] = await connection.execute(
      'SELECT * FROM `media` WHERE `path` IS NOT NULL'
   );
   if (rows.length > 0) {
      return rows;
   } else return false;
};

const cleanRekapData = async () => {
   const connection = await createConnection();
   await connection.query('DELETE FROM `rekap`');
};

const resetMedia = async (codes) => {
   const connection = await createConnection();
   await connection.query('DELETE FROM `media`');
   setTimeout(() => {
      codes.map(async (item, index) => {
         await connection.execute(
            'INSERT INTO media (command, reply, info) VALUES (?, ?, ?)',
            [
               `kode ${codes[index].toLocaleLowerCase()}`,
               `${codes[index].toLocaleLowerCase()}.`,
               `info ${codes[index].toLocaleLowerCase()}`,
            ]
         );
      });
   }, 3000);
};

const fillRekap = async (code) => {
   const connection = await createConnection();
   await connection.execute('INSERT INTO rekap (kode_ikan) VALUES (?)', [code]);
};

const getAllRekapData = async () => {
   const connection = await createConnection();
   const [rows] = await connection.execute('SELECT * FROM `rekap`');
   if (rows.length > 0) {
      return rows;
   } else return false;
};

const checkBid = async (code) => {
   const connection = await createConnection();
   const [rows] = await connection.execute(
      'SELECT * FROM `rekap` WHERE `kode_ikan` = ?',
      [code]
   );
   if (rows.length > 0) {
      return rows;
   } else return false;
};

const setRekap = async (bid, bidder, bidder_id, kode_ikan) => {
   const connection = await createConnection();
   await connection.execute(
      'UPDATE `rekap` SET `bid` = ?, bidder = ?, bidder_id = ? WHERE kode_ikan = ?',
      [bid, bidder, bidder_id, kode_ikan]
   );
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
};
