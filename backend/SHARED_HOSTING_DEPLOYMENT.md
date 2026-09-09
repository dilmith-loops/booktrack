# Shared Hosting Deployment Guide (cPanel / Plesk)

This guide explains how to deploy the **BMICH Book Fair Community Spotter** application (Laravel 13 + Pre-compiled React SPA + MySQL) to any standard shared hosting account **without needing Node.js or npm on the server**.

---

## 🏗️ Architecture Overview

- **Local Machine**: Runs Node.js & Vite to compile the React TypeScript frontend (`npm run build`).
- **Shared Hosting Server**: Only requires **PHP 8.2+** and **MySQL**.
- **Self-Contained Package**: Everything needed to run the app is inside the [`backend/`](file:///c:/laragon/www/booktrack/backend) directory:
  - Laravel framework (controllers, models, API routes)
  - Pre-compiled React production bundle inside `backend/public/`
  - Ready-to-import MySQL database backup [`backend/database/booktrack_initial.sql`](file:///c:/laragon/www/booktrack/backend/database/booktrack_initial.sql)

---

## 📋 Step-by-Step Deployment

### Step 1: Compile React Frontend Locally
On your development machine, open the project root and run:
```bash
npm run build
```
This automatically compiles React with Vite and packages the production assets directly into `backend/public/` (`index.html`, `assets/`, PWA manifest, service worker, icons).

---

### Step 2: Set Up MySQL Database in cPanel
1. Log into your **cPanel** dashboard.
2. Go to **MySQL Databases**:
   - Create a new database (e.g. `cpaneluser_booktrack`).
   - Create a new MySQL user (e.g. `cpaneluser_dbuser`) with a strong password.
   - Add the user to the database with **ALL PRIVILEGES**.
3. Go to **phpMyAdmin**:
   - Select your new database.
   - Click the **Import** tab.
   - Choose the file [`backend/database/booktrack_initial.sql`](file:///c:/laragon/www/booktrack/backend/database/booktrack_initial.sql) and click **Go**.
   *(All stalls and initial community spot records are imported instantly!)*

---

### Step 3: Upload the Application to Shared Hosting

#### Method A: If you can set your DocumentRoot (Addon Domain or Subdomain)
1. Zip the entire `backend/` folder on your computer.
2. Upload and extract it in your hosting home directory (e.g. `/home/cpaneluser/booktrack`).
3. In cPanel -> **Domains**, set the DocumentRoot of your domain to `/home/cpaneluser/booktrack/public`.

#### Method B: Standard cPanel Main Domain (`public_html`)
1. Upload the files inside `backend/public/` directly into your server's `public_html/` directory:
   - `public_html/index.php`
   - `public_html/.htaccess`
   - `public_html/index.html`
   - `public_html/assets/`
   - All static images and PWA files.
2. Upload the rest of the Laravel directories (`app/`, `bootstrap/`, `config/`, `database/`, `routes/`, `storage/`, `vendor/`, `.env`, `artisan`) to a private directory outside web root, e.g. `/home/cpaneluser/laravel_app/`.
3. Open `public_html/index.php` in the cPanel File Editor and adjust line 14 & 18:
   ```php
   require __DIR__.'/../laravel_app/vendor/autoload.php';
   $app = require_once __DIR__.'/../laravel_app/bootstrap/app.php';
   ```

---

### Step 4: Configure Production `.env`
Open `.env` in your Laravel directory on the server and update your production settings:
```env
APP_NAME="BMICH Book Spotter"
APP_ENV=production
APP_KEY=base64:your_app_key_here
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cpaneluser_booktrack
DB_USERNAME=cpaneluser_dbuser
DB_PASSWORD=your_mysql_password_here

GEMINI_API_KEY=your_gemini_api_key_here
```

---

### Step 5: Storage Permissions
Ensure the web server has write permissions on the `storage` and `bootstrap/cache` folders:
- In cPanel File Manager, right-click `storage` and `bootstrap/cache` -> **Change Permissions** -> set to `775` (or `755`).

---

## 🚀 That's It!
Your application is live at `https://yourdomain.com/`!
- The pre-compiled React SPA loads directly on all web paths.
- The Laravel API handles all `/api/*` endpoints querying your shared hosting MySQL database.
- Zero Node.js or npm processes are required on the server.
