<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\ModerationController;
use App\Http\Controllers\Api\SpotController;
use App\Http\Controllers\Api\StallController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Authentication & Recurring User Login Routes (Rate-limited to prevent brute force)
Route::prefix('auth')->middleware('throttle:20,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/otp-request', [AuthController::class, 'requestOtp'])->middleware('throttle:6,1');
    Route::post('/otp-verify', [AuthController::class, 'verifyOtp'])->middleware('throttle:10,1');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:6,1');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:10,1');
    Route::post('/profile', [AuthController::class, 'updateProfile']);
});

// Admin Authentication Routes
Route::prefix('admin')->group(function () {
    Route::post('/login', [AdminController::class, 'login'])->middleware('throttle:5,1');
    Route::post('/verify', [AdminController::class, 'verify']);
});

// System Settings & Maintenance Mode
Route::get('/settings/maintenance', [AdminController::class, 'getMaintenanceStatus']);
Route::post('/settings/maintenance', [AdminController::class, 'setMaintenanceMode']);


// Registered Users Management (Admin protected)
Route::get('/users', [UserController::class, 'index']);
Route::post('/users', [UserController::class, 'store']);
Route::get('/users/{id}', [UserController::class, 'show']);
Route::put('/users/{id}', [UserController::class, 'update']);
Route::delete('/users/{id}', [UserController::class, 'destroy']);
Route::post('/users/{id}/toggle-cardholder', [UserController::class, 'toggleCardholder']);

// Public Health & Stalls
Route::get('/health', [HealthController::class, 'index']);
Route::get('/stalls', [StallController::class, 'index']);
Route::get('/stalls/{id}', [StallController::class, 'show']);
Route::post('/stalls', [StallController::class, 'store']);
Route::put('/stalls/{id}', [StallController::class, 'update']);
Route::delete('/stalls/{id}', [StallController::class, 'destroy']);

// Spots & Requests
Route::get('/spots', [SpotController::class, 'index']);
Route::get('/spots/{id}', [SpotController::class, 'show']);
Route::post('/spots', [SpotController::class, 'store']);
Route::put('/spots/{id}', [SpotController::class, 'update']);
Route::delete('/spots/{id}', [SpotController::class, 'destroy']);
Route::post('/spots/{id}/upvote', [SpotController::class, 'upvote']);
Route::post('/spots/{id}/rate', [SpotController::class, 'rate']);
Route::post('/spots/{id}/status', [SpotController::class, 'updateStatus']);
Route::post('/spots/{id}/pin', [SpotController::class, 'togglePin']);
Route::post('/spots/{id}/ai-verify', [SpotController::class, 'toggleAiVerified']);
Route::post('/spots/{id}/archive', [SpotController::class, 'archive']);
Route::post('/spots/{id}/unarchive', [SpotController::class, 'unarchive']);
Route::post('/spots/{id}/toggle-archive', [SpotController::class, 'toggleArchive']);

Route::post('/check-book', [SpotController::class, 'checkBook']);
Route::post('/moderate-text', [ModerationController::class, 'moderateText']);
Route::post('/moderate-image', [ModerationController::class, 'moderateImage']);
