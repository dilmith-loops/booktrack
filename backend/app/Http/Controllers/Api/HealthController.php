<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends Controller
{
    public function index(): JsonResponse
    {
        $dbStatus = 'unknown';
        $dbError = null;

        try {
            DB::connection()->getPdo();
            $dbStatus = 'connected';
        } catch (Throwable $e) {
            $dbStatus = 'connection_failed';
            $dbError = $e->getMessage();
        }

        return response()->json([
            'status' => 'ok',
            'event' => 'BMICH Book Fair 2026',
            'sponsor' => 'Sampath Bank PLC',
            'dates' => '25th Sep - 4th Oct 2026',
            'backend' => 'Laravel 13 & MySQL',
            'database' => [
                'status' => $dbStatus,
                'error' => $dbError,
            ],
            'session_driver' => config('session.driver'),
            'cache_driver' => config('cache.default'),
        ]);
    }
}
