<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    /**
     * Authenticate Admin using username & password.
     */
    /**
     * Safely resolve admin credentials from config, env, or direct .env file parser.
     */
    public static function resolveAdminCredential(string $envKey, string $configKey): ?string
    {
        $val = config($configKey);
        if (!empty($val)) {
            return (string) $val;
        }

        $val = env($envKey);
        if (!empty($val)) {
            return (string) $val;
        }

        // Direct fallback: read from .env if config is cached or env() is blank
        $envFile = base_path('.env');
        if (file_exists($envFile)) {
            $lines = @file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            if (is_array($lines)) {
                foreach ($lines as $line) {
                    $line = trim($line);
                    if (str_starts_with($line, '#')) continue;
                    if (str_starts_with($line, $envKey . '=')) {
                        $raw = trim(substr($line, strlen($envKey) + 1));
                        return trim($raw, " \t\n\r\0\x0B\"'");
                    }
                }
            }
        }

        return null;
    }

    /**
     * Authenticate Admin using username & password.
     */
    public function login(Request $request): JsonResponse
    {
        $username = trim((string) $request->input('username', ''));
        $password = (string) $request->input('password', '');

        $expectedUser = self::resolveAdminCredential('ADMIN_USERNAME', 'auth.admin.username');
        $expectedPass = self::resolveAdminCredential('ADMIN_PASSWORD', 'auth.admin.password');

        if (empty($expectedUser) || empty($expectedPass)) {
            return response()->json([
                'error' => 'Admin credentials are not configured on the server. Please ensure ADMIN_USERNAME and ADMIN_PASSWORD are set in your .env file.'
            ], 500);
        }

        // Check if username and password match (username is case-insensitive)
        if (strcasecmp($username, (string) $expectedUser) !== 0 || !hash_equals((string) $expectedPass, $password)) {
            return response()->json([
                'error' => 'Invalid administrative credentials.'
            ], 401);
        }

        $payload = [
            'admin' => $expectedUser,
            'time' => time(),
            'nonce' => Str::random(16)
        ];
        $payloadStr = base64_encode(json_encode($payload));
        $signature = hash_hmac('sha256', $payloadStr, config('app.key') ?: 'sampath-book-finder-key');
        $token = $payloadStr . '.' . $signature;

        return response()->json([
            'success' => true,
            'token' => $token,
            'admin' => [
                'username' => $expectedUser,
                'role' => 'Super Administrator'
            ],
            'message' => 'Admin authentication successful.'
        ]);
    }

    /**
     * Verify an existing Admin Token.
     */
    public function verify(Request $request): JsonResponse
    {
        $token = $request->header('X-Admin-Token') ?: $request->bearerToken();
        if (!$token || !self::isValidToken($token)) {
            return response()->json(['error' => 'Invalid or expired administrative session.'], 401);
        }

        return response()->json([
            'success' => true,
            'authenticated' => true,
            'username' => self::resolveAdminCredential('ADMIN_USERNAME', 'auth.admin.username')
        ]);
    }

    /**
     * Helper to validate admin token.
     */
    public static function isValidToken(?string $token): bool
    {
        if (empty($token) || !str_contains($token, '.')) {
            return false;
        }

        [$payloadStr, $signature] = explode('.', $token, 2);
        $expectedSig = hash_hmac('sha256', $payloadStr, config('app.key') ?: 'sampath-book-finder-key');

        if (!hash_equals($expectedSig, $signature)) {
            return false;
        }

        $data = json_decode(base64_decode($payloadStr), true);
        if (!is_array($data) || empty($data['admin']) || empty($data['time'])) {
            return false;
        }

        $expectedUser = self::resolveAdminCredential('ADMIN_USERNAME', 'auth.admin.username');
        if (empty($expectedUser) || strcasecmp((string) $data['admin'], (string) $expectedUser) !== 0) {
            return false;
        }

        // Token valid for 24 hours
        if ((time() - $data['time']) > (86400 * 1)) {
            return false;
        }

        return true;
    }

    /**
     * Get current maintenance mode status (Cached with ETag).
     */
    public function getMaintenanceStatus(Request $request): \Illuminate\Http\Response|JsonResponse
    {
        $payload = Cache::remember('settings_maintenance_v1', 300, function () {
            $filePath = storage_path('app/maintenance.json');
            if (file_exists($filePath)) {
                $data = json_decode(file_get_contents($filePath), true);
                if (is_array($data)) {
                    return [
                        'enabled' => !empty($data['enabled']),
                        'message' => $data['message'] ?? 'Platform is currently undergoing scheduled maintenance. Please check back shortly.',
                        'updatedAt' => $data['updatedAt'] ?? null,
                    ];
                }
            }
            return [
                'enabled' => false,
                'message' => 'Platform is operating normally.',
                'updatedAt' => null,
            ];
        });

        $etag = '"' . md5(json_encode($payload)) . '"';
        if ($request->header('If-None-Match') === $etag) {
            return response(null, 304)->header('ETag', $etag);
        }

        return response()->json($payload)
            ->header('ETag', $etag)
            ->header('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    }

    /**
     * Set maintenance mode (enable / disable).
     */
    public function setMaintenanceMode(Request $request): JsonResponse
    {
        $token = $request->header('X-Admin-Token') ?: $request->bearerToken();
        if (!$token || !self::isValidToken($token)) {
            return response()->json(['error' => 'Unauthorized. Administrator credentials required.'], 401);
        }

        $enabled = (bool) $request->input('enabled', false);
        $message = trim((string) $request->input('message', 'Platform is currently undergoing scheduled maintenance. Please check back shortly.'));

        $data = [
            'enabled' => $enabled,
            'message' => $message,
            'updatedAt' => date('c'),
            'updatedBy' => self::resolveAdminCredential('ADMIN_USERNAME', 'auth.admin.username') ?? 'admin',
        ];

        $filePath = storage_path('app/maintenance.json');
        $dir = dirname($filePath);
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        @file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT));
        Cache::forget('settings_maintenance_v1');
        Cache::forget('settings_bootstrap_v1');

        return response()->json([
            'success' => true,
            'enabled' => $enabled,
            'message' => $message,
            'updatedAt' => $data['updatedAt'],
        ]);
    }

    /**
     * Get current AI safety & moderation settings (Cached with ETag).
     */
    public function getModerationSettings(Request $request): \Illuminate\Http\Response|JsonResponse
    {
        $payload = Cache::remember('settings_moderation_v1', 300, function () {
            $filePath = storage_path('app/moderation_settings.json');
            if (file_exists($filePath)) {
                $data = json_decode(file_get_contents($filePath), true);
                if (is_array($data)) {
                    return [
                        'profanityFilter' => isset($data['profanityFilter']) ? (bool) $data['profanityFilter'] : true,
                        'aiSpotVerification' => isset($data['aiSpotVerification']) ? (bool) $data['aiSpotVerification'] : true,
                        'imageGuardian' => isset($data['imageGuardian']) ? (bool) $data['imageGuardian'] : true,
                        'updatedAt' => $data['updatedAt'] ?? null,
                    ];
                }
            }
            return [
                'profanityFilter' => true,
                'aiSpotVerification' => true,
                'imageGuardian' => true,
                'updatedAt' => null,
            ];
        });

        $etag = '"' . md5(json_encode($payload)) . '"';
        if ($request->header('If-None-Match') === $etag) {
            return response(null, 304)->header('ETag', $etag);
        }

        return response()->json($payload)
            ->header('ETag', $etag)
            ->header('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    }

    /**
     * Set AI safety & moderation settings (Admin protected).
     */
    public function setModerationSettings(Request $request): JsonResponse
    {
        $token = $request->header('X-Admin-Token') ?: $request->bearerToken();
        if (!$token || !self::isValidToken($token)) {
            return response()->json(['error' => 'Unauthorized. Administrator credentials required.'], 401);
        }

        $filePath = storage_path('app/moderation_settings.json');
        $existing = [];
        if (file_exists($filePath)) {
            $existing = json_decode(file_get_contents($filePath), true) ?: [];
        }

        $profanityFilter = $request->has('profanityFilter')
            ? (bool) $request->input('profanityFilter')
            : ($existing['profanityFilter'] ?? true);
        $aiSpotVerification = $request->has('aiSpotVerification')
            ? (bool) $request->input('aiSpotVerification')
            : ($existing['aiSpotVerification'] ?? true);
        $imageGuardian = $request->has('imageGuardian')
            ? (bool) $request->input('imageGuardian')
            : ($existing['imageGuardian'] ?? true);

        $data = [
            'profanityFilter' => $profanityFilter,
            'aiSpotVerification' => $aiSpotVerification,
            'imageGuardian' => $imageGuardian,
            'updatedAt' => date('c'),
            'updatedBy' => self::resolveAdminCredential('ADMIN_USERNAME', 'auth.admin.username') ?? 'admin',
        ];

        $dir = dirname($filePath);
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        @file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT));
        Cache::forget('settings_moderation_v1');
        Cache::forget('settings_bootstrap_v1');

        return response()->json([
            'success' => true,
            'settings' => $data,
            'message' => 'AI safety & moderation settings updated successfully.'
        ]);
    }

    /**
     * Get Book Fair Notice Banner configuration (Cached with ETag).
     */
    public function getNoticeBanner(Request $request): \Illuminate\Http\Response|JsonResponse
    {
        $payload = Cache::remember('settings_notice_v1', 300, function () {
            $filePath = storage_path('app/book_fair_notice.json');
            if (file_exists($filePath)) {
                $data = json_decode(file_get_contents($filePath), true);
                if (is_array($data)) {
                    if (!isset($data['showBadge'])) {
                        $data['showBadge'] = true;
                    }
                    return [
                        'success' => true,
                        'notice' => $data,
                    ];
                }
            }
            return [
                'success' => true,
                'notice' => [
                    'enabled' => true,
                    'message' => 'BMICH Fair Notice: Special discount stalls now open in Hall E! Check them out for exclusive deals.',
                    'badgeText' => 'FAIR NOTICE',
                    'showBadge' => true,
                    'theme' => 'orange',
                    'isTicker' => true,
                    'linkText' => 'View Stalls',
                    'linkUrl' => 'stalls',
                    'isClosable' => true,
                    'updatedAt' => date('c'),
                ],
            ];
        });

        $etag = '"' . md5(json_encode($payload)) . '"';
        if ($request->header('If-None-Match') === $etag) {
            return response(null, 304)->header('ETag', $etag);
        }

        return response()->json($payload)
            ->header('ETag', $etag)
            ->header('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    }

    /**
     * Set Book Fair Notice Banner configuration (Admin protected).
     */
    public function setNoticeBanner(Request $request): JsonResponse
    {
        $token = $request->header('X-Admin-Token') ?: $request->bearerToken();
        if (!$token || !self::isValidToken($token)) {
            return response()->json(['error' => 'Unauthorized. Administrator credentials required.'], 401);
        }

        $filePath = storage_path('app/book_fair_notice.json');
        $existing = [];
        if (file_exists($filePath)) {
            $existing = json_decode(file_get_contents($filePath), true) ?: [];
        }

        $enabled = $request->has('enabled') ? (bool) $request->input('enabled') : ($existing['enabled'] ?? true);
        $message = trim((string) $request->input('message', $existing['message'] ?? ''));
        $showBadge = $request->has('showBadge') ? (bool) $request->input('showBadge') : ($existing['showBadge'] ?? true);
        $badgeText = trim((string) $request->input('badgeText', $existing['badgeText'] ?? 'FAIR NOTICE'));
        $theme = trim((string) $request->input('theme', $existing['theme'] ?? 'orange'));
        $isTicker = $request->has('isTicker') ? (bool) $request->input('isTicker') : ($existing['isTicker'] ?? true);
        $linkText = trim((string) $request->input('linkText', $existing['linkText'] ?? ''));
        $linkUrl = trim((string) $request->input('linkUrl', $existing['linkUrl'] ?? ''));
        $isClosable = $request->has('isClosable') ? (bool) $request->input('isClosable') : ($existing['isClosable'] ?? true);

        $data = [
            'enabled' => $enabled,
            'message' => $message,
            'badgeText' => $badgeText,
            'showBadge' => $showBadge,
            'theme' => $theme,
            'isTicker' => $isTicker,
            'linkText' => $linkText,
            'linkUrl' => $linkUrl,
            'isClosable' => $isClosable,
            'updatedAt' => date('c'),
            'updatedBy' => self::resolveAdminCredential('ADMIN_USERNAME', 'auth.admin.username') ?? 'admin',
        ];

        $dir = dirname($filePath);
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        @file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT));
        Cache::forget('settings_notice_v1');
        Cache::forget('settings_bootstrap_v1');

        return response()->json([
            'success' => true,
            'notice' => $data,
            'message' => 'Book fair notice banner updated successfully.'
        ]);
    }

    /**
     * Run database migrations safely (Admin protected).
     */
    public function runMigrations(Request $request): JsonResponse
    {
        $token = $request->header('X-Admin-Token') ?: $request->bearerToken();
        if (!$token || !self::isValidToken($token)) {
            return response()->json(['error' => 'Unauthorized. Administrator credentials required.'], 401);
        }

        try {
            \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
            $output = \Illuminate\Support\Facades\Artisan::output();
            return response()->json([
                'success' => true,
                'message' => 'Migrations executed successfully.',
                'output' => $output
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Migration failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Consolidated system bootstrap: fetches maintenance, moderation, notice banner, and server metadata in a single call.
     * Replaces 3 independent HTTP polling requests with a single cached ETag response.
     */
    public function getBootstrapSettings(Request $request): \Illuminate\Http\Response|JsonResponse
    {
        $payload = Cache::remember('settings_bootstrap_v1', 120, function () {
            // 1. Maintenance status
            $mFilePath = storage_path('app/maintenance.json');
            $maintenance = [
                'enabled' => false,
                'message' => 'Platform is operating normally.',
                'updatedAt' => null,
            ];
            if (file_exists($mFilePath)) {
                $mData = json_decode(file_get_contents($mFilePath), true);
                if (is_array($mData)) {
                    $maintenance = [
                        'enabled' => !empty($mData['enabled']),
                        'message' => $mData['message'] ?? 'Platform is currently undergoing scheduled maintenance. Please check back shortly.',
                        'updatedAt' => $mData['updatedAt'] ?? null,
                    ];
                }
            }

            // 2. Moderation settings
            $modFilePath = storage_path('app/moderation_settings.json');
            $moderation = [
                'profanityFilter' => true,
                'aiSpotVerification' => true,
                'imageGuardian' => true,
                'updatedAt' => null,
            ];
            if (file_exists($modFilePath)) {
                $modData = json_decode(file_get_contents($modFilePath), true);
                if (is_array($modData)) {
                    $moderation = [
                        'profanityFilter' => isset($modData['profanityFilter']) ? (bool) $modData['profanityFilter'] : true,
                        'aiSpotVerification' => isset($modData['aiSpotVerification']) ? (bool) $modData['aiSpotVerification'] : true,
                        'imageGuardian' => isset($modData['imageGuardian']) ? (bool) $modData['imageGuardian'] : true,
                        'updatedAt' => $modData['updatedAt'] ?? null,
                    ];
                }
            }

            // 3. Notice banner
            $nFilePath = storage_path('app/book_fair_notice.json');
            $notice = [
                'enabled' => true,
                'message' => 'BMICH Fair Notice: Special discount stalls now open in Hall E! Check them out for exclusive deals.',
                'badgeText' => 'FAIR NOTICE',
                'showBadge' => true,
                'theme' => 'orange',
                'isTicker' => true,
                'linkText' => 'View Stalls',
                'linkUrl' => 'stalls',
                'isClosable' => true,
                'updatedAt' => date('c'),
            ];
            if (file_exists($nFilePath)) {
                $nData = json_decode(file_get_contents($nFilePath), true);
                if (is_array($nData)) {
                    $notice = [
                        'enabled' => isset($nData['enabled']) ? (bool) $nData['enabled'] : true,
                        'message' => $nData['message'] ?? '',
                        'badgeText' => $nData['badgeText'] ?? 'FAIR NOTICE',
                        'showBadge' => isset($nData['showBadge']) ? (bool) $nData['showBadge'] : true,
                        'theme' => $nData['theme'] ?? 'orange',
                        'isTicker' => isset($nData['isTicker']) ? (bool) $nData['isTicker'] : true,
                        'linkText' => $nData['linkText'] ?? '',
                        'linkUrl' => $nData['linkUrl'] ?? '',
                        'isClosable' => isset($nData['isClosable']) ? (bool) $nData['isClosable'] : true,
                        'updatedAt' => $nData['updatedAt'] ?? null,
                        'updatedBy' => $nData['updatedBy'] ?? 'admin',
                    ];
                }
            }

            return [
                'maintenance' => $maintenance,
                'moderation' => $moderation,
                'notice' => [
                    'success' => true,
                    'notice' => $notice
                ],
                'timestamp' => (int) round(microtime(true) * 1000),
            ];
        });

        $etag = '"' . md5(json_encode($payload)) . '"';
        if ($request->header('If-None-Match') === $etag) {
            return response(null, 304)->header('ETag', $etag);
        }

        return response()->json($payload)
            ->header('ETag', $etag)
            ->header('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    }
}



