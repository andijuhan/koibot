-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 18, 2023 at 02:23 PM
-- Server version: 10.4.27-MariaDB
-- PHP Version: 8.1.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `koibot`
--

-- --------------------------------------------------------

--
-- Table structure for table `media`
--

CREATE TABLE `media` (
  `id` int(11) NOT NULL,
  `command` varchar(20) DEFAULT NULL,
  `reply` varchar(20) DEFAULT NULL,
  `path` varchar(20) DEFAULT NULL,
  `media_desc` varchar(200) DEFAULT NULL,
  `info` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `media`
--

INSERT INTO `media` (`id`, `command`, `reply`, `path`, `media_desc`, `info`) VALUES
(458, 'kode a', 'a.', NULL, NULL, 'info a'),
(459, 'kode b', 'b.', NULL, NULL, 'info b'),
(460, 'kode c', 'c.', NULL, NULL, 'info c'),
(461, 'kode d', 'd.', NULL, NULL, 'info d'),
(462, 'kode e', 'e.', NULL, NULL, 'info e'),
(463, 'kode f', 'f.', NULL, NULL, 'info f'),
(464, 'kode g', 'g.', NULL, NULL, 'info g'),
(465, 'kode h', 'h.', NULL, NULL, 'info h'),
(466, 'kode i', 'i.', NULL, NULL, 'info i'),
(467, 'kode j', 'j.', NULL, NULL, 'info j');

-- --------------------------------------------------------

--
-- Table structure for table `rekap`
--

CREATE TABLE `rekap` (
  `kode_ikan` varchar(1) NOT NULL,
  `bid` int(11) DEFAULT NULL,
  `bidder` varchar(30) DEFAULT NULL,
  `bidder_id` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rekap`
--

INSERT INTO `rekap` (`kode_ikan`, `bid`, `bidder`, `bidder_id`) VALUES
('A', 200, 'Andi', '6281324046606@c.us'),
('B', NULL, NULL, NULL),
('C', NULL, NULL, NULL),
('D', NULL, NULL, NULL),
('E', NULL, NULL, NULL),
('F', NULL, NULL, NULL),
('G', NULL, NULL, NULL),
('H', NULL, NULL, NULL),
('I', NULL, NULL, NULL),
('J', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `setting`
--

CREATE TABLE `setting` (
  `id` int(11) NOT NULL,
  `info_lelang` varchar(10000) NOT NULL,
  `lelang_status` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `setting`
--

INSERT INTO `setting` (`id`, `info_lelang`, `lelang_status`) VALUES
(1, 'MAHKOTA KOI AUCTION #LELANG ke 1400\n\n▫BACA DENGAN TELITI SAMPAI TUNTAS  SEBELUM MELAKUKAN BID..!!!\n\n\n➡Lelang dimulai saat admin posting ikan\n➡Selesai     :  21.00 wib\n(Perpanjangan 10 menit berlaku kelipatan dari bid trakhir dan seterusnya)\n\nIKAN A\n➡ Jenis        : SHOWA\n➡ Kelamin   :  unchek\n➡ Ukuran     : 17cm\n➡ Breeder    : lokal\n➡ Status       : KUNINGAN\n▶ ket             : \n*OB 100.000 KB 100\n\n\n\n\n\n\nIKAN B\n➡ Jenis        : SHIRO\n➡ Kelamin   : UNCHEK\n➡ Ukuran     : 20CM\n➡ Breeder    : lokal\n➡ Status       : KUNINGAN\n▶ket              : \nOB 100.000 KB 100k\n \n\n\n\n\n▫CEK FOTO & VIDEO  dengan teliti (Tidak menerima komplain apapun setelah lelang selesai)\n▫JIKA RAGU.. Bisa tanyakan admin terlebih dahulu\n\n▫Pembayaran maximal 2x24 jam\n▫Tidak di perbolehkan Bid & Run..!!!\n▫Penitipan ikan max 7hari dari close lelang bilamana ada kepanjangan wktu makan akan dikenakan biaya tambahan\n\n\nHAHPPY BIDDING 🔥🔥', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `media`
--
ALTER TABLE `media`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `rekap`
--
ALTER TABLE `rekap`
  ADD PRIMARY KEY (`kode_ikan`);

--
-- Indexes for table `setting`
--
ALTER TABLE `setting`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `media`
--
ALTER TABLE `media`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=468;

--
-- AUTO_INCREMENT for table `setting`
--
ALTER TABLE `setting`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
