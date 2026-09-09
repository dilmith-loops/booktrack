<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'event' => 'BMICH Book Fair 2026',
            'sponsor' => 'Sampath Bank PLC',
            'dates' => '25th Sep - 4th Oct 2026',
            'backend' => 'Laravel 13 & MySQL'
        ]);
    }
}
