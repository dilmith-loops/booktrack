# AWS Lightsail Tuning Guide (2 vCPUs, 4GB RAM)

This directory contains pre-configured, production-hardened configurations specifically tuned for an **AWS Lightsail 2 Core / 4GB RAM** instance running the **Sampath Book Finder** application.

---

## Resource Allocation Budget (4096 MB Total)

| Component | Allocated RAM | Rationale |
| :--- | :--- | :--- |
| **MySQL 8 (InnoDB)** | `1400 MB` | Keeps all stall, spot, and user records in memory; prevents disk IOPS exhaustion. |
| **PHP 8.3-FPM** | `1575 MB` | Dynamic pool: `pm.max_children = 35` (~45 MB per worker). Handles 100+ concurrent requests. |
| **Redis** | `256 MB` | High-speed cache for sessions, user status, stalls, and moderation checks (`allkeys-lru`). |
| **Nginx & OS Core** | `500 MB` | TCP network stack, socket buffers, file descriptors, and OS background services. |
| **Safety Headroom** | `365 MB` | Buffer preventing Out-Of-Memory (OOM) killer invocation during traffic spikes. |

---

## Quick Setup Steps

### 1. Apply Linux Kernel Optimizations
```bash
sudo cp server-config/system/sysctl.conf /etc/sysctl.d/99-lightsail-tuning.conf
sudo sysctl --system
```

### 2. Configure PHP-FPM & OPcache
```bash
# Ubuntu / Debian with PHP 8.3 (adjust version if using 8.2)
sudo cp server-config/php/www.conf /etc/php/8.3/fpm/pool.d/www.conf
sudo cp server-config/php/10-opcache.ini /etc/php/8.3/mods-available/opcache.ini
sudo systemctl restart php8.3-fpm
```

### 3. Configure MySQL 8
```bash
sudo cp server-config/mysql/my.cnf /etc/mysql/conf.d/lightsail-tuning.cnf
sudo systemctl restart mysql
```

### 4. Configure Redis
```bash
sudo cp server-config/redis/redis.conf /etc/redis/redis.conf
sudo systemctl restart redis-server
```

### 5. Configure Nginx
```bash
sudo cp server-config/nginx/bookfairtracker.conf /etc/nginx/sites-available/bookfairtracker
sudo ln -sf /etc/nginx/sites-available/bookfairtracker /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## Laravel Production Optimization Commands

Run these inside `/var/www/html/backend`:
```bash
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```
