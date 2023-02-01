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

module.exports = {
   setMedia,
   setMediaPath,
};
