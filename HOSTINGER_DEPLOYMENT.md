# Deploying to Hostinger (ai.loopsintegrated.co/booktrack)

This guide walks you through deploying the **Sampath Book Finder** application to **`https://ai.loopsintegrated.co/booktrack`** using Hostinger's Git deployment feature.

---

## 🏗️ How it Works

- **Frontend**: The React SPA is pre-compiled with Vite using the `/booktrack/` base path. Assets and PWA manifests are bundled directly into `backend/public/`.
- **Backend**: Laravel handles the REST API routes (`/booktrack/api/*`) and serves the SPA on all web paths.
- **Routing**: Root `.htaccess` automatically directs all incoming traffic into `backend/public/` where Apache and Laravel manage API requests and SPA fallback.

---

## 🚀 Step-by-Step Deployment Guide

### Step 1: Connect Git in Hostinger hPanel
1. Log into your **Hostinger Dashboard (hPanel)**.
2. Navigate to **Websites** -> select **`ai.loopsintegrated.co`** -> **Manage**.
3. In the search bar or under **Advanced**, click **Git**.
4. Configure the Git deployment:
   - **Repository**: `https://github.com/dilmith-loops/booktrack.git`
   - **Branch**: `main`
   - **Install Directory**: `public_html/booktrack`
5. Click **Create** (or **Deploy**). Hostinger will clone the latest repository code into `public_html/booktrack`.

---

### Step 2: Set Up MySQL Database in Hostinger
1. In hPanel, go to **Databases** -> **Management**.
2. Create a new MySQL database:
   - **Database Name**: e.g. `u123456789_booktrack`
   - **Username**: e.g. `u123456789_dbuser`
   - **Password**: (Set a strong password)
3. Click **Create**.
4. Click **Enter phpMyAdmin** next to the newly created database.
5. In phpMyAdmin, click the **Import** tab:
   - Choose file: `public_html/booktrack/backend/database/booktrack_initial.sql`
   - Click **Go** / **Import**.
   *(All 16 fair stalls and initial community spot records are imported instantly!)*

---

### Step 3: Configure Production `.env`
1. In Hostinger hPanel, open **File Manager** (Files -> File Manager).
2. Navigate to `public_html/booktrack/backend/`.
3. If `.env` does not exist, copy `.env.example` to `.env`.
4. Edit `.env` with your production settings:
   ```env
   APP_NAME="Sampath Book Finder"
   APP_ENV=production
   APP_KEY=base64:RRcijdt5CKnLFcN0E1Rwq61w7/Q5CCDFZTP/bNYyS6o=
   APP_DEBUG=false
   APP_URL=https://ai.loopsintegrated.co/booktrack

   DB_CONNECTION=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_DATABASE=your_hostinger_database_name
   DB_USERNAME=your_hostinger_database_user
   DB_PASSWORD=your_hostinger_database_password

   # Admin Credentials
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=YourStrongAdminPasswordHere!

   # Google Gemini AI Key
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
5. Save the file.

---

### Step 4: Install PHP Dependencies & Cache Config
Open **SSH Access / Terminal** in hPanel (or connect via SSH):
```bash
cd domains/ai.loopsintegrated.co/public_html/booktrack/backend

# 1. Install Composer dependencies
composer install --no-dev --optimize-autoloader

# 2. Link public storage
php artisan storage:link

# 3. Optimize Laravel for production
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

### Step 5: Verify Permissions
Ensure the web server has write access to Laravel storage:
```bash
chmod -R 775 storage bootstrap/cache
```

---

## ✅ Test Your Live Application

Visit **[https://ai.loopsintegrated.co/booktrack](https://ai.loopsintegrated.co/booktrack)** in your browser:
- The React application loads with all styled assets and stall directories.
- The health check API is available at `https://ai.loopsintegrated.co/booktrack/api/health`.
- Future updates can be deployed anytime by clicking **Deploy** in Hostinger's Git manager.
