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
   const [rows] = await connection.execute('SELECT * FROM `media`');
   if (rows.length > 0) {
      return rows;
   } else return false;
};

const cleanRekapData = async () => {
   const connection = await createConnection();
   await connection.query('DELETE FROM `rekap`');
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

module.exports = {
   setMedia,
   setMediaPath,
   getMediaInfo,
   getAllMediaInfo,
   cleanRekapData,
   fillRekap,
   getAllRekapData,
};
