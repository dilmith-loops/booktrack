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
}
