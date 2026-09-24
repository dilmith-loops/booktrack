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

        $mailResult = ['success' => false];
        if (!empty($user->email)) {
            $welcomeHtml = self::buildWelcomeEmailHtml($user->name, $user->email, $user->handle);
            $welcomePlain = "Hello {$user->name},\n\n" .
                "Welcome to Sampath Book Finder!\n\n" .
                "Your account has been registered successfully with email: {$user->email}\n" .
                "Handle: {$user->handle}\n\n" .
                "You can now explore live book spotters, track stall deals, and post book requests.\n\n" .
                "Visit: https://bookfairtracker.com/\n\n" .
                "Regards,\nSampath Book Finder Team";

            $mailResult = $this->sendBrandedEmail(
                $user->email,
                $user->name,
                'Welcome to Sampath Book Finder!',
                $welcomeHtml,
                $welcomePlain
            );
        }

        return response()->json([
            'success' => true,
            'user' => $user->toProfileArray(),
            'email_sent' => $mailResult['success'],
            'email_error' => $mailResult['error'] ?? null,
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

        $mailResult = ['success' => false];
        if (!empty($user->email)) {
            $otpHtml = self::buildOtpEmailHtml($user->name, $otp, 'One-Time Login Code');
            $otpPlain = "Hello {$user->name},\n\n" .
                "Your one-time verification code for Sampath Book Finder is: {$otp}\n\n" .
                "This code will expire in 15 minutes.\n\n" .
                "If you did not request this login code, please disregard this email.\n\n" .
                "Regards,\nSampath Book Finder Team";

            $mailResult = $this->sendBrandedEmail(
                $user->email,
                $user->name,
                'Your Verification Code: ' . $otp . ' - Sampath Book Finder',
                $otpHtml,
                $otpPlain
            );
        }

        $message = $mailResult['success']
            ? 'Verification code sent to your email (' . $user->email . ')'
            : 'Verification code generated for ' . $user->email;

        return response()->json([
            'success' => true,
            'message' => $message,
            'email_sent' => $mailResult['success'],
            'email_error' => $mailResult['error'] ?? null,
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

        $mailResult = ['success' => false];
        if (!empty($user->email)) {
            $resetHtml = self::buildPasswordResetEmailHtml($user->name, $otp);
            $resetPlain = "Hello {$user->name},\n\n" .
                "You requested a password reset for your Sampath Book Finder account.\n\n" .
                "Your password reset verification code is: {$otp}\n\n" .
                "This code will expire in 15 minutes.\n\n" .
                "If you did not request this password reset, please secure your account immediately.\n\n" .
                "Regards,\nSampath Book Finder Team";

            $mailResult = $this->sendBrandedEmail(
                $user->email,
                $user->name,
                'Password Reset Code: ' . $otp . ' - Sampath Book Finder',
                $resetHtml,
                $resetPlain
            );
        }

        $message = $mailResult['success']
            ? 'Password reset verification code sent to your email (' . $user->email . ')'
            : 'Password reset verification code generated for ' . $user->email;

        return response()->json([
            'success' => true,
            'message' => $message,
            'email_sent' => $mailResult['success'],
            'email_error' => $mailResult['error'] ?? null,
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

    /**
     * Diagnostic endpoint to test SMTP email delivery, try alternate ports/hosts, and run matrix tests.
     */
    public function testMail(Request $request): JsonResponse
    {
        $to = trim((string) $request->input('to', $request->query('to', '')));
        if (empty($to) || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
            return response()->json([
                'success' => false,
                'error' => 'Please provide a valid recipient email via ?to=your@email.com or in the request body.',
                'current_mail_config' => [
                    'mailer' => config('mail.default'),
                    'host' => config('mail.mailers.smtp.host'),
                    'port' => config('mail.mailers.smtp.port'),
                    'scheme' => config('mail.mailers.smtp.scheme'),
                    'username' => config('mail.mailers.smtp.username'),
                    'from' => config('mail.from'),
                ]
            ], 422);
        }

        $mode = $request->query('mode', $request->input('mode', ''));
        if ($mode === 'diagnose' || $mode === 'matrix') {
            return $this->runSmtpDiagnostics($to);
        }

        $requestedHost = $request->input('host', $request->query('host'));
        $requestedPort = $request->input('port', $request->query('port'));
        $requestedScheme = $request->input('scheme', $request->query('scheme'));
        $requestedMailer = $request->input('mailer', $request->query('mailer'));

        if (!empty($requestedHost) || !empty($requestedPort)) {
            $testPort = (int) ($requestedPort ?: 587);
            $testScheme = $requestedScheme ?: ($testPort === 465 ? 'smtps' : 'smtp');
            config([
                'mail.mailers.test_smtp' => [
                    'transport' => 'smtp',
                    'host' => $requestedHost ?: config('mail.mailers.smtp.host'),
                    'port' => $testPort,
                    'scheme' => $testScheme,
                    'username' => config('mail.mailers.smtp.username'),
                    'password' => config('mail.mailers.smtp.password'),
                    'timeout' => 10,
                    'verify_peer' => false,
                    'local_domain' => config('mail.mailers.smtp.local_domain'),
                ]
            ]);
            $requestedMailer = 'test_smtp';
        }

        $testCode = (string) mt_rand(100000, 999999);
        $subject = 'Sampath Book Finder - Delivery Test (' . $testCode . ')';
        $html = self::buildOtpEmailHtml('Tester', $testCode, 'Test Diagnostic Code');
        $plain = "Sampath Book Finder Diagnostic Test\nYour test code: {$testCode}\nSent at: " . now()->toIso8601String();

        $result = $this->sendBrandedEmail($to, 'Test Recipient', $subject, $html, $plain, $requestedMailer);

        return response()->json([
            'success' => $result['success'],
            'recipient' => $to,
            'mailer_used' => $result['mailer_used'] ?? 'none',
            'smtp_diagnostics' => [
                'default_mailer' => config('mail.default'),
                'requested_mailer' => $requestedMailer ?: '(auto)',
                'mailer_used' => $result['mailer_used'] ?? 'none',
                'host' => $requestedHost ?: config('mail.mailers.smtp.host'),
                'port' => $requestedPort ?: config('mail.mailers.smtp.port'),
                'scheme' => $requestedScheme ?: config('mail.mailers.smtp.scheme'),
                'encryption' => env('MAIL_ENCRYPTION'),
                'verify_peer' => config('mail.mailers.smtp.verify_peer'),
                'from_address' => config('mail.from.address'),
                'from_name' => config('mail.from.name'),
            ],
            'mail_result' => $result,
            'message' => $result['success']
                ? "Test email delivered successfully to {$to} via " . ($result['mailer_used'] ?? 'mailer') . "!"
                : "Delivery failed: " . ($result['error'] ?? 'Unknown error'),
            'timestamp' => now()->toIso8601String(),
        ], $result['success'] ? 200 : 500);
    }

    /**
     * Run detailed matrix diagnostics across available SMTP ports and host addresses.
     */
    protected function runSmtpDiagnostics(string $recipientEmail): JsonResponse
    {
        $smtpUser = config('mail.mailers.smtp.username');
        $smtpPass = config('mail.mailers.smtp.password');

        $candidates = [
            'smtp_587_tls' => [
                'name' => 'Host rs3-va on Port 587 (TLS/STARTTLS)',
                'host' => 'rs3-va.serverhostgroup.com',
                'port' => 587,
                'scheme' => 'smtp',
            ],
            'smtp_465_ssl' => [
                'name' => 'Host rs3-va on Port 465 (Direct SSL)',
                'host' => 'rs3-va.serverhostgroup.com',
                'port' => 465,
                'scheme' => 'smtps',
            ],
            'direct_ip_587' => [
                'name' => 'Direct IP 15.204.206.213 on Port 587 (TLS)',
                'host' => '15.204.206.213',
                'port' => 587,
                'scheme' => 'smtp',
            ],
            'server_sendmail' => [
                'name' => 'Server Native Sendmail (Exim)',
                'mailer' => 'sendmail',
            ],
        ];

        $results = [];
        $workingMethod = null;

        $subject = 'Sampath Book Finder - SMTP Matrix Test';
        $testCode = (string) mt_rand(100000, 999999);
        $html = self::buildOtpEmailHtml('Tester', $testCode, 'Diagnostic Matrix Code');
        $plain = "Diagnostic Matrix Test: {$testCode}";

        $dnsIp = gethostbyname('rs3-va.serverhostgroup.com');
        $serverHostname = gethostname() ?: 'unknown';

        foreach ($candidates as $key => $target) {
            $t1 = microtime(true);
            try {
                if (isset($target['mailer']) && $target['mailer'] === 'sendmail') {
                    Mail::mailer('sendmail')->html($html, function ($message) use ($recipientEmail, $subject, $plain) {
                        $message->to($recipientEmail)
                                ->from(config('mail.from.address'), config('mail.from.name'))
                                ->subject($subject . ' [via Sendmail]')
                                ->text($plain);
                    });

                    $elapsed = round((microtime(true) - $t1) * 1000);
                    $results[$key] = [
                        'status' => 'SUCCESS',
                        'time_ms' => $elapsed,
                        'message' => 'Email delivered successfully via sendmail',
                    ];
                    if (!$workingMethod) $workingMethod = $target;
                    continue;
                }

                config([
                    "mail.mailers.matrix_{$key}" => [
                        'transport' => 'smtp',
                        'host' => $target['host'],
                        'port' => $target['port'],
                        'scheme' => $target['scheme'],
                        'username' => $smtpUser,
                        'password' => $smtpPass,
                        'timeout' => 8,
                        'verify_peer' => false,
                        'local_domain' => config('mail.mailers.smtp.local_domain'),
                    ]
                ]);

                Mail::mailer("matrix_{$key}")->html($html, function ($message) use ($recipientEmail, $subject, $plain, $target) {
                    $message->to($recipientEmail)
                            ->from(config('mail.from.address'), config('mail.from.name'))
                            ->subject($subject . " [via {$target['host']}:{$target['port']}]")
                            ->text($plain);
                });

                $elapsed = round((microtime(true) - $t1) * 1000);
                $results[$key] = [
                    'status' => 'SUCCESS',
                    'time_ms' => $elapsed,
                    'message' => "Delivered in {$elapsed}ms!",
                ];
                if (!$workingMethod) $workingMethod = $target;
            } catch (\Throwable $e) {
                $elapsed = round((microtime(true) - $t1) * 1000);
                $results[$key] = [
                    'status' => 'FAILED',
                    'time_ms' => $elapsed,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'diagnostic_summary' => [
                'server_hostname' => $serverHostname,
                'rs3_va_dns_lookup' => $dnsIp,
                'recipient' => $recipientEmail,
            ],
            'matrix_results' => $results,
            'recommended_env' => $workingMethod && isset($workingMethod['port']) ? [
                'MAIL_MAILER' => 'smtp',
                'MAIL_HOST' => $workingMethod['host'],
                'MAIL_PORT' => $workingMethod['port'],
                'MAIL_SCHEME' => $workingMethod['scheme'],
                'MAIL_ENCRYPTION' => $workingMethod['scheme'] === 'smtps' ? 'ssl' : 'tls',
                'MAIL_VERIFY_PEER' => 'false',
            ] : [
                'MAIL_MAILER' => 'sendmail',
                'MAIL_FROM_ADDRESS' => config('mail.from.address'),
                'MAIL_FROM_NAME' => config('mail.from.name'),
            ],
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Send a branded HTML email with plain-text fallback, with automatic sendmail fallback.
     */
    protected function sendBrandedEmail(string $recipientEmail, string $recipientName, string $subject, string $htmlBody, string $plainTextBody, ?string $preferredMailer = null): array
    {
        if (empty($recipientEmail) || !filter_var($recipientEmail, FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'error' => 'Invalid recipient email address.'];
        }

        $fromAddress = config('mail.from.address') ?: env('MAIL_FROM_ADDRESS', 'webmaster@loops.lk');
        $fromName = config('mail.from.name') ?: env('MAIL_FROM_NAME', 'Sampath Book Finder');

        $primaryMailer = $preferredMailer ?: config('mail.default', 'smtp');

        // 1. Attempt dispatch using primary mailer (e.g. SMTP)
        try {
            Mail::mailer($primaryMailer)->html($htmlBody, function ($message) use ($recipientEmail, $recipientName, $subject, $plainTextBody, $fromAddress, $fromName) {
                $message->to($recipientEmail, $recipientName ?: null)
                        ->from($fromAddress, $fromName)
                        ->subject($subject)
                        ->text($plainTextBody);
            });

            return ['success' => true, 'mailer_used' => $primaryMailer];
        } catch (\Throwable $e) {
            $primaryError = $e->getMessage();
            Log::warning("Primary mailer ({$primaryMailer}) failed to {$recipientEmail}: {$primaryError}. Attempting failover...");

            // 2. If primary was not sendmail, automatically fall back to local sendmail (Exim)
            if ($primaryMailer !== 'sendmail') {
                try {
                    Mail::mailer('sendmail')->html($htmlBody, function ($message) use ($recipientEmail, $recipientName, $subject, $plainTextBody, $fromAddress, $fromName) {
                        $message->to($recipientEmail, $recipientName ?: null)
                                ->from($fromAddress, $fromName)
                                ->subject($subject)
                                ->text($plainTextBody);
                    });

                    Log::info("Failover to sendmail succeeded for {$recipientEmail}");
                    return [
                        'success' => true,
                        'mailer_used' => 'sendmail',
                        'notice' => "Delivered via server sendmail (SMTP attempt: {$primaryError})"
                    ];
                } catch (\Throwable $sendmailEx) {
                    Log::error("Sendmail fallback also failed to {$recipientEmail}: " . $sendmailEx->getMessage());
                }
            }

            return ['success' => false, 'error' => $primaryError];
        }
    }

    /**
     * Generate HTML template for Account Registration Welcome email.
     */
    protected static function buildWelcomeEmailHtml(string $name, string $email, string $handle): string
    {
        $safeName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
        $safeEmail = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
        $safeHandle = htmlspecialchars($handle, ENT_QUOTES, 'UTF-8');

        $content = <<<HTML
<p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #0f172a;">Hello {$safeName},</p>
<p style="margin: 0 0 16px 0;">Welcome to <strong>Sampath Book Finder</strong>! Your spotter account has been created successfully.</p>
<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin: 20px 0;">
  <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #0f172a;">Your Spotter Profile:</p>
  <p style="margin: 0 0 4px 0; font-size: 14px; color: #475569;">Email: <strong style="color: #0f172a;">{$safeEmail}</strong></p>
  <p style="margin: 0; font-size: 14px; color: #475569;">Community Handle: <strong style="color: #f26522;">{$safeHandle}</strong></p>
</div>
<p style="margin: 0 0 12px 0; font-weight: 600; color: #0f172a;">Start exploring now:</p>
<ul style="margin: 0 0 24px 0; padding-left: 20px; color: #475569;">
  <li style="margin-bottom: 8px;">Explore <strong>live spottings</strong> across Sirimavo Bandaranaike & Main Exhibition Halls.</li>
  <li style="margin-bottom: 8px;">Filter stalls offering <strong>exclusive Sampath Cardholder discounts</strong>.</li>
  <li style="margin-bottom: 8px;">Post your book wishlist and receive <strong>instant notifications</strong> when fellow visitors spot your title.</li>
</ul>
<div style="text-align: center; margin: 28px 0 16px 0;">
  <a href="https://bookfairtracker.com/" style="display: inline-block; background-color: #f26522; color: #ffffff; text-decoration: none; padding: 14px 32px; font-weight: 700; border-radius: 10px; font-size: 15px; box-shadow: 0 4px 12px rgba(242,101,34,0.35);">Open Sampath Book Finder &rarr;</a>
</div>
HTML;

        return self::wrapInEmailLayout('Welcome to Sampath Book Finder', $content);
    }

    /**
     * Generate HTML template for One-Time Login Code email.
     */
    protected static function buildOtpEmailHtml(string $name, string $otp, string $purpose = 'One-Time Verification Code'): string
    {
        $safeName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
        $safePurpose = htmlspecialchars($purpose, ENT_QUOTES, 'UTF-8');
        $safeOtp = htmlspecialchars($otp, ENT_QUOTES, 'UTF-8');

        $content = <<<HTML
<p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #0f172a;">Hello {$safeName},</p>
<p style="margin: 0 0 16px 0;">Use the one-time verification code below to log into your <strong>Sampath Book Finder</strong> account:</p>
<div style="background-color: #fff7ed; border: 2px dashed #f97316; border-radius: 12px; padding: 24px 16px; margin: 24px 0; text-align: center;">
  <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #c2410c; font-weight: 700; display: block; margin-bottom: 8px;">{$safePurpose}</span>
  <span style="font-size: 38px; font-weight: 800; color: #ea580c; letter-spacing: 12px; font-family: 'Courier New', Courier, monospace; display: block; padding-left: 12px;">{$safeOtp}</span>
  <span style="font-size: 12px; color: #9a3412; display: block; margin-top: 10px;">Expires in 15 minutes &bull; Do not share this code with anyone</span>
</div>
<p style="margin: 0 0 12px 0; color: #64748b; font-size: 13px;">If you did not request this verification code, please ignore this email or reach out to event desk.</p>
HTML;

        return self::wrapInEmailLayout('Your Verification Code', $content);
    }

    /**
     * Generate HTML template for Password Reset email.
     */
    protected static function buildPasswordResetEmailHtml(string $name, string $otp): string
    {
        $safeName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
        $safeOtp = htmlspecialchars($otp, ENT_QUOTES, 'UTF-8');

        $content = <<<HTML
<p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #0f172a;">Hello {$safeName},</p>
<p style="margin: 0 0 16px 0;">We received a request to reset the password for your <strong>Sampath Book Finder</strong> spotter account.</p>
<div style="background-color: #fff7ed; border: 2px dashed #f97316; border-radius: 12px; padding: 24px 16px; margin: 24px 0; text-align: center;">
  <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #c2410c; font-weight: 700; display: block; margin-bottom: 8px;">Password Reset Code</span>
  <span style="font-size: 38px; font-weight: 800; color: #ea580c; letter-spacing: 12px; font-family: 'Courier New', Courier, monospace; display: block; padding-left: 12px;">{$safeOtp}</span>
  <span style="font-size: 12px; color: #9a3412; display: block; margin-top: 10px;">Expires in 15 minutes &bull; Use this code on the reset password screen</span>
</div>
<p style="margin: 0 0 12px 0; color: #64748b; font-size: 13px;">If you did not request a password reset, you can safely ignore this email. Your existing password will remain secure and unchanged.</p>
HTML;

        return self::wrapInEmailLayout('Reset Your Password', $content);
    }

    /**
     * Common responsive email wrapper with Sampath Bank styling.
     */
    protected static function wrapInEmailLayout(string $title, string $bodyContent): string
    {
        $safeTitle = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{$safeTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 26px 32px; text-align: left; border-bottom: 4px solid #f26522;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: #f26522; color: #ffffff; font-weight: 800; font-size: 11px; padding: 3px 8px; border-radius: 5px; letter-spacing: 0.8px; text-transform: uppercase;">BMICH 2026</span>
                    <h1 style="margin: 8px 0 0 0; color: #ffffff; font-size: 20px; font-weight: 700; line-height: 1.2;">Sampath Book Finder</h1>
                    <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px;">Colombo International Book Fair Community Companion</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 24px 32px; color: #334155; font-size: 15px; line-height: 1.6;">
              {$bodyContent}
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; color: #64748b; font-size: 12px; line-height: 1.5;">
              <p style="margin: 0 0 6px 0; font-weight: 700; color: #334155;">Sampath Book Finder &bull; Colombo International Book Fair 2026</p>
              <p style="margin: 0 0 8px 0; color: #64748b;">Powered by Sampath Bank &bull; BMICH Colombo</p>
              <p style="margin: 0;"><a href="https://bookfairtracker.com/" style="color: #f26522; text-decoration: none; font-weight: 600;">https://bookfairtracker.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }
}
