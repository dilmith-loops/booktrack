-- MySQL dump 10.13  Distrib 9.4.0, for macos15.4 (arm64)
--
-- Host: localhost    Database: booktrack_db
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  KEY `failed_jobs_connection_queue_failed_at_index` (`connection`,`queue`,`failed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` smallint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spot_ratings`
--

DROP TABLE IF EXISTS `spot_ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spot_ratings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `spot_id` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `score` tinyint unsigned NOT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `spot_ratings_spot_id_foreign` (`spot_id`),
  CONSTRAINT `spot_ratings_spot_id_foreign` FOREIGN KEY (`spot_id`) REFERENCES `spots` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spots`
--

DROP TABLE IF EXISTS `spots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spots` (
  `id` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `post_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'spot',
  `book_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `author` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stall_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stall_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `hall` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `stall_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `images` json DEFAULT NULL,
  `finder_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `finder_handle` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` bigint NOT NULL,
  `price_or_offer` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shelf_location_note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'In Stock',
  `helpful_count` int NOT NULL DEFAULT '0',
  `rating_average` decimal(3,1) NOT NULL DEFAULT '5.0',
  `rating_count` int NOT NULL DEFAULT '1',
  `ai_verified` tinyint(1) NOT NULL DEFAULT '1',
  `is_pinned` tinyint(1) NOT NULL DEFAULT '0',
  `is_archived` tinyint(1) NOT NULL DEFAULT '0',
  `archived_at` timestamp NULL DEFAULT NULL,
  `archived_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sampath_card_discount` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reply_to_request_id` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tagged_requester_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tagged_requester_handle` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_resolved` tinyint(1) NOT NULL DEFAULT '0',
  `resolved_by_spot_id` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `spots_post_type_index` (`post_type`),
  KEY `spots_timestamp_index` (`timestamp`),
  KEY `spots_stall_id_index` (`stall_id`),
  KEY `spots_is_archived_index` (`is_archived`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stalls`
--

DROP TABLE IF EXISTS `stalls`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stalls` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `hall` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `stall_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `special_discount` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_hidden` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `handle` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_sampath_cardholder` tinyint(1) NOT NULL DEFAULT '0',
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_disabled` tinyint(1) NOT NULL DEFAULT '0',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `otp_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `otp_expires_at` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_handle_unique` (`handle`),
  KEY `users_phone_index` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-24 23:56:29
-- MySQL dump 10.13  Distrib 9.4.0, for macos15.4 (arm64)
--
-- Host: localhost    Database: booktrack_db
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `stalls`
--

LOCK TABLES `stalls` WRITE;
/*!40000 ALTER TABLE `stalls` DISABLE KEYS */;
INSERT INTO `stalls` VALUES ('stall-agahas-publishers-sirimavo-hall-h','Agahas Publishers','Sirimavo Hall H','H12',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-agasara-publications-sirimavo-hall-h','Agasara Publications','Sirimavo Hall H','H100 - H101, H120 - H121',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-ahas-publishers-sirimavo-hall-k','Ahas Publishers','Sirimavo Hall K','K12',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-ahasa-books-sirimavo-hall-h','Ahasa Books','Sirimavo Hall H','H35 - H36',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-akarsha-hall-c','Akarsha','Hall C','C9 - C12',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-akura-book-publishers-hall-c','Akura Book Publishers','Hall C','C18 - C19',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-akura-book-publishers-sirimavo-hall-j','Akura Book Publishers','Sirimavo Hall J','J58',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-akura-sirimavo-hall-j','Akura','Sirimavo Hall J','J59 - J63',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-ananda-publishers-sirimavo-hall-h','Ananda Publishers','Sirimavo Hall H','H98 - H99',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-aratuwa-sirimavo-hall-h','Aratuwa','Sirimavo Hall H','H45 - H48, H73 - H76',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-ariya-publishers-sirimavo-hall-j','Ariya Publishers','Sirimavo Hall J','J54, J54 - A',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-ashirwadha-hall-a','Ashirwadha','Hall A','A33',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-ashirwadha-hall-d','Ashirwadha','Hall D','D14 - D18',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-ashirwadha-sirimavo-hall-j','Ashirwadha','Sirimavo Hall J','J42',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-atlas-hall-pvt-ltd-hall-d','Atlas Hall PVT LTD','Hall D','D03',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-biographic-educational-publications-hall-c','Biographic Educational Publications','Hall C','C20',NULL,'Academic, Educational & Reference',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-bmich-musium-hall-c','Bmich Musium','Hall C','C30',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-bookrack-pvt-ltd-sirimavo-hall-h','Bookrack PVT LTD','Sirimavo Hall H','H93 - H96',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-british-council-hall-a','British Council','Hall A','A43 - A44',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-buddhi-publishers-sirimavo-hall-k','Buddhi Publishers','Sirimavo Hall K','K22',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-buddhist-cultural-centre-pavilion-s','Buddhist Cultural Centre','Pavilion S','S',NULL,'Philosophy, Buddhism, Meditation',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-cenral-bank-of-sri-lanka-hall-b','Cenral Bank Of Sri Lanka','Hall B','B9-A1',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-cga-books-hall-a','CGA Books','Hall A','A18 - A19',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-chemamadu-publication-sirimavo-hall-h','Chemamadu Publication','Sirimavo Hall H','H56 - H57',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-colombo-young-men-s-buddhist-association-hall-c','Colombo Young Men\'s Buddhist Association','Hall C','C28',NULL,'Philosophy, Buddhism, Meditation',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-colorcraft-sirimavo-hall-h','Colorcraft','Sirimavo Hall H','H19 - H20, H33 - H34',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-crafts-insternational-sirimavo-hall-h','Crafts Insternational','Sirimavo Hall H','H113',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-darshana-publishers-sirimavo-hall-j','Darshana Publishers','Sirimavo Hall J','J28 - J29',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-dedunna-books-sirimavo-hall-h','Dedunna Books','Sirimavo Hall H','H91',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-deen-the-bookman-sirimavo-hall-h','Deen The Bookman','Sirimavo Hall H','H38 - H39',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-denuma-publishers-sirimavo-hall-h','Denuma Publishers','Sirimavo Hall H','H11',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-department-of-official-languages-sirimavo-hall-k','Department Of Official Languages','Sirimavo Hall K','K33',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-deshappriya-publication-sirimavo-hall-h','Deshappriya Publication','Sirimavo Hall H','H87',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-digital-arena-sirimavo-hall-h','Digital Arena','Sirimavo Hall H','H14',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-dinisa-publication-sirimavo-hall-h','Dinisa Publication','Sirimavo Hall H','H109',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-diyaluma-publishers-sirimavo-hall-k','Diyaluma Publishers','Sirimavo Hall K','K19',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-doms-speed-link-sirimavo-hall-h','Doms - Speed - Link','Sirimavo Hall H','H102 - H103, H118 - H119',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-epa-book-shop-hall-d','Epa Book Shop','Hall D','D09',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-expographic-bookstore-hall-a','Expographic Bookstore','Hall A','A22',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-fast-surasa-hall-b','Fast - Surasa','Hall B','B123 - B126',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-gihan-book-shop-w-o-t-fernando-hall-b','Gihan Book Shop (W.O.T. Fernando)','Hall B','B127 - B130',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-godage-publusher-pavilion-l','Godage Publusher','Pavilion L','L',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-godage-sirimavo-hall-j','Godage','Sirimavo Hall J','J43',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-good-reads-hall-a','Good Reads','Hall A','A27',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-grantha-private-limited-sirimavo-hall-k','Grantha Private Limited','Sirimavo Hall K','K8 - K9',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-graphicare-hall-b','Graphicare','Hall B','B95',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-heladiva-publishers-hall-b','Heladiva Publishers','Hall B','B105 - B106',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-ibmc-sirimavo-hall-h','Ibmc','Sirimavo Hall H','H49 - H53, H68 - H72',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-imashi-publishers-sirimavo-hall-j','Imashi Publishers','Sirimavo Hall J','J49 - J51, J70 - J72',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-imashi-sirimavo-hall-h','Imashi','Sirimavo Hall H','H21 - H23, H30 - H32',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-international-book-house-hall-a','International Book House','Hall A','A20',NULL,'International Books & Translations',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-islamic-book-house-ibh-hall-a','Islamic Book House - Ibh','Hall A','A79 - A80',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-jeewana-publishers-hall-d','Jeewana Publishers','Hall D','D04',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-jeya-book-centre-pvt-ltd-hall-a','JEYA Book Centre PVT LTD','Hall A','A49 - A61',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-jeya-book-sirimavo-hall-k','JEYA Book','Sirimavo Hall K','K02',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-kadulla-publications-hall-d','Kadulla Publications','Hall D','D25',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-kavivara-publishers-sirimavo-hall-k','Kavivara Publishers','Sirimavo Hall K','K3 - K4',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-kbooks-pvt-ltd-hall-b','Kbooks PVT LTD','Hall B','B108 - B109',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-keheli-prakashakayo-sirimavo-hall-k','Keheli Prakashakayo','Sirimavo Hall K','K5 - K7',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-knowledge-bank-hall-b','Knowledge Bank','Hall B','B113 - B120',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-kumara-s-pathiarana-publishers-sirimavo-hall-h','Kumara S Pathiarana Publishers','Sirimavo Hall H','H61 - H62',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-kumaran-book-house-hall-a','Kumaran Book House','Hall A','A45',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-kurulu-poth-publishers-hall-b','Kurulu Poth Publishers','Hall B','B89 - B90',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-lake-house-printers-publishers-sirimavo-hall-h','Lake House Printers & Publishers','Sirimavo Hall H','H111',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-luminex-book-shop-pvt-ltd-sirimavo-hall-h','Luminex Book Shop PVT LTD','Sirimavo Hall H','H41',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-m-d-gunasena-hall-c','M D Gunasena','Hall C','C1 - C3',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-m-d-gunasena-sirimavo-hall-h','M D Gunasena','Sirimavo Hall H','H24 - H29',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-makeen-books-hall-a','Makeen Books','Hall A','A62 - A72',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-makkmilan-book-depot-sirimavo-hall-h','Makkmilan Book Depot','Sirimavo Hall H','H17 - H18',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-malpiyali-publishers-private-limited-sirimavo-hall-j','Malpiyali Publishers Private Limited','Sirimavo Hall J','J67, J67-A',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-maped-sirimavo-hall-h','Maped','Sirimavo Hall H','H43 - H44',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-martin-wickremasinghe-books-hall-b','Martin Wickremasinghe Books','Hall B','B140',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-masitha-book-publishers-pvt-ltd-sirimavo-hall-j','Masitha Book Publishers PVT LTD','Sirimavo Hall J','J1 - J4',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-master-guide-pavilion-q','Master Guide','Pavilion Q','Q',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-mihira-book-publishers-sirimavo-hall-j','Mihira Book Publishers','Sirimavo Hall J','J9 - J10',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-minsara-publishers-sirimavo-hall-h','Minsara Publishers','Sirimavo Hall H','H3 - H6',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-multi-book-shop-sirimavo-hall-j','Multi Book Shop','Sirimavo Hall J','J68 - J69',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-muses-books-pavilion-p','Muses Books','Pavilion P','P',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-national-institute-of-education-sirimavo-hall-k','National Institute Of Education','Sirimavo Hall K','K36',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-national-library-and-documentation-services-board-sirimavo-hall-h','National Library And Documentation Services Board','Sirimavo Hall H','H10',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-neptune-publications-hall-a','Neptune Publications','Hall A','A23 - A26, A28 - A32',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-nicholi-book-shop-sirimavo-hall-k','Nicholi Book Shop','Sirimavo Hall K','K31 - K32',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-nine-publishing-hall-b','Nine Publishing','Hall B','B107',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-office-works-sirimavo-hall-h','Office Works','Sirimavo Hall H','H104 - H105, H116 - H117',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-oneero-book-shop-sirimavo-hall-h','Oneero Book Shop','Sirimavo Hall H','H90',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-packsco-pavilion-t','Packsco','Pavilion T','T',NULL,'Stationery, Art & Student Supplies',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-panther-hall-b','Panther','Hall B','B91',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-paper-corner-hall-a','Paper Corner','Hall A','A13 - A15',NULL,'Stationery, Art & Student Supplies',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-perera-hussein-publishing-house-hall-a','Perera-hussein Publishing House','Hall A','A38',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-peters-book-shop-sirimavo-hall-h','Peters Book Shop','Sirimavo Hall H','H84',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-pilot-pens-sirimavo-hall-k','Pilot Pens','Sirimavo Hall K','K13',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-pk-publishers-sirimavo-hall-h','Pk Publishers','Sirimavo Hall H','H114',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-poobalasingham-book-depot-hall-a','Poobalasingham Book Depot','Hall A','A16, A41 - A42',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-prabha-publishers-hall-d','Prabha Publishers','Hall D','D06',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-prathibha-publishers-sirimavo-hall-j','Prathibha Publishers','Sirimavo Hall J','J16, J17, J17-A',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-premasiri-book-shop-sirimavo-hall-h','Premasiri Book Shop','Sirimavo Hall H','H63',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-priyankara-bookshop-sirimavo-hall-h','Priyankara Bookshop','Sirimavo Hall H','H13',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-progressive-publishing-house-pvt-ltd-hall-d','Progressive Publishing House PVT LTD','Hall D','D27',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-ranmuthu-publishers-hall-c','Ranmuthu Publishers','Hall C','C27',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-rasakatha-publishers-sirimavo-hall-h','Rasakatha Publishers','Sirimavo Hall H','H108',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-rathna-hall-b','Rathna','Hall B','B121 - B122, B131',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-rathna-pavilion-r','Rathna','Pavilion R','R',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-reading-planet-hall-c','Reading Planet','Hall C','C24',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-richard-sirimavo-hall-h','Richard','Sirimavo Hall H','H85 - H86',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-ruhunu-stationery-sirimavo-hall-h','Ruhunu Stationery','Sirimavo Hall H','H106 - H107',NULL,'Stationery, Art & Student Supplies',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-s-and-t-group-sirimavo-hall-j','S And T Group','Sirimavo Hall J','J25 - J27',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-s-d-wijethunga-publications-sirimavo-hall-j','S.D.WIJETHUNGA Publications','Sirimavo Hall J','J52 - J53',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-sadeepa-bookshop-hall-a','Sadeepa Bookshop','Hall A','A1 - A3',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-sadeepa-bookshop-hall-b','Sadeepa Bookshop','Hall B','B93 - B94',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-sakhila-prakashana-hall-b','Sakhila Prakashana','Hall B','B84',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-sakura-art-store-sirimavo-hall-k','Sakura Art Store','Sirimavo Hall K','K21',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-sama-publishers-sirimavo-hall-j','Sama Publishers','Sirimavo Hall J','J35',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-samadhi-prakashana-hall-d','Samadhi Prakashana','Hall D','D08',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-samagi-publishers-sirimavo-hall-j','Samagi Publishers','Sirimavo Hall J','J18 - J20',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-samanala-danuma-publishers-hall-c','Samanala Danuma Publishers','Hall C','C7 - C8',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-samayawardhana-bookshop-hall-a','Samayawardhana Bookshop','Hall A','A10 - A12, A46 - A48',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-sampath-bank-sirimavo-hall-j','Sampath Bank','Sirimavo Hall J','J30',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-samudra-publishers-hall-a','Samudra Publishers','Hall A','A4 - A9',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-samudra-publishers-sirimavo-hall-j','Samudra Publishers','Sirimavo Hall J','J38 - J41',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-samudra-wettasinghe-hall-a','Samudra Wettasinghe','Hall A','A81 - A82',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-sandakada-publishing-hall-c','Sandakada Publishing','Hall C','C26',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-sandamadavee-publishers-sirimavo-hall-k','Sandamadavee Publishers','Sirimavo Hall K','K20',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-sandeshaya-sirimavo-hall-j','Sandeshaya','Sirimavo Hall J','J33 - J34',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-sandini-book-publishers-sirimavo-hall-k','Sandini Book Publishers','Sirimavo Hall K','K23 - K26',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-sankha-publishers-sirimavo-hall-j','Sankha Publishers','Sirimavo Hall J','J21 - J24',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-santhawa-prakashana-sirimavo-hall-k','Santhawa Prakashana','Sirimavo Hall K','K38 - K39',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-sarada-publications-hall-d','Sarada Publications','Hall D','D12',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-sarasavi-bookshop-hall-a','Sarasavi Bookshop','Hall A','A73 - A78',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-sarasavi-bookshop-hall-d','Sarasavi Bookshop','Hall D','D13',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-sarasavi-pavilion-m','Sarasavi','Pavilion M','M',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-saraswathi-publications-hall-b','Saraswathi Publications','Hall B','B85 - B86',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-sarath-books-sirimavo-hall-h','Sarath Books','Sirimavo Hall H','H42',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-sarvodaya-vishva-lekha-sirimavo-hall-k','Sarvodaya Vishva Lekha','Sirimavo Hall K','K35',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-sathara-hall-c','Sathara','Hall C','C13 - C17',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-sayura-publications-hall-c','Sayura Publications','Hall C','C22 - C23',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-scitech-bookshop-sirimavo-hall-j','Scitech Bookshop','Sirimavo Hall J','J14 - J15',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-seri-publication-hall-d','Seri Publication','Hall D','D10',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-shaakya-publications-sirimavo-hall-h','Shaakya Publications','Sirimavo Hall H','H37',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-shan-print-and-graphic-system-sirimavo-hall-h','Shan Print And Graphic System','Sirimavo Hall H','H66 - H67',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-shiksha-mandira-publications-sirimavo-hall-h','Shiksha Mandira Publications','Sirimavo Hall H','H09',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-shriwi-publishers-sirimavo-hall-k','Shriwi Publishers','Sirimavo Hall K','K37',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-silika-publications-sirimavo-hall-k','Silika Publications','Sirimavo Hall K','K27 - K28',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-sithuwili-publication-sirimavo-hall-h','Sithuwili Publication','Sirimavo Hall H','H40',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-sooriya-publishers-pvt-ltd-hall-b','Sooriya Publishers PVT LTD','Hall B','B132 - B139',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-sooriyakantha-publishers-hall-d','Sooriyakantha Publishers','Hall D','D11',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-sounds-co-hall-c','Sounds & Co','Hall C','C29',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-sri-lanka-philatelic-bureau-hall-b','Sri Lanka Philatelic Bureau','Hall B','B83',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-state-printing-corporation-sirimavo-hall-k','State Printing Corporation','Sirimavo Hall K','K14 - K15',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-storyflix-private-limited-sirimavo-hall-h','Storyflix Private Limited','Sirimavo Hall H','H112',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-subha-publishers-hall-d','Subha Publishers','Hall D','D28',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-suleka-publishers-sirimavo-hall-h','Suleka Publishers','Sirimavo Hall H','H115',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-sunera-publishers-sirimavo-hall-j','Sunera Publishers','Sirimavo Hall J','J36 - J37',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-surendra-prakashana-sirimavo-hall-k','Surendra Prakashana','Sirimavo Hall K','K34',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-susara-publications-hall-d','Susara Publications','Hall D','D1 - D2, D29',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-susara-publications-sirimavo-hall-j','Susara Publications','Sirimavo Hall J','J44 - J48, J73 - J77',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-thara-publications-hall-c','Thara Publications','Hall C','C06',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-tharanga-publishers-sirimavo-hall-j','Tharanga Publishers','Sirimavo Hall J','J11 - J13',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-the-ceylon-bible-society-hall-c','The Ceylon Bible Society','Hall C','C21',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-the-reading-book-house-pvt-ltd-sirimavo-hall-h','The Reading Book House PVT LTD','Sirimavo Hall H','H64 - H65',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-thothanna-publishing-house-sirimavo-hall-h','Thothanna Publishing House','Sirimavo Hall H','H08',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-thrimana-publications-sirimavo-hall-h','Thrimana Publications','Sirimavo Hall H','H97',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-tikiri-publishers-pvt-ltd-hall-d','Tikiri Publishers PVT LTD','Hall D','D07',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-timeplan-publishing-pvt-ltd-hall-a','Timeplan Publishing PVT LTD','Hall A','A36 - A37',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-udaya-book-publishers-hall-d','Udaya Book Publishers','Hall D','D21 - D22',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-vijitha-yapa-bookshop-hall-a','Vijitha Yapa Bookshop','Hall A','A21, A34 - A35',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-warna-graphic-sirimavo-hall-h','Warna Graphic','Sirimavo Hall H','H77 - H80',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-warnasooriya-book-shop-sirimavo-hall-h','Warnasooriya Book Shop','Sirimavo Hall H','H58 - H59',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-wasana-bookshop-sirimavo-hall-j','Wasana Bookshop','Sirimavo Hall J','J55 - J57, J64 - J66',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-weerodara-sirimavo-hall-k','Weerodara','Sirimavo Hall K','K01',NULL,'General Books & Fiction',0,'2026-09-24 11:20:58','2026-09-24 11:20:58'),('stall-wisdom-books-pvt-ltd-hall-a','Wisdom Books PVT LTD','Hall A','A17, A39 - A40',NULL,'Academic, Educational & Reference',0,'2026-09-24 11:20:58','2026-09-24 11:20:58');
/*!40000 ALTER TABLE `stalls` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_09_23_000001_create_stalls_table',1),(5,'2026_09_23_000002_create_spots_table',1),(6,'2026_09_23_000003_create_spot_ratings_table',1),(7,'2026_09_23_000004_add_is_pinned_to_spots_table',2),(8,'2026_09_23_000005_add_archived_columns_to_spots_table',3),(9,'2026_09_23_000006_add_auth_fields_to_users_table',4),(10,'2026_09_24_000007_add_ip_address_to_users_table',5),(11,'2026_09_24_000008_add_is_hidden_to_stalls_table',6),(12,'2026_09_24_000009_increase_stall_id_length',7),(13,'2026_09_24_000010_add_is_disabled_to_users_table',8);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-24 23:56:29
