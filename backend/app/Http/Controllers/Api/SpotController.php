<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Spot;
use App\Models\SpotRating;
use App\Models\Stall;
use App\Services\ModerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SpotController extends Controller
{
    public function __construct(
        protected ModerationService $moderation
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Spot::query();

        // Archival filtering: default to active (non-archived) posts
        $includeArchived = filter_var($request->query('include_archived', false), FILTER_VALIDATE_BOOLEAN);
        $archivedOnly = filter_var($request->query('archived_only', false), FILTER_VALIDATE_BOOLEAN);

        if ($archivedOnly) {
            $query->where('is_archived', true);
        } elseif (!$includeArchived) {
            $query->where('is_archived', false);
        }

        // Optional filter by user handle
        if ($userHandle = $request->query('user_handle')) {
            $query->where('finder_handle', $userHandle);
        }

        $spots = $query->orderBy('is_pinned', 'desc')
            ->orderBy('timestamp', 'desc')
            ->get();

        return response()->json([
            'spots' => $spots
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $postType = $request->input('postType', 'spot');
        $bookName = trim((string) $request->input('bookName', ''));
        $stallId = $request->input('stallId');
        $stallName = trim((string) $request->input('stallName', ''));
        $hall = $request->input('hall');
        $stallNumber = $request->input('stallNumber');
        $images = $request->input('images', []);
        $finderName = trim((string) $request->input('finderName', ''));
        $priceOrOffer = $request->input('priceOrOffer');
        $shelfLocationNote = $request->input('shelfLocationNote');
        $notes = $request->input('notes');
        $replyToRequestId = $request->input('replyToRequestId');
        $taggedRequesterName = $request->input('taggedRequesterName');
        $taggedRequesterHandle = $request->input('taggedRequesterHandle');

        // 1. Validation
        if (mb_strlen($bookName) < 2) {
            return response()->json(['error' => 'Book name is required.'], 400);
        }

        $rawFinderHandle = trim((string) $request->input('finderHandle', ''));
        if (!empty($rawFinderHandle)) {
            $checkHandle = str_starts_with($rawFinderHandle, '@') ? $rawFinderHandle : '@' . $rawFinderHandle;
            $authorUser = \App\Models\User::where('handle', $checkHandle)->first();
            if ($authorUser && $authorUser->is_disabled) {
                return response()->json([
                    'error' => 'Your spotter account is currently disabled. You cannot post spots or requests.'
                ], 403);
            }
        }

        // 2. Multilingual Content Moderation
        $modResult = $this->moderation->moderateContent(
            $bookName,
            $notes,
            $shelfLocationNote,
            $priceOrOffer,
            $finderName,
            $stallName
        );

        if (!$modResult['isClean']) {
            return response()->json([
                'error' => "AI Moderation: Message rejected. " . ($modResult['reason'] ?? 'Contains inappropriate or prohibited language.') . " Sampath Bank community standards strictly prohibit profanity, racism, and communal discord.",
                'moderationBlocked' => true,
                'reason' => $modResult['reason'] ?? null,
                'violationType' => $modResult['detectedType'] ?? 'profanity'
            ], 400);
        }

        // 3. Image validation and moderation
        $photoList = is_array($images) ? $images : [];
        if (count($photoList) > 3) {
            return response()->json(['error' => 'A maximum of 3 pictures can be uploaded.'], 400);
        }

        foreach ($photoList as $index => $img) {
            $imgCheck = $this->moderation->moderateImage($img);
            if (!$imgCheck['isClean']) {
                return response()->json([
                    'error' => "AI Image Moderation: Uploaded photo " . ($index + 1) . " was rejected. " . ($imgCheck['reason'] ?? 'Image violates community guidelines.') . " Only safe, appropriate photos of books and BMICH stalls are permitted.",
                    'moderationBlocked' => true,
                    'reason' => $imgCheck['reason'] ?? null,
                    'violationType' => 'image_safety',
                    'imageIndex' => $index
                ], 400);
            }
        }

        $nowTimestamp = (int) round(microtime(true) * 1000);

        // 4. Handle "Looking for a book" request
        if ($postType === 'request') {
            $reqId = 'req-' . $nowTimestamp . '-' . Str::lower(Str::random(5));
            $rawHandle = trim((string) $request->input('finderHandle', ''));
            if (!empty($rawHandle)) {
                $handle = str_starts_with($rawHandle, '@') ? $rawHandle : '@' . $rawHandle;
            } else {
                $handle = $finderName !== ''
                    ? (str_starts_with($finderName, '@') ? $finderName : '@' . Str::slug($finderName, '_'))
                    : '@booklover';
            }

            $newRequest = Spot::create([
                'id' => $reqId,
                'post_type' => 'request',
                'book_name' => $bookName,
                'stall_id' => 'seeking',
                'stall_name' => 'BMICH Fairgrounds',
                'hall' => 'Seeking in All Halls',
                'stall_number' => 'Looking for Stall',
                'images' => $photoList,
                'finder_name' => $finderName !== '' ? $finderName : 'Book Fair Visitor',
                'finder_handle' => $handle,
                'timestamp' => $nowTimestamp,
                'notes' => $notes ?: null,
                'status' => 'Looking for Book',
                'helpful_count' => 0,
                'ai_verified' => true,
                'is_resolved' => false
            ]);

            return response()->json([
                'success' => true,
                'spot' => $newRequest,
                'message' => 'Looking for book request posted to group chat!'
            ], 201);
        }

        // 5. Handle "Found a Book" / Sighting
        if ($stallName === '') {
            return response()->json(['error' => 'Stall name must be selected from the participating stalls dropdown.'], 400);
        }

        $linkedRequesterName = $taggedRequesterName;
        $linkedRequesterHandle = $taggedRequesterHandle;

        $targetRequest = null;
        if ($replyToRequestId) {
            $targetRequest = Spot::find($replyToRequestId);
            if ($targetRequest) {
                $targetRequest->is_resolved = true;
                $targetRequest->status = 'Found';
                $linkedRequesterName = $targetRequest->finder_name;
                $linkedRequesterHandle = $targetRequest->finder_handle;
            }
        }

        // Check stall match for discount & hall defaults
        $matchedStall = Stall::where('name', $stallName)
            ->orWhere('id', $stallId)
            ->first();

        $spotId = 'spot-' . $nowTimestamp . '-' . Str::lower(Str::random(5));
        $rawHandle = trim((string) $request->input('finderHandle', ''));
        if (!empty($rawHandle)) {
            $handle = str_starts_with($rawHandle, '@') ? $rawHandle : '@' . $rawHandle;
        } else {
            $handle = $finderName !== ''
                ? (str_starts_with($finderName, '@') ? $finderName : '@' . Str::slug($finderName, '_'))
                : '@bookspotter';
        }

        $newSpot = Spot::create([
            'id' => $spotId,
            'post_type' => 'spot',
            'book_name' => $bookName,
            'stall_id' => $stallId ?: ($matchedStall?->id ?? 'other'),
            'stall_name' => $stallName,
            'hall' => $hall ?: ($matchedStall?->hall ?? 'BMICH Main Fairgrounds'),
            'stall_number' => $stallNumber ?: ($matchedStall?->stall_number ?? 'Fairground Stall'),
            'images' => $photoList,
            'finder_name' => $finderName !== '' ? $finderName : 'Anonymous Fair Visitor',
            'finder_handle' => $handle,
            'timestamp' => $nowTimestamp,
            'price_or_offer' => $priceOrOffer ?: null,
            'shelf_location_note' => $shelfLocationNote ?: null,
            'notes' => $notes ?: null,
            'status' => 'In Stock',
            'helpful_count' => 1,
            'rating_average' => 5.0,
            'rating_count' => 1,
            'ai_verified' => true,
            'sampath_card_discount' => $matchedStall?->special_discount ?: 'Eligible for Sampath Cardholder fair offers',
            'reply_to_request_id' => $replyToRequestId ?: null,
            'tagged_requester_name' => $linkedRequesterName ?: null,
            'tagged_requester_handle' => $linkedRequesterHandle ?: null,
            'is_resolved' => false
        ]);

        if ($targetRequest) {
            $targetRequest->resolved_by_spot_id = $newSpot->id;
            $targetRequest->save();
        }

        return response()->json([
            'success' => true,
            'spot' => $newSpot,
            'message' => $replyToRequestId 
                ? "Tagged " . ($linkedRequesterName ?: 'user') . " with your found book location!"
                : 'Book spot published to community feed successfully!'
        ], 201);
    }

    public function upvote(string $id): JsonResponse
    {
        $spot = Spot::find($id);
        if (!$spot) {
            return response()->json(['error' => 'Spotting not found'], 404);
        }

        $spot->increment('helpful_count');
        $spot->refresh();

        return response()->json([
            'success' => true,
            'helpfulCount' => (int) $spot->helpful_count
        ]);
    }

    public function rate(Request $request, string $id): JsonResponse
    {
        $spot = Spot::find($id);
        if (!$spot) {
            return response()->json(['error' => 'Spotting not found'], 404);
        }

        $score = max(1, min(5, (int) $request->input('score', 5)));

        SpotRating::create([
            'spot_id' => $spot->id,
            'score' => $score,
            'ip_address' => $request->ip()
        ]);

        $currentCount = $spot->rating_count > 0 ? $spot->rating_count : ($spot->helpful_count > 0 ? 1 : 0);
        $currentAvg = (float) $spot->rating_average ?: 5.0;

        $newCount = $currentCount + 1;
        $newAvg = round((($currentAvg * $currentCount) + $score) / $newCount, 1);

        $spot->rating_count = $newCount;
        $spot->rating_average = $newAvg;
        $spot->helpful_count += 1;
        $spot->save();

        return response()->json([
            'success' => true,
            'ratingAverage' => (float) $spot->rating_average,
            'ratingCount' => (int) $spot->rating_count,
            'helpfulCount' => (int) $spot->helpful_count
        ]);
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $spot = Spot::find($id);
        if (!$spot) {
            return response()->json(['error' => 'Spotting not found'], 404);
        }

        $status = $request->input('status');
        $allowed = ['In Stock', 'Few Copies Left', 'Sold Out', 'Looking for Book', 'Found'];

        if (!in_array($status, $allowed, true)) {
            return response()->json(['error' => 'Invalid status'], 400);
        }

        $spot->status = $status;
        $spot->save();

        return response()->json([
            'success' => true,
            'status' => $spot->status
        ]);
    }

    public function checkBook(Request $request): JsonResponse
    {
        $bookName = trim((string) $request->input('bookName', ''));
        if (mb_strlen($bookName) < 2) {
            return response()->json(['matches' => []]);
        }

        $query = mb_strtolower($bookName, 'UTF-8');

        // Search in MySQL spots
        $matching = Spot::whereRaw('LOWER(book_name) LIKE ?', ["%{$query}%"])
            ->orWhereRaw('? LIKE CONCAT("%", LOWER(book_name), "%")', [$query])
            ->get();

        $stallsGroup = [];
        $sightings = [];

        foreach ($matching as $s) {
            $key = "{$s->stall_name} ({$s->hall})";
            $stallsGroup[$key] = true;

            $sightings[] = [
                'id' => $s->id,
                'bookName' => $s->book_name,
                'stallName' => $s->stall_name,
                'hall' => $s->hall,
                'stallNumber' => $s->stall_number,
                'priceOrOffer' => $s->price_or_offer,
                'images' => $s->images ?? [],
                'shelfLocationNote' => $s->shelf_location_note,
                'timestamp' => (int) $s->timestamp,
                'status' => $s->status,
                'finderHandle' => $s->finder_handle
            ];
        }

        return response()->json([
            'query' => $query,
            'found' => count($sightings) > 0,
            'count' => count($sightings),
            'stallsCount' => count($stallsGroup),
            'sightings' => $sightings
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $spot = Spot::find($id);
        if (!$spot) {
            return response()->json(['error' => 'Spotting not found'], 404);
        }

        return response()->json(['spot' => $spot]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $spot = Spot::find($id);
        if (!$spot) {
            return response()->json(['error' => 'Spotting not found'], 404);
        }

        if ($request->has('bookName')) {
            $spot->book_name = trim((string) $request->input('bookName'));
        }
        if ($request->has('author')) {
            $spot->author = trim((string) $request->input('author')) ?: null;
        }
        if ($request->has('stallName')) {
            $spot->stall_name = trim((string) $request->input('stallName'));
        }
        if ($request->has('stallId')) {
            $spot->stall_id = $request->input('stallId');
        }
        if ($request->has('hall')) {
            $spot->hall = trim((string) $request->input('hall'));
        }
        if ($request->has('stallNumber')) {
            $spot->stall_number = trim((string) $request->input('stallNumber'));
        }
        if ($request->has('priceOrOffer')) {
            $spot->price_or_offer = trim((string) $request->input('priceOrOffer')) ?: null;
        }
        if ($request->has('shelfLocationNote')) {
            $spot->shelf_location_note = trim((string) $request->input('shelfLocationNote')) ?: null;
        }
        if ($request->has('notes')) {
            $spot->notes = trim((string) $request->input('notes')) ?: null;
        }
        if ($request->has('status')) {
            $spot->status = $request->input('status');
        }
        if ($request->has('finderName')) {
            $spot->finder_name = trim((string) $request->input('finderName'));
        }
        if ($request->has('finderHandle')) {
            $spot->finder_handle = trim((string) $request->input('finderHandle'));
        }
        if ($request->has('aiVerified')) {
            $spot->ai_verified = (bool) $request->input('aiVerified');
        }
        if ($request->has('isPinned')) {
            $spot->is_pinned = (bool) $request->input('isPinned');
        }
        if ($request->has('helpfulCount')) {
            $spot->helpful_count = (int) $request->input('helpfulCount');
        }
        if ($request->has('ratingAverage')) {
            $spot->rating_average = (float) $request->input('ratingAverage');
        }
        if ($request->has('images') && is_array($request->input('images'))) {
            $spot->images = $request->input('images');
        }

        $spot->save();

        return response()->json([
            'success' => true,
            'spot' => $spot,
            'message' => 'Post updated successfully in database!'
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $spot = Spot::find($id);
        if (!$spot) {
            return response()->json(['error' => 'Spotting not found'], 404);
        }

        // Ownership or Admin Token verification
        $token = $request->header('X-Admin-Token') ?: $request->bearerToken();
        $isAdmin = AdminController::isValidToken($token);

        $userHandle = $request->input('userHandle', $request->header('X-User-Handle'));

        if (!$isAdmin) {
            if (!$userHandle || strtolower(trim((string) $spot->finder_handle)) !== strtolower(trim((string) $userHandle))) {
                return response()->json([
                    'error' => 'Unauthorized. Only the original creator or an authenticated administrator can remove this post.'
                ], 403);
            }
        }

        $spot->delete();

        return response()->json([
            'success' => true,
            'message' => 'Post removed permanently from database.'
        ]);
    }

    public function archive(Request $request, string $id): JsonResponse
    {
        $spot = Spot::find($id);
        if (!$spot) {
            return response()->json(['error' => 'Spotting not found'], 404);
        }

        $token = $request->header('X-Admin-Token') ?: $request->bearerToken();
        $isAdmin = AdminController::isValidToken($token);

        $userHandle = $request->input('userHandle', $request->header('X-User-Handle'));

        if (!$isAdmin) {
            if (!$userHandle || strtolower(trim((string) $spot->finder_handle)) !== strtolower(trim((string) $userHandle))) {
                return response()->json([
                    'error' => 'Unauthorized. Only the original creator or an authenticated administrator can archive this post.'
                ], 403);
            }
        }

        $spot->is_archived = true;
        $spot->archived_at = now();
        $spot->archived_by = $isAdmin ? 'admin' : ($userHandle ?: 'user');
        $spot->save();

        return response()->json([
            'success' => true,
            'spot' => $spot,
            'message' => 'Post archived successfully. It is now hidden from the public feed.'
        ]);
    }

    public function unarchive(Request $request, string $id): JsonResponse
    {
        $token = $request->header('X-Admin-Token') ?: $request->bearerToken();
        $isAdmin = AdminController::isValidToken($token);

        $spot = Spot::find($id);
        if (!$spot) {
            return response()->json(['error' => 'Spotting not found'], 404);
        }

        $userHandle = $request->input('userHandle', $request->header('X-User-Handle'));

        if (!$isAdmin) {
            if (!$userHandle || strtolower(trim((string) $spot->finder_handle)) !== strtolower(trim((string) $userHandle))) {
                return response()->json([
                    'error' => 'Unauthorized. Only the original creator or an authenticated administrator can unarchive this post.'
                ], 403);
            }
        }

        $spot->is_archived = false;
        $spot->archived_at = null;
        $spot->archived_by = null;
        $spot->save();

        return response()->json([
            'success' => true,
            'spot' => $spot,
            'message' => 'Post restored from archive.'
        ]);
    }

    public function toggleArchive(Request $request, string $id): JsonResponse
    {
        $token = $request->header('X-Admin-Token') ?: $request->bearerToken();
        $isAdmin = AdminController::isValidToken($token);

        $spot = Spot::find($id);
        if (!$spot) {
            return response()->json(['error' => 'Spotting not found'], 404);
        }

        $userHandle = $request->input('userHandle', $request->header('X-User-Handle'));

        if (!$isAdmin) {
            if (!$userHandle || strtolower(trim((string) $spot->finder_handle)) !== strtolower(trim((string) $userHandle))) {
                return response()->json([
                    'error' => 'Unauthorized. Only the original creator or an authenticated administrator can change this archive status.'
                ], 403);
            }
        }

        $isArchived = !$spot->is_archived;
        $spot->is_archived = $isArchived;
        $spot->archived_at = $isArchived ? now() : null;
        $spot->archived_by = $isArchived ? ($isAdmin ? 'admin' : ($userHandle ?? 'user')) : null;
        $spot->save();

        return response()->json([
            'success' => true,
            'isArchived' => $spot->is_archived,
            'spot' => $spot,
            'message' => $isArchived ? 'Post archived successfully.' : 'Post unarchived successfully.'
        ]);
    }

    public function togglePin(Request $request, string $id): JsonResponse
    {
        $token = $request->header('X-Admin-Token') ?: $request->bearerToken();
        if (!AdminController::isValidToken($token)) {
            return response()->json(['error' => 'Unauthorized. Admin session required to pin posts.'], 401);
        }

        $spot = Spot::find($id);
        if (!$spot) {
            return response()->json(['error' => 'Spotting not found'], 404);
        }

        $spot->is_pinned = !$spot->is_pinned;
        $spot->save();

        return response()->json([
            'success' => true,
            'isPinned' => $spot->is_pinned
        ]);
    }

    public function toggleAiVerified(Request $request, string $id): JsonResponse
    {
        $token = $request->header('X-Admin-Token') ?: $request->bearerToken();
        if (!AdminController::isValidToken($token)) {
            return response()->json(['error' => 'Unauthorized. Admin session required to verify posts.'], 401);
        }

        $spot = Spot::find($id);
        if (!$spot) {
            return response()->json(['error' => 'Spotting not found'], 404);
        }

        $spot->ai_verified = !$spot->ai_verified;
        $spot->save();

        return response()->json([
            'success' => true,
            'aiVerified' => $spot->ai_verified
        ]);
    }
}
