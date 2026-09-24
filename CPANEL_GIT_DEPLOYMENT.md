# Deploying to cPanel (https://bookfairtracker.com) via Git

This guide walks you through deploying **Sampath Book Finder** to **`https://bookfairtracker.com`** using cPanel's **Git™ Version Control** feature.

---

## 🏗️ Architecture Overview

- **Frontend**: The React Single Page Application (SPA) is pre-compiled with Vite using the root `/` base path. All static assets, PWA manifests, and service workers are bundled directly into [`backend/public/`](backend/public).
- **Backend**: Laravel handles all REST API routes (`/api/*`) and serves the React SPA.
- **Routing**: The root [`.htaccess`](.htaccess) and [`index.php`](index.php) automatically route all web and API traffic into `backend/public/`.
- **Zero-Build Deployment**: No Node.js or `npm` required on the cPanel server.

---

## 🚀 Step-by-Step Deployment Guide

### Step 1: Clone Repository in cPanel Git™ Version Control

1. Log into your **cPanel** dashboard.
2. In the **Files** section, click **Git™ Version Control**.
3. Click the blue **Create** button.
4. Set the following fields:
   - **Clone URL**: `https://github.com/dilmith-loops/booktrack.git`
   - **Repository Path**:
     - **If `bookfairtracker.com` is your primary domain**: enter `public_html` (or a subdirectory like `bookfairtracker` if you point the document root to it).
     - **If `bookfairtracker.com` is an Addon Domain**: enter the directory assigned to it (e.g. `public_html/bookfairtracker.com` or `bookfairtracker.com`).
   - **Repository Name**: `bookfairtracker`
5. Click **Create**. cPanel will clone the repository.

---

### Step 2: Set the Document Root (Recommended)

In cPanel -> **Domains**:
- Find `bookfairtracker.com`.
- **Option A (Best Practice)**: Set the **Document Root** to point directly to the public directory:
  ```text
  /home/YOUR_CPANEL_USER/public_html/backend/public
  ```
  *(or `/home/YOUR_CPANEL_USER/bookfairtracker.com/backend/public`)*
- **Option B (Default `/public_html`)**: If your hosting provider locks the primary domain document root to `/public_html`, **do nothing**! The root [`.htaccess`](.htaccess) and [`index.php`](index.php) in this repository will automatically proxy requests into `backend/public/`.

---

### Step 3: Create MySQL Database & Import Stalls Data

1. In cPanel, navigate to **Databases** -> **MySQL® Databases**.
2. Create a new database:
   - Database name: e.g. `cpaneluser_bookfair`
3. Create a new database user:
   - Username: e.g. `cpaneluser_bookusr`
   - Password: (generate a strong password and save it)
4. Add the user to the database:
   - Select your user and database, then click **Add**.
   - Check **ALL PRIVILEGES** and click **Make Changes**.
5. Return to cPanel home and open **phpMyAdmin**:
   - Select your new database (`cpaneluser_bookfair`) in the left sidebar.
   - Click the **Import** tab at the top.
   - Click **Choose File** and select:
     ```text
     backend/database/bookfairtracker_initial.sql
     ```
   - Scroll down and click **Import** (or **Go**).
   *(This instantly sets up all database tables and seeds all 170 official BMICH CIBF 2026 fair stalls!)*

---

### Step 4: Configure Production Environment (`backend/.env`)

1. In cPanel, open **File Manager** (under **Files**).
2. Ensure hidden files are visible: Click **Settings** (top right) -> Check **Show Hidden Files (dotfiles)** -> **Save**.
3. Navigate to:
   ```text
   public_html/backend/
   ```
4. If `.env` does not exist, select `.env.example`, click **Copy**, and name it `.env`.
5. Right-click `.env` and click **Edit**.
6. Set the production values:

```env
APP_NAME="Sampath Book Finder"
APP_ENV=production
APP_KEY=base64:RRcijdt5CKnLFcN0E1Rwq61w7/Q5CCDFZTP/bNYyS6o=
APP_DEBUG=false
APP_URL=https://bookfairtracker.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cpaneluser_bookfair
DB_USERNAME=cpaneluser_bookusr
DB_PASSWORD=YOUR_STRONG_DATABASE_PASSWORD

SESSION_DRIVER=database
CACHE_STORE=file

# Administrative Password for Control Center (/admin)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=SampathAdmin@2026

# Google Gemini API Key for Content Moderation
GEMINI_API_KEY=your_gemini_api_key_here
```
7. Click **Save Changes**.

---

### Step 5: Install PHP Dependencies (Composer)

Using cPanel **Terminal** (or SSH):
```bash
# Navigate to backend directory
cd ~/public_html/backend
# (or cd ~/bookfairtracker.com/backend)

# Install optimized PHP dependencies
composer install --no-dev --optimize-autoloader

# Ensure storage directories have write permissions
chmod -R 775 storage bootstrap/cache
```

> **Note**: If your cPanel host does not offer SSH/Terminal access, the standard Laravel dependencies can be uploaded directly or installed via cPanel's PHP Composer tool.

---

### Step 6: Enable Free SSL (HTTPS)

1. In cPanel, search for **SSL/TLS Status** (or **Let's Encrypt™ SSL**).
2. Check `bookfairtracker.com` and `www.bookfairtracker.com`.
3. Click **Run AutoSSL** to issue the free SSL certificate.
4. Enable **Force HTTPS Redirection** under cPanel **Domains**.

---

## 🔄 Pulling Future Updates via Git

Whenever you push new updates to `github.com/dilmith-loops/booktrack`:
1. In cPanel -> **Git™ Version Control**.
2. Click **Manage** next to `bookfairtracker`.
3. Click the **Pull or Deploy** tab.
4. Click **Update from Remote**.
5. Your live site will instantly update with the latest commits!

---

## ✅ Verification Checklist

1. Visit **`https://bookfairtracker.com/`**:
   - The Sampath Book Finder launch / onboarding screen loads cleanly.
   - PWA manifest loads from `/manifest.webmanifest`.
   - Browser console shows no 404 errors for assets or scripts.
2. Visit **`https://bookfairtracker.com/admin`**:
   - Admin authentication modal opens.
   - Log in with `SampathAdmin@2026`.
   - Verify that all 170 fair stalls and registered spotters are active and readable from MySQL.
