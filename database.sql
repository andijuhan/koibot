-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 24, 2023 at 06:24 AM
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
  `path` varchar(30) DEFAULT NULL,
  `media_desc` varchar(5000) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `media`
--

INSERT INTO `media` (`id`, `command`, `reply`, `path`, `media_desc`) VALUES
(800, 'video b', 'b.', './upload/videos/b.mp4', '*video b*'),
(801, 'video a', 'a.', './upload/videos/a.mp4', '*video a*'),
(802, 'video c', 'c.', NULL, NULL),
(803, 'video d', 'd.', NULL, NULL),
(804, 'video e', 'e.', NULL, NULL),
(805, 'video h', 'h.', NULL, NULL),
(806, 'video f', 'f.', NULL, NULL),
(807, 'video g', 'g.', NULL, NULL),
(808, 'video i', 'i.', NULL, NULL),
(809, 'video j', 'j.', NULL, NULL);

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
(45, 'B', 150, 'Andi', '6281324046606@c.us'),
(46, 'A', 150, 'Andi', '6281324046606@c.us'),
(47, 'E', NULL, NULL, NULL),
(48, 'C', 150, 'Andi', '6281324046606@c.us'),
(49, 'D', 150, 'Andi', '6281324046606@c.us'),
(50, 'F', NULL, NULL, NULL),
(51, 'G', 600, 'Andi', '6281324046606@c.us'),
(52, 'J', NULL, NULL, NULL),
(53, 'I', NULL, NULL, NULL),
(54, 'H', 150, 'Andi', '6281324046606@c.us');

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
(1, 'MAHKOTA KOI AUCTION #LELANG ke 01\n\n▫BACA DENGAN TELITI SAMPAI TUNTAS  SEBELUM MELAKUKAN BID..!!!\n\n\n➡Lelang dimulai saat admin posting ikan\n➡Selesai     :  22.00 wib\n(Perpanjangan 10 menit berlaku kelipatan dari bid trakhir dan seterusnya)\n\nIKAN A\n➡ Jenis        : SHOWA\n➡ Kelamin   :  unchek\n➡ Ukuran     : 29cm\n➡ Breeder    : lokal\n➡ Status       : KUNINGAN\n▶ ket             : \n*OB 100.000 KB 100\n\n\n\n\n\n\nIKAN B\n➡ Jenis        : goromo showa\n➡ Kelamin   : UNCHEK\n➡ Ukuran     : 30CM\n➡ Breeder    : lokal\n➡ Status       : KUNINGAN\n▶ket              : \nOB 100.000 KB 100k\n \n\n\n\n\n▫CEK FOTO & VIDEO  dengan teliti (Tidak menerima komplain apapun setelah lelang selesai)\n▫JIKA RAGU.. Bisa tanyakan admin terlebih dahulu\n\n▫Pembayaran maximal 2x24 jam\n▫Tidak di perbolehkan Bid & Run..!!!\n▫Penitipan ikan max 7hari dari close lelang bilamana ada kepanjangan wktu makan akan dikenakan biaya tambahan\n\n\nHAHPPY BIDDING 🔥🔥', 0, 1);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=810;

--
-- AUTO_INCREMENT for table `recap`
--
ALTER TABLE `recap`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT for table `setting`
--
ALTER TABLE `setting`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
