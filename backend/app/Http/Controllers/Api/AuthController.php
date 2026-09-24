<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Extract client IP address respecting reverse proxies (Cloudflare, LiteSpeed, Nginx).
     */
    public static function resolveClientIp(Request $request): ?string
    {
        $headers = [
            'CF-Connecting-IP',
            'X-Forwarded-For',
            'X-Real-IP',
        ];

        foreach ($headers as $header) {
            $val = $request->header($header);
            if (!empty($val)) {
                // X-Forwarded-For may contain multiple comma-separated IPs: client, proxy1, proxy2
                if (str_contains($val, ',')) {
                    $parts = explode(',', $val);
                    $clientIp = trim($parts[0]);
                } else {
                    $clientIp = trim($val);
                }

                if (filter_var($clientIp, FILTER_VALIDATE_IP)) {
                    return $clientIp;
                }
            }
        }

        $ip = $request->ip() ?: ($request->server('REMOTE_ADDR') ?? null);
        if ($ip && filter_var($ip, FILTER_VALIDATE_IP)) {
            return $ip;
        }

        return $ip ?: null;
    }

    /**
     * Register a new community visitor / spotter.
     */
    public function register(Request $request): JsonResponse
    {
        $name = trim((string) $request->input('name'));
        $email = strtolower(trim((string) $request->input('email')));
        $phone = trim((string) $request->input('phone'));
        $password = (string) $request->input('password');
        $isSampathCardholder = filter_var($request->input('isSampathCardholder', false), FILTER_VALIDATE_BOOLEAN);

        // Validation
        if (mb_strlen($name) < 2) {
            return response()->json(['error' => 'Please enter your full name (minimum 2 characters).'], 422);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['error' => 'Please provide a valid email address.'], 422);
        }

        if (User::where('email', $email)->exists()) {
            return response()->json([
                'error' => 'An account with this email already exists. Please log in instead.'
            ], 409);
        }

        if (mb_strlen($phone) < 9) {
            return response()->json(['error' => 'Please provide a valid mobile phone number.'], 422);
        }

        if (mb_strlen($password) < 6) {
            return response()->json(['error' => 'Password must be at least 6 characters.'], 422);
        }

        // Generate clean unique handle
        $baseHandle = '@' . Str::slug($name, '_');
        if (strlen($baseHandle) > 20) {
            $baseHandle = substr($baseHandle, 0, 20);
        }
        $handle = $baseHandle;
        $counter = 1;
        while (User::where('handle', $handle)->exists()) {
            $handle = $baseHandle . $counter;
            $counter++;
        }

        $clientIp = self::resolveClientIp($request);

        // Create user
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'handle' => $handle,
            'is_sampath_cardholder' => $isSampathCardholder,
            'ip_address' => $clientIp,
            'password' => Hash::make($password),
        ]);

        if (!empty($user->email)) {
            try {
                Mail::raw(
                    "Hello {$user->name},\n\n" .
                    "Welcome to Sampath Book Finder!\n\n" .
                    "Your account has been registered successfully with email: {$user->email}\n" .
                    "Handle: {$user->handle}\n\n" .
                    "You can now explore live book spotters, track stall deals, and post book requests.\n\n" .
                    "Regards,\nSampath Book Finder Team",
                    function ($message) use ($user) {
                        $message->to($user->email)
                                ->subject('Welcome to Sampath Book Finder!');
                    }
                );
            } catch (\Throwable $e) {
                Log::error('Failed to send welcome email: ' . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'user' => $user->toProfileArray(),
            'message' => 'Registration complete! Welcome to Sampath Book Finder.'
        ], 201);
    }

    /**
     * Authenticate a recurring user via Email or Phone + Password.
     */
    public function login(Request $request): JsonResponse
    {
        $identifier = strtolower(trim((string) $request->input('identifier', $request->input('email', ''))));
        $password = (string) $request->input('password');

        if ($identifier === '' || $password === '') {
            return response()->json(['error' => 'Please enter your registered email/phone and password.'], 422);
        }

        // Search by email, phone, or handle
        $user = User::where('email', $identifier)
            ->orWhere('phone', $identifier)
            ->orWhere('handle', $identifier)
            ->first();

        if (!$user) {
            return response()->json([
                'error' => 'No account found with this email or phone. Please register to continue.'
            ], 404);
        }

        if ($user->is_disabled) {
            return response()->json([
                'error' => 'Your spotter account has been disabled or suspended by an administrator. Please contact event desk.'
            ], 403);
        }

        if (!Hash::check($password, $user->password)) {
            return response()->json([
                'error' => 'Invalid password. Please check your credentials or use Forgot Password.'
            ], 401);
        }

        // Backfill IP if not previously set
        if (empty($user->ip_address)) {
            $clientIp = self::resolveClientIp($request);
            if ($clientIp) {
                $user->ip_address = $clientIp;
                $user->save();
            }
        }

        return response()->json([
            'success' => true,
            'user' => $user->toProfileArray(),
            'message' => 'Welcome back, ' . $user->name . '!'
        ]);
    }

    /**
     * Request a one-time login OTP (sent to email/phone).
     */
    public function requestOtp(Request $request): JsonResponse
    {
        $identifier = strtolower(trim((string) $request->input('identifier', $request->input('email', ''))));

        if ($identifier === '') {
            return response()->json(['error' => 'Please enter your registered email or phone.'], 422);
        }

        $user = User::where('email', $identifier)
            ->orWhere('phone', $identifier)
            ->first();

        if (!$user) {
            return response()->json([
                'error' => 'Account not found. Please register first.'
            ], 404);
        }

        if ($user->is_disabled) {
            return response()->json([
                'error' => 'Your spotter account has been disabled by an administrator.'
            ], 403);
        }

        // Generate 6-digit OTP
        $otp = (string) mt_rand(100000, 999999);
        $user->otp_code = $otp;
        $user->otp_expires_at = now()->addMinutes(15);
        $user->save();

        if (!empty($user->email)) {
            try {
                Mail::raw(
                    "Hello {$user->name},\n\n" .
                    "Your one-time verification code for Sampath Book Finder is: {$otp}\n\n" .
                    "This code will expire in 15 minutes.\n\n" .
                    "If you did not request this login code, please disregard this email.\n\n" .
                    "Regards,\nSampath Book Finder Team",
                    function ($message) use ($user) {
                        $message->to($user->email)
                                ->subject('Your Verification Code - Sampath Book Finder');
                    }
                );
            } catch (\Throwable $e) {
                Log::error('Failed to send OTP email: ' . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Verification code sent to ' . $user->email,
            'otp' => $otp // Provided for instant offline & local testing
        ]);
    }

    /**
     * Verify OTP and log user in.
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $identifier = strtolower(trim((string) $request->input('identifier', $request->input('email', ''))));
        $otp = trim((string) $request->input('otp'));

        if ($identifier === '' || $otp === '') {
            return response()->json(['error' => 'Please provide your email/phone and the 6-digit OTP code.'], 422);
        }

        $user = User::where('email', $identifier)
            ->orWhere('phone', $identifier)
            ->first();

        if (!$user || $user->otp_code !== $otp) {
            return response()->json(['error' => 'Invalid verification code.'], 401);
        }

        if ($user->is_disabled) {
            return response()->json([
                'error' => 'Your spotter account has been disabled by an administrator.'
            ], 403);
        }

        if ($user->otp_expires_at && $user->otp_expires_at->isPast()) {
            return response()->json(['error' => 'Verification code has expired. Please request a new code.'], 401);
        }

        // Clear OTP on successful authentication
        $user->otp_code = null;
        $user->otp_expires_at = null;
        if (empty($user->ip_address)) {
            $clientIp = self::resolveClientIp($request);
            if ($clientIp) {
                $user->ip_address = $clientIp;
            }
        }
        $user->save();

        return response()->json([
            'success' => true,
            'user' => $user->toProfileArray(),
            'message' => 'Identity verified! Welcome back, ' . $user->name . '.'
        ]);
    }

    /**
     * Initiate password reset via email OTP.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $email = strtolower(trim((string) $request->input('email')));

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['error' => 'Please enter a valid registered email address.'], 422);
        }

        $user = User::where('email', $email)->first();
        if (!$user) {
            return response()->json([
                'error' => 'No registered account found with this email address.'
            ], 404);
        }

        $otp = (string) mt_rand(100000, 999999);
        $user->otp_code = $otp;
        $user->otp_expires_at = now()->addMinutes(15);
        $user->save();

        if (!empty($user->email)) {
            try {
                Mail::raw(
                    "Hello {$user->name},\n\n" .
                    "You requested a password reset for your Sampath Book Finder account.\n\n" .
                    "Your password reset verification code is: {$otp}\n\n" .
                    "This code will expire in 15 minutes.\n\n" .
                    "If you did not request this password reset, please secure your account immediately.\n\n" .
                    "Regards,\nSampath Book Finder Team",
                    function ($message) use ($user) {
                        $message->to($user->email)
                                ->subject('Password Reset Code - Sampath Book Finder');
                    }
                );
            } catch (\Throwable $e) {
                Log::error('Failed to send password reset email: ' . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Password reset verification code sent to ' . $user->email,
            'otp' => $otp
        ]);
    }

    /**
     * Confirm password reset with OTP.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $email = strtolower(trim((string) $request->input('email')));
        $otp = trim((string) $request->input('otp'));
        $newPassword = (string) $request->input('newPassword');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['error' => 'Invalid email address.'], 422);
        }

        if (mb_strlen($newPassword) < 6) {
            return response()->json(['error' => 'New password must be at least 6 characters.'], 422);
        }

        $user = User::where('email', $email)->first();
        if (!$user || $user->otp_code !== $otp) {
            return response()->json(['error' => 'Invalid verification code.'], 401);
        }

        if ($user->otp_expires_at && $user->otp_expires_at->isPast()) {
            return response()->json(['error' => 'Verification code expired.'], 401);
        }

        $user->password = Hash::make($newPassword);
        $user->otp_code = null;
        $user->otp_expires_at = null;
        $user->save();

        return response()->json([
            'success' => true,
            'user' => $user->toProfileArray(),
            'message' => 'Password updated successfully! You are now logged in.'
        ]);
    }

    /**
     * Update user profile details (Name, email, phone, cardholder status, optional password).
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $id = $request->input('id');
        $handle = $request->input('handle');
        $currentEmail = $request->input('currentEmail');

        $user = null;
        if (!empty($id)) {
            $user = User::find($id);
        }
        if (!$user && !empty($handle)) {
            $user = User::where('handle', $handle)->first();
        }
        if (!$user && !empty($currentEmail)) {
            $user = User::where('email', $currentEmail)->first();
        }

        if (!$user) {
            return response()->json(['error' => 'User account not found.'], 404);
        }

        $name = trim((string) $request->input('name', $user->name));
        $email = strtolower(trim((string) $request->input('email', $user->email)));
        $phone = trim((string) $request->input('phone', $user->phone));
        $isSampathCardholder = $request->has('isSampathCardholder')
            ? filter_var($request->input('isSampathCardholder'), FILTER_VALIDATE_BOOLEAN)
            : (bool) $user->is_sampath_cardholder;
        $newPassword = (string) $request->input('newPassword');

        if (mb_strlen($name) < 2) {
            return response()->json(['error' => 'Full name must be at least 2 characters.'], 422);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['error' => 'Please provide a valid email address.'], 422);
        }

        // Check if email changed and is taken by another user
        if ($email !== strtolower($user->email) && User::where('email', $email)->where('id', '!=', $user->id)->exists()) {
            return response()->json(['error' => 'This email address is already in use by another account.'], 409);
        }

        if (mb_strlen($phone) < 9) {
            return response()->json(['error' => 'Please provide a valid mobile phone number.'], 422);
        }

        if (!empty($newPassword)) {
            if (mb_strlen($newPassword) < 6) {
                return response()->json(['error' => 'New password must be at least 6 characters.'], 422);
            }
            $user->password = Hash::make($newPassword);
        }

        if ($user->is_disabled) {
            return response()->json([
                'error' => 'Your spotter account has been disabled by an administrator.',
                'isDisabled' => true
            ], 403);
        }

        $user->name = $name;
        $user->email = $email;
        $user->phone = $phone;
        $user->is_sampath_cardholder = $isSampathCardholder;
        $user->save();

        return response()->json([
            'success' => true,
            'user' => $user->toProfileArray(),
            'message' => 'Profile details updated successfully!'
        ]);
    }

    /**
     * Check current spotter account status (Active / Disabled).
     */
    public function checkStatus(Request $request): JsonResponse
    {
        $id = $request->input('id');
        $rawHandle = trim((string) $request->input('handle', ''));
        $email = strtolower(trim((string) $request->input('email', '')));

        $user = null;
        if (!empty($id)) {
            $user = User::find($id);
        }
        if (!$user && !empty($rawHandle)) {
            $formattedHandle = str_starts_with($rawHandle, '@') ? $rawHandle : '@' . $rawHandle;
            $user = User::where('handle', $formattedHandle)->first();
        }
        if (!$user && !empty($email)) {
            $user = User::where('email', $email)->first();
        }

        if (!$user) {
            return response()->json([
                'found' => false,
                'isDisabled' => true,
                'error' => 'Account not found.'
            ], 404);
        }

        if ($user->is_disabled) {
            return response()->json([
                'found' => true,
                'isDisabled' => true,
                'user' => $user->toProfileArray(),
                'error' => 'Your spotter account has been disabled by an administrator.'
            ], 403);
        }

        return response()->json([
            'found' => true,
            'isDisabled' => false,
            'user' => $user->toProfileArray()
        ]);
    }
}
