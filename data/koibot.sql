-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 12, 2023 at 04:11 AM
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
(387, 'kode a', 'a.', NULL, NULL, 'info a'),
(388, 'kode b', 'b.', NULL, NULL, 'info b'),
(389, 'kode c', 'c.', NULL, NULL, 'info c'),
(390, 'kode d', 'd.', NULL, NULL, 'info d'),
(391, 'kode e', 'e.', NULL, NULL, 'info e');

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
('A', NULL, NULL, NULL),
('B', NULL, NULL, NULL),
('C', NULL, NULL, NULL),
('D', NULL, NULL, NULL),
('E', NULL, NULL, NULL);

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
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `media`
--
ALTER TABLE `media`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=392;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
