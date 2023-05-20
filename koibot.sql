-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 19, 2023 at 06:05 AM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

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
  `media_desc` varchar(5000) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `media`
--

INSERT INTO `media` (`id`, `command`, `reply`, `path`, `media_desc`) VALUES
(791, 'video a', 'a.', './upload/a.mp4', '*video a*'),
(792, 'video b', 'b.', './upload/b.mp4', '*video b*'),
(793, 'video c', 'c.', NULL, NULL),
(794, 'video d', 'd.', NULL, NULL),
(795, 'video e', 'e.', NULL, NULL),
(796, 'video f', 'f.', NULL, NULL),
(797, 'video g', 'g.', NULL, NULL),
(798, 'video h', 'h.', NULL, NULL),
(799, 'video i', 'i.', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `recap`
--

CREATE TABLE `recap` (
  `id` int(11) NOT NULL,
  `auction_code` varchar(1) NOT NULL,
  `bid` int(11) DEFAULT NULL,
  `bidder` varchar(30) DEFAULT NULL,
  `bidder_id` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `recap`
--

INSERT INTO `recap` (`id`, `auction_code`, `bid`, `bidder`, `bidder_id`) VALUES
(36, 'A', 150, 'Andi', '6281324046606@c.us'),
(37, 'C', 150, 'Andi', '6281324046606@c.us'),
(38, 'E', 150, 'Andi', '6281324046606@c.us'),
(39, 'B', 200, 'Andi', '6281324046606@c.us'),
(40, 'H', 150, 'Andi', '6281324046606@c.us'),
(41, 'F', NULL, NULL, NULL),
(42, 'D', 150, 'Andi', '6281324046606@c.us'),
(43, 'G', 150, 'Andi', '6281324046606@c.us'),
(44, 'I', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `setting`
--

CREATE TABLE `setting` (
  `id` int(11) NOT NULL,
  `auction_info` varchar(10000) NOT NULL,
  `auction_status` tinyint(1) NOT NULL,
  `auction_number` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `setting`
--

INSERT INTO `setting` (`id`, `auction_info`, `auction_status`, `auction_number`) VALUES
(1, 'MAHKOTA KOI AUCTION #LELANG 109\n\n▫BACA DENGAN TELITI SAMPAI TUNTAS  SEBELUM MELAKUKAN BID..!!!\n\n\n➡Lelang dimulai saat admin posting ikan\n➡Selesai     :  22.00 wib\n(Perpanjangan 10 menit berlaku kelipatan dari bid trakhir dan seterusnya)\n\nIKAN A\n➡ Jenis        : SHOWA\n➡ Kelamin   :  unchek\n➡ Ukuran     : 29cm\n➡ Breeder    : lokal\n➡ Status       : KUNINGAN\n▶ ket             : \n*OB 100.000 KB 100\n\n\n\n\n\n\nIKAN B\n➡ Jenis        : goromo showa\n➡ Kelamin   : UNCHEK\n➡ Ukuran     : 30CM\n➡ Breeder    : lokal\n➡ Status       : KUNINGAN\n▶ket              : \nOB 100.000 KB 100k\n \n\n\n\n\n▫CEK FOTO & VIDEO  dengan teliti (Tidak menerima komplain apapun setelah lelang selesai)\n▫JIKA RAGU.. Bisa tanyakan admin terlebih dahulu\n\n▫Pembayaran maximal 2x24 jam\n▫Tidak di perbolehkan Bid & Run..!!!\n▫Penitipan ikan max 7hari dari close lelang bilamana ada kepanjangan wktu makan akan dikenakan biaya tambahan\n\n\nHAHPPY BIDDING 🔥🔥', 1, 109);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `media`
--
ALTER TABLE `media`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `recap`
--
ALTER TABLE `recap`
  ADD PRIMARY KEY (`id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=800;

--
-- AUTO_INCREMENT for table `recap`
--
ALTER TABLE `recap`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `setting`
--
ALTER TABLE `setting`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
