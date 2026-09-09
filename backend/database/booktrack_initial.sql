-- MySQL dump 10.13  Distrib 8.0.30, for Win64 (x86_64)
--
-- Host: localhost    Database: booktrack_db
-- ------------------------------------------------------
-- Server version	8.0.30

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
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  KEY `failed_jobs_connection_queue_failed_at_index` (`connection`,`queue`,`failed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` smallint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_09_23_000001_create_stalls_table',1),(5,'2026_09_23_000002_create_spots_table',1),(6,'2026_09_23_000003_create_spot_ratings_table',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('Qd8MwkftANNLBC01fDjAq4FVGdtkLi9M1dYb433e',NULL,'127.0.0.1','curl/8.21.0','eyJfdG9rZW4iOiJJanpHREhCT1BjRU1pSzJuMkd5VFdhNU5kMXFySmFCUUg4VG5GeW5jIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMTo4MDAwIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19',1790173159);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `spot_ratings`
--

DROP TABLE IF EXISTS `spot_ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spot_ratings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `spot_id` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `score` tinyint unsigned NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `spot_ratings_spot_id_foreign` (`spot_id`),
  CONSTRAINT `spot_ratings_spot_id_foreign` FOREIGN KEY (`spot_id`) REFERENCES `spots` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `spot_ratings`
--

LOCK TABLES `spot_ratings` WRITE;
/*!40000 ALTER TABLE `spot_ratings` DISABLE KEYS */;
INSERT INTO `spot_ratings` VALUES (1,'spot-1790170847016-mgr55',4,'127.0.0.1','2026-09-23 08:11:04','2026-09-23 08:11:04');
/*!40000 ALTER TABLE `spot_ratings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `spots`
--

DROP TABLE IF EXISTS `spots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spots` (
  `id` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `post_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'spot',
  `book_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `author` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stall_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stall_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hall` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stall_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `images` json DEFAULT NULL,
  `finder_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finder_handle` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` bigint NOT NULL,
  `price_or_offer` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shelf_location_note` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'In Stock',
  `helpful_count` int NOT NULL DEFAULT '0',
  `rating_average` decimal(3,1) NOT NULL DEFAULT '5.0',
  `rating_count` int NOT NULL DEFAULT '1',
  `ai_verified` tinyint(1) NOT NULL DEFAULT '1',
  `sampath_card_discount` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reply_to_request_id` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tagged_requester_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tagged_requester_handle` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_resolved` tinyint(1) NOT NULL DEFAULT '0',
  `resolved_by_spot_id` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `spots_post_type_index` (`post_type`),
  KEY `spots_timestamp_index` (`timestamp`),
  KEY `spots_stall_id_index` (`stall_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `spots`
--

LOCK TABLES `spots` WRITE;
/*!40000 ALTER TABLE `spots` DISABLE KEYS */;
INSERT INTO `spots` VALUES ('req-1','request','Harry Potter - Order of the Phoenix','J.K. Rowling','seeking','BMICH Fairgrounds','Hall A','Found by @tanya_pages','[]','Kavindu Senanayake','@kavindu_s',1790169687709,NULL,NULL,'Looking for Bloomsbury paperback edition with the blue cover.','Found',8,5.0,1,1,NULL,NULL,NULL,NULL,1,'spot-hp-reply','2026-09-23 08:09:27','2026-09-23 08:09:27'),('req-2','request','Madol Doova (English Translation)','Martin Wickramasinghe','seeking','BMICH Fairgrounds','Seeking in All Halls','Not located yet','[]','Nipuni Perera','@nipuni_reads',1790170467709,NULL,NULL,'Looking for the English translation for a foreign friend visiting BMICH! Has anyone seen it?','Looking for Book',3,5.0,1,1,NULL,NULL,NULL,NULL,0,NULL,'2026-09-23 08:09:27','2026-09-23 08:09:27'),('spot-1','spot','Atomic Habits by James Clear','James Clear','expographic-c','Expographic Books','Hall C','C15 - C20','[\"https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80\", \"https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80\", \"https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80\"]','Nethmi & Dilshan','@bookspotted_lk',1790169267709,'Rs. 2,400 (Rs. 1,920 with Sampath Card)','Front counter display on shelf 2, next to psychology aisle. Stacks available!',NULL,'In Stock',38,4.8,31,1,'20% off with Sampath Card',NULL,NULL,NULL,0,NULL,'2026-09-23 08:09:27','2026-09-23 08:09:27'),('spot-1790170847016-mgr55','spot','Guttilaya (ගුත්තිලය)',NULL,'sarasavi-a','Sarasavi Bookshop','Hall A','A12 - A18','[]','Malith','@malith',1790170847016,'Rs. 450','Aisle 1 Row 2',NULL,'Few Copies Left',3,4.5,2,1,'20% off with Sampath Credit Cards',NULL,NULL,NULL,0,NULL,'2026-09-23 08:10:47','2026-09-23 08:11:09'),('spot-1790172799833-vvebw','spot','The Hobbit',NULL,'buddhist-cultural-e','Buddhist Cultural Centre','Hall E','E01 - E04','[\"https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80\"]','Kasun Perera','@kasun_perera',1790172799833,NULL,NULL,NULL,'In Stock',1,5.0,1,1,'15% off on Dhamma publications',NULL,NULL,NULL,0,NULL,'2026-09-23 08:43:20','2026-09-23 08:43:20'),('spot-2','spot','Madol Doova (මඩොල් දූව) by Martin Wickramasinghe','Martin Wickramasinghe','gunasena-b','M.D. Gunasena','Hall B','B01 - B10','[\"https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=800&q=80\", \"https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80\"]','Kasun Bandara','@kasun_reads',1790168367709,'Rs. 650 hardcover edition','Right side entrance, Sri Lankan classics wooden shelf row 3.',NULL,'In Stock',24,5.0,19,1,'15% instant debit card discount',NULL,NULL,NULL,0,NULL,'2026-09-23 08:09:27','2026-09-23 08:09:27'),('spot-3','spot','The Midnight Library by Matt Haig','Matt Haig','vijitha-yapa-a','Vijitha Yapa Bookshop','Hall A','A01 - A06','[\"https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80\", \"https://images.unsplash.com/photo-1507842229451-9f232615e324?auto=format&fit=crop&w=800&q=80\", \"https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80\"]','Tanya Perera','@tanya_pages',1790167767709,'Rs. 2,150 (Special festival price)','Middle table bento showcase under International Fiction banner.',NULL,'Few Copies Left',19,5.0,1,1,'Up to 25% off on selected titles',NULL,NULL,NULL,0,NULL,'2026-09-23 08:09:27','2026-09-23 08:09:27'),('spot-4','spot','Gamperaliya (ගම්පෙරළිය) by Martin Wickramasinghe','Martin Wickramasinghe','godage-d','Godage International','Hall D','D01 - D08','[\"https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80\", \"https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=800&q=80\"]','Akeel Mohamed','@akeel_lit',1790165067709,'Rs. 850 with commemorative bookmark','Hall D center aisle, shelf D4 marked \"Sahithya Sooriyo\".',NULL,'In Stock',15,5.0,1,1,'Sampath Bank reward points eligible',NULL,NULL,NULL,0,NULL,'2026-09-23 08:09:27','2026-09-23 08:09:27'),('spot-5','spot','Atomic Habits by James Clear','James Clear','sarasavi-a','Sarasavi Bookshop','Hall A','A12 - A18','[\"https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=800&q=80\", \"https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80\"]','Dinithi Senanayake','@dini_reads',1790162367709,'Rs. 2,350 (20% off with Sampath Card)','Section A14 right next to the new arrivals revolving tower.',NULL,'In Stock',42,5.0,1,1,'20% off with Sampath Card',NULL,NULL,NULL,0,NULL,'2026-09-23 08:09:27','2026-09-23 08:09:27'),('spot-hp-reply','spot','Harry Potter and the Order of the Phoenix','J.K. Rowling','vijitha-yapa-a','Vijitha Yapa Bookshop','Hall A','A18 - A24','[\"https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80\", \"https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80\"]','Tanya Perera','@tanya_pages',1790170167709,'Rs. 3,200 (15% off with Sampath Card)','Found on Aisle 3 fiction shelf! 4 copies left near cashier counter.',NULL,'Few Copies Left',28,4.9,24,1,'15% instant discount with Sampath Card','req-1','Kavindu Senanayake','@kavindu_s',0,NULL,'2026-09-23 08:09:27','2026-09-23 08:09:27');
/*!40000 ALTER TABLE `spots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stalls`
--

DROP TABLE IF EXISTS `stalls`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stalls` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hall` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stall_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `special_discount` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stalls`
--

LOCK TABLES `stalls` WRITE;
/*!40000 ALTER TABLE `stalls` DISABLE KEYS */;
INSERT INTO `stalls` VALUES ('buddhist-cultural-e','Buddhist Cultural Centre','Hall E','E01 - E04','15% off on Dhamma publications','Philosophy, Buddhism, Meditation','2026-09-23 08:09:27','2026-09-23 08:09:27'),('dayawansa-d','Dayawansa Jayakody & Co','Hall D','D12 - D15','10% flat discount on all publications','Sinhala Fiction, Cultural studies','2026-09-23 08:09:27','2026-09-23 08:09:27'),('expographic-c','Expographic Books','Hall C','C15 - C20','Sampath 20% off on Academic & Self-help','Academic, Self Development, Sci-Fi','2026-09-23 08:09:27','2026-09-23 08:09:27'),('godage-d','Godage International','Hall D','D01 - D08','Special fair discounts + Sampath cashback','Sinhala Literature, Drama, Poetry, History','2026-09-23 08:09:27','2026-09-23 08:09:27'),('grantha-s','Grantha.lk','Sirimavo Hall','S05 - S08','Buy 2 Get 1 Free offers','Sinhala Contemporary, Translations, Graphic Novels','2026-09-23 08:09:27','2026-09-23 08:09:27'),('gunasena-b','M.D. Gunasena','Hall B','B01 - B10','15% off with Sampath Debit Cards','Children, Sinhala Classics, Educational','2026-09-23 08:09:27','2026-09-23 08:09:27'),('jeya-a','Jeya Book Centre','Hall A','A30 - A34','Sampath cardholders 20% discount','Medical, Engineering, International paperbacks','2026-09-23 08:09:27','2026-09-23 08:09:27'),('jumpbooks-c','Jumpbooks.lk','Hall C','C30 - C32','Special discount bundles for Gen Z & youth','Thrillers, Romance, English Paperbacks','2026-09-23 08:09:27','2026-09-23 08:09:27'),('lakehouse-b','Lake House Bookshop','Hall B','B14 - B18','15% instant discount on all titles','Sri Lankan Heritage, Dictionaries, Literature','2026-09-23 08:09:27','2026-09-23 08:09:27'),('makeen-a','Makeen Books','Hall A','A22 - A26','15% off on Young Adult & Manga','Manga, Young Adult, Fantasy, Imports','2026-09-23 08:09:27','2026-09-23 08:09:27'),('masterguide-e','Masterguide Publications','Hall E','E10 - E14','Examination guides special price','O/L & A/L Exam Guides, Past Papers','2026-09-23 08:09:27','2026-09-23 08:09:27'),('sadeepa-b','Sadeepa Bookshop','Hall B','B22 - B25','Sampath 15% instant voucher','Stationery, Academic & General','2026-09-23 08:09:27','2026-09-23 08:09:27'),('samayawardhana-c','Samayawardhana Publishers','Hall C','C04 - C08','Special school discounts','Novels, Translations, Religious books','2026-09-23 08:09:27','2026-09-23 08:09:27'),('sarasavi-a','Sarasavi Bookshop','Hall A','A12 - A18','20% off with Sampath Credit Cards','General & International Fiction, Translations','2026-09-23 08:09:27','2026-09-23 08:09:27'),('vijitha-yapa-a','Vijitha Yapa Bookshop','Hall A','A01 - A06','Up to 25% on selected imports','Best-sellers, Non-fiction, History','2026-09-23 08:09:27','2026-09-23 08:09:27');
/*!40000 ALTER TABLE `stalls` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-23 19:50:04
