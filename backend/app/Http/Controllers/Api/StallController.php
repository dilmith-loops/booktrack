<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Stall;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class StallController extends Controller
{
    /**
     * List all participating fair stalls.
     */
    public function index(): JsonResponse
    {
        $stalls = Stall::orderBy('hall')->orderBy('stall_number')->get();
        return response()->json([
            'stalls' => $stalls
        ]);
    }

    /**
     * Show a single stall by ID.
     */
    public function show(string $id): JsonResponse
    {
        $stall = Stall::find($id);
        if (!$stall) {
            return response()->json(['error' => 'Stall not found'], 404);
        }

        return response()->json([
            'stall' => $stall
        ]);
    }

    /**
     * Create a new fair stall.
     */
    public function store(Request $request): JsonResponse
    {
        $token = $request->header('X-Admin-Token') ?: $request->bearerToken();
        if (!AdminController::isValidToken($token)) {
            return response()->json(['error' => 'Unauthorized. Admin session required to add stalls.'], 401);
        }

        $name = trim((string) $request->input('name'));
        $hall = trim((string) $request->input('hall', 'Hall A'));
        $stallNumber = trim((string) $request->input('stallNumber', $request->input('stall_number', '')));
        $category = trim((string) $request->input('category', 'General Books & Fiction'));
        $specialDiscount = trim((string) $request->input('specialDiscount', $request->input('special_discount', '')));

        if ($name === '' || $stallNumber === '') {
            return response()->json([
                'error' => 'Publisher/Stall Name and Stall Number are required fields.'
            ], 422);
        }

        $id = $request->input('id');
        if (!$id) {
            $slug = Str::slug($name, '-');
            $id = $slug ? "stall-{$slug}-" . Str::lower(Str::random(4)) : 'stall-' . (int) round(microtime(true) * 1000);
        }

        // Avoid ID collisions
        if (Stall::where('id', $id)->exists()) {
            $id = $id . '-' . Str::lower(Str::random(4));
        }

        $stall = Stall::create([
            'id' => $id,
            'name' => $name,
            'hall' => $hall,
            'stall_number' => $stallNumber,
            'category' => $category ?: null,
            'special_discount' => $specialDiscount ?: null,
        ]);

        return response()->json([
            'success' => true,
            'stall' => $stall,
            'message' => 'Fair stall registered successfully.'
        ], 201);
    }

    /**
     * Update an existing fair stall.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $token = $request->header('X-Admin-Token') ?: $request->bearerToken();
        if (!AdminController::isValidToken($token)) {
            return response()->json(['error' => 'Unauthorized. Admin session required to modify stalls.'], 401);
        }

        $stall = Stall::find($id);
        if (!$stall) {
            return response()->json(['error' => 'Stall not found'], 404);
        }

        if ($request->has('name')) {
            $stall->name = trim((string) $request->input('name'));
        }
        if ($request->has('hall')) {
            $stall->hall = trim((string) $request->input('hall'));
        }
        if ($request->has('stallNumber') || $request->has('stall_number')) {
            $stall->stall_number = trim((string) $request->input('stallNumber', $request->input('stall_number')));
        }
        if ($request->has('category')) {
            $stall->category = trim((string) $request->input('category')) ?: null;
        }
        if ($request->has('specialDiscount') || $request->has('special_discount')) {
            $stall->special_discount = trim((string) $request->input('specialDiscount', $request->input('special_discount'))) ?: null;
        }

        $stall->save();

        return response()->json([
            'success' => true,
            'stall' => $stall,
            'message' => 'Fair stall updated successfully.'
        ]);
    }

    /**
     * Delete a fair stall.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $token = $request->header('X-Admin-Token') ?: $request->bearerToken();
        if (!AdminController::isValidToken($token)) {
            return response()->json(['error' => 'Unauthorized. Admin session required to delete stalls.'], 401);
        }

        $stall = Stall::find($id);
        if (!$stall) {
            return response()->json(['error' => 'Stall not found'], 404);
        }

        $stall->delete();

        return response()->json([
            'success' => true,
            'message' => 'Fair stall deleted successfully.'
        ]);
    }
}
