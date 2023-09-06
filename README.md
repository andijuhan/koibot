# Bot Sistem Lelang Grup Whatsapp

Bot ini digunakan untuk menjalankan sistem lelang di dalam grup whatsapp. Studi kasus sudah berjalan di grup lelang ikan koi **PRATAMA MO' KOI (Auction)** dan **MAHKOTA KOI AUCTION** Kuningan Jawa Barat.

![Screenshoot](https://res.cloudinary.com/djlpcw7uf/image/upload/v1684593956/photo_2023-05-20_21-44-13_ygmodw.jpg)

## Fitur Bot

-  Transaksi lelang OB (Open Bid), KB (Kelipatan Bid), & Jump Bid
-  Notifikasi status bid ke bidder
-  Rekap otomatis
-  Cek video
-  Extra time 10 menit
-  Auto close lelang
-  Notifikasi pemenang lelang

## Fitur Baru

-  Fitur closing lelang sesuai tanggal
-  Fitur tambah item lelang ketika lelang sedang berjalan
-  Nilai OB, KB sinkron ke database

## Cara setup lelang

### Setup info lelang

Kirim pesan ke bot dengan format seperti berikut :

![Screenshoot](https://res.cloudinary.com/djlpcw7uf/image/upload/v1684598331/photo_2023-05-20_22-53-41_1_lyqfbb.jpg)

### Setup jumlah ikan lelang

Selanjutnya ketik perintah

```
lelang mulai 8
```

8 adalah jumlah ikan yang akan di lelang

### Cara upload video ikan lelang

Upload video ikan yg akan di lelang berdasarkan kode ikan.
Contoh saya akan upload video ikan A. Maka cara sebagai berikut :

Pilih video yg akan di upload, gunakan caption

```
video a. Deskripsi video
```

Contoh lihat di gambar dibawah :

![Screenshoot](https://res.cloudinary.com/djlpcw7uf/image/upload/v1684598829/photo_2023-05-20_23-06-16_1_frtxwo.jpg)

Lanjutnya upload video lainnya dengan cara yang sama.

### Kirim semua video ikan lelang ke grup

Untuk mengirim video ke grup lelang, ketikan perintah :

```
kirim video
```

### Cara setup nilai OB dan KB

Untuk setup nilai OB, ketikan perintah :

```
set ob 100
```

Untuk setup nilai KB, ketikan perintah :

```
set kb 50
```

### Cara setup tanggal closing lelang

Misalkan sekarang tanggal 6. Jika ingin menjalankan lelang selama 2 hari, maka lelang akan closing tanggal 8. Ketikan perintah berikut :

```
closing 8
```

### Cara menambah item lelang baru

Misalkan kode ikan saat ini adalah A, B, C, D, E. Jika ingin menambahkan item lelang baru, ketikan perintah berikut :

```
Tambah F
```

### Cara ganti foto cover rekap

Untuk mengganti foto cover rekap, silahkan upload foto dengan format jpeg, dan gunakan caption cover
Contoh :

![Screenshoot](https://res.cloudinary.com/djlpcw7uf/image/upload/v1684599316/photo_2023-05-20_23-14-36_1_md09nr.jpg)

### Memulai sesi lelang

Setelah selesai setup lelang, selanjutnya tinggal memulai sesi lelang. Ketikan perintah

```
lelang dimulai
```

Lelang sudah dimulai.

![Screenshoot](https://res.cloudinary.com/djlpcw7uf/image/upload/v1684599483/photo_2023-05-20_23-17-21_nnmhi0.jpg)

## Change log

Version 1.1.0

-  Fitur closing lelang sesuai tanggal
-  Fitur tambah item lelang ketika lelang sedang berjalan
-  Nilai OB, KB sekarang sinkron ke database
-  Fix bug reset rekap dan reset media

## Contact me

Jika bisnis Anda ingin di automatisasi menggunakan sistem whatsapp bot. Silahkan hubungi [whatsapp link](https://bit.ly/438GhSA)
