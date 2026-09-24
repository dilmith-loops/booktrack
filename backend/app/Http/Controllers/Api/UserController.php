<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserController extends Controller
{
    /**
     * Helper to authenticate admin token.
     */
    protected function checkAdminAuth(Request $request): bool
    {
        $token = $request->header('X-Admin-Token') ?: $request->bearerToken();
        return AdminController::isValidToken($token);
    }

    /**
     * Get all registered users (Protected by Admin Token).
     */
    public function index(Request $request): JsonResponse
    {
        if (!$this->checkAdminAuth($request)) {
            return response()->json([
                'error' => 'Unauthorized. Admin credentials required to view user registry.'
            ], 401);
        }

        $users = User::latest()->get()->map(function (User $user) {
            return $user->toProfileArray();
        });

        return response()->json([
            'success' => true,
            'count' => $users->count(),
            'users' => $users
        ]);
    }

    /**
     * Get single user.
     */
    public function show(Request $request, int|string $id): JsonResponse
    {
        if (!$this->checkAdminAuth($request)) {
            return response()->json(['error' => 'Unauthorized.'], 401);
        }

        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        return response()->json([
            'success' => true,
            'user' => $user->toProfileArray()
        ]);
    }

    /**
     * Create a new user from Admin panel.
     */
    public function store(Request $request): JsonResponse
    {
        if (!$this->checkAdminAuth($request)) {
            return response()->json(['error' => 'Unauthorized.'], 401);
        }

        $name = trim((string) $request->input('name'));
        $email = strtolower(trim((string) $request->input('email')));
        $phone = trim((string) $request->input('phone'));
        $rawHandle = trim((string) $request->input('handle'));
        $password = (string) $request->input('password', 'SampathUser@2026');
        $isSampathCardholder = filter_var($request->input('isSampathCardholder', false), FILTER_VALIDATE_BOOLEAN);

        if (mb_strlen($name) < 2) {
            return response()->json(['error' => 'Full name must be at least 2 characters.'], 422);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['error' => 'Please provide a valid email address.'], 422);
        }

        if (User::where('email', $email)->exists()) {
            return response()->json(['error' => 'An account with this email already exists.'], 409);
        }

        if (mb_strlen($phone) < 9) {
            return response()->json(['error' => 'Please provide a valid mobile number (min 9 digits).'], 422);
        }

        // Generate or clean handle
        if (!empty($rawHandle)) {
            $handle = str_starts_with($rawHandle, '@') ? $rawHandle : '@' . $rawHandle;
        } else {
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
        }

        $explicitIp = trim((string) $request->input('ipAddress', ''));
        $clientIp = $explicitIp ?: AuthController::resolveClientIp($request);
        $isDisabled = filter_var($request->input('isDisabled', $request->input('is_disabled', false)), FILTER_VALIDATE_BOOLEAN);

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'handle' => $handle,
            'is_sampath_cardholder' => $isSampathCardholder,
            'is_disabled' => $isDisabled,
            'ip_address' => $clientIp,
            'password' => Hash::make($password ?: 'SampathUser@2026')
        ]);

        return response()->json([
            'success' => true,
            'user' => $user->toProfileArray(),
            'message' => 'Community spotter created successfully!'
        ], 201);
    }

    /**
     * Update user details from Admin panel.
     */
    public function update(Request $request, int|string $id): JsonResponse
    {
        if (!$this->checkAdminAuth($request)) {
            return response()->json(['error' => 'Unauthorized.'], 401);
        }

        $user = User::find($id);
        if (!$user) {
            $user = User::where('handle', $id)->first();
        }

        if (!$user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        $name = trim((string) $request->input('name', $user->name));
        $email = strtolower(trim((string) $request->input('email', $user->email)));
        $phone = trim((string) $request->input('phone', $user->phone));
        $handle = trim((string) $request->input('handle', $user->handle));
        $newPassword = (string) $request->input('password');

        if ($request->has('isSampathCardholder')) {
            $user->is_sampath_cardholder = filter_var($request->input('isSampathCardholder'), FILTER_VALIDATE_BOOLEAN);
        }

        if ($request->has('isDisabled') || $request->has('is_disabled')) {
            $user->is_disabled = filter_var($request->input('isDisabled', $request->input('is_disabled')), FILTER_VALIDATE_BOOLEAN);
        }

        if (mb_strlen($name) < 2) {
            return response()->json(['error' => 'Full name must be at least 2 characters.'], 422);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['error' => 'Please provide a valid email address.'], 422);
        }

        if ($email !== strtolower($user->email) && User::where('email', $email)->where('id', '!=', $user->id)->exists()) {
            return response()->json(['error' => 'This email is already in use by another user.'], 409);
        }

        if (mb_strlen($phone) < 9) {
            return response()->json(['error' => 'Please provide a valid mobile number.'], 422);
        }

        if (!empty($handle)) {
            $formattedHandle = str_starts_with($handle, '@') ? $handle : '@' . $handle;
            if ($formattedHandle !== $user->handle && User::where('handle', $formattedHandle)->where('id', '!=', $user->id)->exists()) {
                return response()->json(['error' => 'This handle is already taken.'], 409);
            }
            $user->handle = $formattedHandle;
        }

        if (!empty($newPassword)) {
            if (mb_strlen($newPassword) < 6) {
                return response()->json(['error' => 'Password must be at least 6 characters.'], 422);
            }
            $user->password = Hash::make($newPassword);
        }

        $user->name = $name;
        $user->email = $email;
        $user->phone = $phone;
        if ($request->has('ipAddress')) {
            $user->ip_address = trim((string) $request->input('ipAddress')) ?: null;
        }
        $user->save();

        return response()->json([
            'success' => true,
            'user' => $user->toProfileArray(),
            'message' => 'User profile updated successfully!'
        ]);
    }

    /**
     * Delete user from MySQL.
     */
    public function destroy(Request $request, int|string $id): JsonResponse
    {
        if (!$this->checkAdminAuth($request)) {
            return response()->json(['error' => 'Unauthorized.'], 401);
        }

        $user = User::find($id);
        if (!$user) {
            $user = User::where('handle', $id)->first();
        }

        if (!$user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        $userName = $user->name;
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => "User '{$userName}' has been deleted successfully."
        ]);
    }

    /**
     * Toggle Sampath Cardholder status.
     */
    public function toggleCardholder(Request $request, int|string $id): JsonResponse
    {
        if (!$this->checkAdminAuth($request)) {
            return response()->json(['error' => 'Unauthorized.'], 401);
        }

        $user = User::find($id);
        if (!$user) {
            $user = User::where('handle', $id)->first();
        }

        if (!$user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        $user->is_sampath_cardholder = !$user->is_sampath_cardholder;
        $user->save();

        return response()->json([
            'success' => true,
            'user' => $user->toProfileArray(),
            'message' => "Cardholder status updated for {$user->name}."
        ]);
    }

    /**
     * Toggle user disabled status.
     */
    public function toggleDisable(Request $request, int|string $id): JsonResponse
    {
        if (!$this->checkAdminAuth($request)) {
            return response()->json(['error' => 'Unauthorized.'], 401);
        }

        $user = User::find($id);
        if (!$user) {
            $user = User::where('handle', $id)->first();
        }

        if (!$user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        $user->is_disabled = !$user->is_disabled;
        $user->save();

        $statusStr = $user->is_disabled ? 'disabled' : 'enabled';

        return response()->json([
            'success' => true,
            'user' => $user->toProfileArray(),
            'message' => "Spotter account for {$user->name} has been {$statusStr}."
        ]);
    }
}
