<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ModerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModerationController extends Controller
{
    public function __construct(
        protected ModerationService $moderation
    ) {}

    public function moderateText(Request $request): JsonResponse
    {
        $text = $request->input('text', '');
        $context = $request->input('context');

        if (empty($text)) {
            return response()->json(['isClean' => true]);
        }

        $result = $this->moderation->moderateContent((string) $text, (string) $context);
        return response()->json($result);
    }

    public function moderateImage(Request $request): JsonResponse
    {
        $image = $request->input('image');

        if (empty($image)) {
            return response()->json(['isClean' => true]);
        }

        $result = $this->moderation->moderateImage((string) $image);
        return response()->json($result);
    }
}
