<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    /**
     * Authenticate Admin using username & password.
     */
    public function login(Request $request): JsonResponse
    {
        $username = trim((string) $request->input('username', ''));
        $password = (string) $request->input('password', '');

        $expectedUser = config('auth.admin.username') ?: env('ADMIN_USERNAME');
        $expectedPass = config('auth.admin.password') ?: env('ADMIN_PASSWORD');

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
            'username' => config('auth.admin.username') ?: env('ADMIN_USERNAME')
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

        $expectedUser = config('auth.admin.username') ?: env('ADMIN_USERNAME');
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
     * Unified system settings endpoint to reduce HTTP overhead on client boot.
     */
    public function getAllSettings(): JsonResponse
    {
        $maintenance = [
            'enabled' => false,
            'message' => 'Platform is operating normally.',
            'updatedAt' => null,
        ];
        $mPath = storage_path('app/maintenance.json');
        if (file_exists($mPath)) {
            $mData = json_decode(file_get_contents($mPath), true);
            if (is_array($mData)) {
                $maintenance = [
                    'enabled' => !empty($mData['enabled']),
                    'message' => $mData['message'] ?? 'Platform is currently undergoing scheduled maintenance. Please check back shortly.',
                    'updatedAt' => $mData['updatedAt'] ?? null,
                ];
            }
        }

        $moderation = [
            'profanityFilter' => true,
            'aiSpotVerification' => true,
            'imageGuardian' => true,
            'updatedAt' => null,
        ];
        $modPath = storage_path('app/moderation_settings.json');
        if (file_exists($modPath)) {
            $modData = json_decode(file_get_contents($modPath), true);
            if (is_array($modData)) {
                $moderation = [
                    'profanityFilter' => isset($modData['profanityFilter']) ? (bool) $modData['profanityFilter'] : true,
                    'aiSpotVerification' => isset($modData['aiSpotVerification']) ? (bool) $modData['aiSpotVerification'] : true,
                    'imageGuardian' => isset($modData['imageGuardian']) ? (bool) $modData['imageGuardian'] : true,
                    'updatedAt' => $modData['updatedAt'] ?? null,
                ];
            }
        }

        $notice = [
            'id' => 'cibf-welcome-2026',
            'message' => 'Welcome to Colombo International Book Fair 2026 at BMICH! Spot books, enjoy 20% Sampath cardholder discounts, and locate rare titles across all halls.',
            'type' => 'info',
            'active' => true,
            'dismissible' => true,
            'updatedAt' => '2026-09-24T00:00:00.000Z',
        ];
        $nPath = storage_path('app/notice_banner.json');
        if (file_exists($nPath)) {
            $nData = json_decode(file_get_contents($nPath), true);
            if (is_array($nData)) {
                $notice = $nData;
            }
        }

        return response()->json([
            'maintenance' => $maintenance,
            'moderation' => $moderation,
            'notice' => $notice,
        ]);
    }

    /**
     * Get current maintenance mode status.
     */
    public function getMaintenanceStatus(): JsonResponse
    {
        $filePath = storage_path('app/maintenance.json');
        if (file_exists($filePath)) {
            $data = json_decode(file_get_contents($filePath), true);
            if (is_array($data)) {
                return response()->json([
                    'enabled' => !empty($data['enabled']),
                    'message' => $data['message'] ?? 'Platform is currently undergoing scheduled maintenance. Please check back shortly.',
                    'updatedAt' => $data['updatedAt'] ?? null,
                ]);
            }
        }

        return response()->json([
            'enabled' => false,
            'message' => 'Platform is operating normally.',
            'updatedAt' => null,
        ]);
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
            'updatedBy' => config('auth.admin.username', 'admin'),
        ];

        $filePath = storage_path('app/maintenance.json');
        $dir = dirname($filePath);
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        @file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT));

        return response()->json([
            'success' => true,
            'enabled' => $enabled,
            'message' => $message,
            'updatedAt' => $data['updatedAt'],
        ]);
    }

    /**
     * Get current AI safety & moderation settings.
     */
    public function getModerationSettings(): JsonResponse
    {
        $filePath = storage_path('app/moderation_settings.json');
        if (file_exists($filePath)) {
            $data = json_decode(file_get_contents($filePath), true);
            if (is_array($data)) {
                return response()->json([
                    'profanityFilter' => isset($data['profanityFilter']) ? (bool) $data['profanityFilter'] : true,
                    'aiSpotVerification' => isset($data['aiSpotVerification']) ? (bool) $data['aiSpotVerification'] : true,
                    'imageGuardian' => isset($data['imageGuardian']) ? (bool) $data['imageGuardian'] : true,
                    'updatedAt' => $data['updatedAt'] ?? null,
                ]);
            }
        }

        return response()->json([
            'profanityFilter' => true,
            'aiSpotVerification' => true,
            'imageGuardian' => true,
            'updatedAt' => null,
        ]);
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
            'updatedBy' => config('auth.admin.username', 'admin'),
        ];

        $dir = dirname($filePath);
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        @file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT));

        return response()->json([
            'success' => true,
            'settings' => $data,
            'message' => 'AI safety & moderation settings updated successfully.'
        ]);
    }

    /**
     * Get Book Fair Notice Banner configuration.
     */
    public function getNoticeBanner(): JsonResponse
    {
        $filePath = storage_path('app/book_fair_notice.json');
        if (file_exists($filePath)) {
            $data = json_decode(file_get_contents($filePath), true);
            if (is_array($data)) {
                if (!isset($data['showBadge'])) {
                    $data['showBadge'] = true;
                }
                return response()->json([
                    'success' => true,
                    'notice' => $data,
                ]);
            }
        }

        return response()->json([
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
        ]);
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
            'updatedBy' => config('auth.admin.username', 'admin'),
        ];

        $dir = dirname($filePath);
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        @file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT));

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
}


