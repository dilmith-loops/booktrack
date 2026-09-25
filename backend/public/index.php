<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Security hardening: hide PHP version and set core protection headers
if (function_exists('header_remove')) {
    header_remove('X-Powered-By');
}
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');

// Catch any fatal PHP compile or startup errors and return descriptive JSON
register_shutdown_function(function () {
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR])) {
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
        }
        echo json_encode([
            'fatal_error' => $err['message'],
            'file' => basename($err['file']) . ':' . $err['line'],
            'full_path' => $err['file'],
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    }
});

// Early health ping check
if (isset($_GET['health_check'])) {
    header('Content-Type: application/json');
    echo json_encode(['php' => PHP_VERSION, 'status' => 'alive']);
    exit;
}

// 1. PHP Version Diagnostic Check
if (version_compare(PHP_VERSION, '8.2.0', '<')) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'Incompatible PHP version on server.',
        'current_php_version' => PHP_VERSION,
        'required_php_version' => '>= 8.2 (Recommended: PHP 8.3)',
        'solution' => 'In cPanel, open "MultiPHP Manager" and switch the PHP version for bookfairtracker.com to PHP 8.2 or 8.3.'
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

// 2. Composer Autoload Diagnostic Check
$autoloadPath = __DIR__ . '/../vendor/autoload.php';
if (!file_exists($autoloadPath)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'Laravel vendor dependencies are not installed on this server.',
        'status' => 'vendor_autoload_missing',
        'details' => 'backend/vendor/autoload.php was not found.',
        'solution' => 'In cPanel terminal, run: curl -sS https://getcomposer.org/installer | php && php composer.phar install --no-dev --optimize-autoloader'
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

// 3. Auto-fallback for .env if missing
$envPath = __DIR__ . '/../.env';
$exampleEnvPath = __DIR__ . '/../.env.example';
if (!file_exists($envPath) && file_exists($exampleEnvPath)) {
    @copy($exampleEnvPath, $envPath);
}

// 4. Maintenance mode
if (file_exists($maintenance = __DIR__ . '/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// 5. Register Composer Autoloader
require $autoloadPath;

// 6. Bootstrap Laravel and Catch Any Runtime Exceptions
try {
    /** @var Application $app */
    $app = require_once __DIR__ . '/../bootstrap/app.php';

    $app->handleRequest(Request::capture());
} catch (\Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => $e->getMessage(),
        'exception' => get_class($e),
        'file' => basename($e->getFile()) . ':' . $e->getLine(),
        'hint' => str_contains($e->getMessage(), 'key')
            ? 'Generate an APP_KEY in backend/.env: run "php artisan key:generate"'
            : (str_contains($e->getMessage(), 'Access denied') || str_contains($e->getMessage(), 'Unknown database')
                ? 'Check MySQL credentials (DB_DATABASE, DB_USERNAME, DB_PASSWORD) in backend/.env'
                : 'Check backend/storage and backend/bootstrap/cache directory permissions (chmod -R 775).')
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}
