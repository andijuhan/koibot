//tentukan kode ikan
const kodeKoiRaw = 'abcde';
//pecah menjadi array
const kodeKoi = chat.split('');

//set ob, & kb
const ob = 25;
const kb = 50;
let bidder = 'andi';
let bidderId = '081xx';

//buat rekap lelang sesuai kode ikan
const rekap = kodeKoi.map((item, index) => ({
   kode: kodeKoi[index],
   bid: '',
   bidder: '',
   bidderId: '',
   ob: false,
}));

const lelangBaru = (kodeKoi, ob, kb, time) => {
   /**
    *fungsi untuk setup data lelang baru
    *setup data lelang.json
    *buat rekap lelang sesuai kode iklan
    *simpan data rekap ke rekap.json
    */
};

const lelangSelesai = () => {
   /**
    *fungsi untuk menyelesaikan lelang
    *data lelang.json akan di reset
    */
};

const openBid = (kode, bidder) => {
   //fetch data & update database
   rekap.map((item, index) => {
      if (item.kode === kode && item.ob === false) {
         item.bid = ob;
         item.bidder = bidder;
         item.ob = true;
      }
   });
};

const kelBid = (kode, bidder) => {
   //fetch data & update database
   rekap.map((item, index) => {
      if (item.kode === kode && item.ob === true) {
         item.bid += kb;
         item.bidder = bidder;
      }
   });
};

openBid('d', 'fauzan');
openBid('b', 'andi');
kelBid('b', 'andi');

/* rekap.map((item, index) => {
   console.log('kode ', item.kode, 'bid ', item.bid, 'bidder ', item.bidder);
}); */

//kode_koi : abcd
//kode_lelang : ob, kb

//format = kodekoi kode_lelang

//const chat = 'abcob';
//cek apakah string chat berisi maksimal x karakter
//jika ya, hapus spasi dari string
//cek string apakah di dalamnya ada kode_lelang?
//jika ada, hilangkan kode_lelang dari string
//pecah string menjadi array
//cek apakah elemen array === kode_koi
//jika ya, panggil fungsi sesuai kode_lelang
