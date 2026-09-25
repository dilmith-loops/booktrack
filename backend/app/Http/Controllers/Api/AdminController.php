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

        $expectedUser = env('ADMIN_USERNAME');
        $expectedPass = env('ADMIN_PASSWORD');

        if (empty($expectedUser) || empty($expectedPass) || $username !== $expectedUser || !hash_equals($expectedPass, $password)) {
            return response()->json([
                'error' => 'Invalid administrative credentials.'
            ], 401);
        }

        $payload = [
            'admin' => $username,
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
                'username' => $username,
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
            'username' => env('ADMIN_USERNAME', 'admin')
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

        if ($data['admin'] !== env('ADMIN_USERNAME', 'admin')) {
            return false;
        }

        // Token valid for 24 hours
        if ((time() - $data['time']) > (86400 * 1)) {
            return false;
        }

        return true;
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
            'updatedBy' => env('ADMIN_USERNAME', 'admin'),
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
            'updatedBy' => env('ADMIN_USERNAME', 'admin'),
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


