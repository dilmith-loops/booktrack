#!/usr/bin/env bash
# ==============================================================================
# AWS Lightsail 2 vCPU / 4GB RAM Optimization Setup Script
# Application: Sampath Book Finder (bookfairtracker.com)
# ==============================================================================

set -e

echo "=== Starting Lightsail 2 Core / 4GB RAM Optimization Setup ==="

# Check root privileges
if [ "$EUID" -ne 0 ]; then
  echo "Error: Please run as root (e.g. sudo bash setup-lightsail.sh)"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Linux Kernel & Sysctl Tuning
echo "[1/5] Applying Kernel Sysctl network & memory optimizations..."
cp "${SCRIPT_DIR}/system/sysctl.conf" /etc/sysctl.d/99-lightsail-tuning.conf
sysctl --system

# 2. PHP-FPM & OPcache Tuning
echo "[2/5] Configuring PHP-FPM (35 dynamic workers) and OPcache..."
PHP_VER=$(php -r "echo PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION;" 2>/dev/null || echo "8.3")
if [ -d "/etc/php/${PHP_VER}/fpm" ]; then
  cp "${SCRIPT_DIR}/php/www.conf" "/etc/php/${PHP_VER}/fpm/pool.d/www.conf"
  sed -i "s|php8.3-fpm.sock|php${PHP_VER}-fpm.sock|g" "/etc/php/${PHP_VER}/fpm/pool.d/www.conf"
  
  if [ -d "/etc/php/${PHP_VER}/mods-available" ]; then
    cp "${SCRIPT_DIR}/php/10-opcache.ini" "/etc/php/${PHP_VER}/mods-available/opcache.ini"
  fi
  
  systemctl restart "php${PHP_VER}-fpm" || true
  echo "PHP-FPM ${PHP_VER} updated and restarted."
else
  echo "Warning: /etc/php/${PHP_VER}/fpm directory not found. Please verify PHP installation."
fi

# 3. MySQL 8 Tuning
echo "[3/5] Configuring MySQL 8 InnoDB Buffer Pool (1400MB)..."
if [ -d "/etc/mysql/conf.d" ]; then
  cp "${SCRIPT_DIR}/mysql/my.cnf" /etc/mysql/conf.d/lightsail-tuning.cnf
  systemctl restart mysql || systemctl restart mariadb || true
  echo "MySQL updated and restarted."
else
  echo "Warning: /etc/mysql/conf.d not found. Please verify MySQL installation."
fi

# 4. Redis Cache Tuning
echo "[4/5] Configuring Redis In-Memory Cache (256MB cap, LRU)..."
if command -v redis-server >/dev/null 2>&1; then
  if [ -d "/etc/redis" ]; then
    cp "${SCRIPT_DIR}/redis/redis.conf" /etc/redis/redis.conf
    systemctl restart redis-server || systemctl restart redis || true
    echo "Redis configured and restarted."
  fi
else
  echo "Note: Redis not installed. Install with 'apt-get install -y redis-server' for maximum speed."
fi

# 5. Nginx Configuration
echo "[5/5] Checking Nginx configuration..."
if [ -d "/etc/nginx/sites-available" ]; then
  cp "${SCRIPT_DIR}/nginx/bookfairtracker.conf" /etc/nginx/sites-available/bookfairtracker
  sed -i "s|php8.3-fpm.sock|php${PHP_VER}-fpm.sock|g" /etc/nginx/sites-available/bookfairtracker
  ln -sf /etc/nginx/sites-available/bookfairtracker /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx || true
  echo "Nginx updated and reloaded."
fi

echo "=== Optimization Setup Completed Successfully! ==="
echo "Next step: Run 'composer install --no-dev --optimize-autoloader' and 'php artisan config:cache' in the backend directory."
