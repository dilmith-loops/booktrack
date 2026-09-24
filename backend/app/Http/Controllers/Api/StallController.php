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
        $stalls = Stall::all()
            ->sortBy('stall_number', SORT_NATURAL | SORT_FLAG_CASE)
            ->values();

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
            'is_hidden' => (bool) $request->input('isHidden', $request->input('is_hidden', false)),
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
        if ($request->has('isHidden') || $request->has('is_hidden')) {
            $stall->is_hidden = (bool) $request->input('isHidden', $request->input('is_hidden'));
        }

        $stall->save();

        return response()->json([
            'success' => true,
            'stall' => $stall,
            'message' => 'Fair stall updated successfully.'
        ]);
    }

    /**
     * Toggle visibility (show / hide) for a stall.
     */
    public function toggleHide(Request $request, string $id): JsonResponse
    {
        $token = $request->header('X-Admin-Token') ?: $request->bearerToken();
        if (!AdminController::isValidToken($token)) {
            return response()->json(['error' => 'Unauthorized. Admin session required.'], 401);
        }

        $stall = Stall::find($id);
        if (!$stall) {
            return response()->json(['error' => 'Stall not found'], 404);
        }

        if ($request->has('isHidden') || $request->has('is_hidden')) {
            $stall->is_hidden = (bool) $request->input('isHidden', $request->input('is_hidden'));
        } else {
            $stall->is_hidden = !$stall->is_hidden;
        }

        $stall->save();

        return response()->json([
            'success' => true,
            'stall' => $stall,
            'message' => $stall->is_hidden ? 'Stall is now hidden from public app.' : 'Stall is now visible in public app.'
        ]);
    }

    /**
     * Batch import stalls from CSV.
     */
    public function import(Request $request): JsonResponse
    {
        $token = $request->header('X-Admin-Token') ?: $request->bearerToken();
        if (!AdminController::isValidToken($token)) {
            return response()->json(['error' => 'Unauthorized. Admin session required to import stalls.'], 401);
        }

        $stallsData = $request->input('stalls');
        if (!is_array($stallsData) || empty($stallsData)) {
            return response()->json(['error' => 'Invalid or empty stalls dataset provided.'], 422);
        }

        $mode = (string) $request->input('mode', 'replace'); // 'replace' or 'append'

        \Illuminate\Support\Facades\DB::transaction(function () use ($stallsData, $mode) {
            if ($mode === 'replace') {
                Stall::truncate();
            }

            foreach ($stallsData as $item) {
                $name = trim((string) ($item['name'] ?? ''));
                $stallNumber = trim((string) ($item['stallNumber'] ?? $item['stall_number'] ?? ''));
                if ($name === '' || $stallNumber === '') {
                    continue;
                }

                $id = $item['id'] ?? null;
                if (!$id) {
                    $slug = Str::slug($name, '-');
                    $id = $slug ? "stall-{$slug}-" . Str::lower(Str::random(4)) : 'stall-' . (int) round(microtime(true) * 1000);
                }

                $discount = $item['specialDiscount'] ?? $item['special_discount'] ?? null;
                $category = $item['category'] ?? 'General Books & Fiction';
                $isHidden = !empty($item['isHidden'] ?? $item['is_hidden'] ?? false);

                Stall::updateOrCreate(
                    ['id' => $id],
                    [
                        'name' => $name,
                        'hall' => trim((string) ($item['hall'] ?? 'Hall A')),
                        'stall_number' => $stallNumber,
                        'special_discount' => $discount ? trim((string) $discount) : null,
                        'category' => $category ? trim((string) $category) : 'General Books & Fiction',
                        'is_hidden' => $isHidden,
                    ]
                );
            }
        });

        $allStalls = Stall::all()
            ->sortBy('stall_number', SORT_NATURAL | SORT_FLAG_CASE)
            ->values();

        return response()->json([
            'success' => true,
            'count' => count($allStalls),
            'message' => 'Successfully imported ' . count($stallsData) . ' stalls.',
            'stalls' => $allStalls
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
