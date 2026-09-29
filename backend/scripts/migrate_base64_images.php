<?php

/**
 * Migration Script: Convert Base64 Images in Spots Table to Public Static Files
 * 
 * Usage from terminal (local or cPanel):
 *   cd backend
 *   php scripts/migrate_base64_images.php
 */

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Spot;
use Illuminate\Support\Str;

echo "=== BMICH Book Finder: Base64 Image Migration Tool ===\n";

$uploadDir = public_path('uploads/spots');
if (!is_dir($uploadDir)) {
    if (!@mkdir($uploadDir, 0755, true)) {
        die("ERROR: Failed to create directory: {$uploadDir}\n");
    }
}

// Also ensure root public/uploads/spots if dual layout
$rootUploadDir = base_path('../public/uploads/spots');
if (is_dir(base_path('../public')) && !is_dir($rootUploadDir)) {
    @mkdir($rootUploadDir, 0755, true);
}

$spots = Spot::all();
$totalConverted = 0;
$totalBytesSaved = 0;
$spotsUpdated = 0;

foreach ($spots as $spot) {
    $images = $spot->images;
    if (!is_array($images) || empty($images)) {
        continue;
    }

    $hasBase64 = false;
    $newImages = [];

    foreach ($images as $index => $img) {
        if (!is_string($img)) {
            continue;
        }

        if (str_starts_with($img, 'data:image/')) {
            $hasBase64 = true;
            $len = strlen($img);
            $totalBytesSaved += $len;

            if (preg_match('/^data:image\/(\w+);base64,(.+)$/s', $img, $matches)) {
                $ext = strtolower($matches[1]);
                if ($ext === 'jpeg') $ext = 'jpg';
                if (!in_array($ext, ['jpg', 'png', 'webp', 'gif'])) {
                    $ext = 'jpg';
                }

                $bin = base64_decode($matches[2]);
                if ($bin !== false) {
                    $filename = Str::slug($spot->id) . '-' . $index . '-' . Str::random(6) . '.' . $ext;
                    $destPath = $uploadDir . DIRECTORY_SEPARATOR . $filename;
                    if (@file_put_contents($destPath, $bin) !== false) {
                        if (is_dir($rootUploadDir)) {
                            @copy($destPath, $rootUploadDir . DIRECTORY_SEPARATOR . $filename);
                        }
                        $newImages[] = '/uploads/spots/' . $filename;
                        $totalConverted++;
                        continue;
                    }
                }
            }
        }

        $newImages[] = $img;
    }

    if ($hasBase64) {
        $spot->images = $newImages;
        $spot->save();
        $spotsUpdated++;
        echo " [✓] Converted images for spot: {$spot->id} ({$spot->book_name})\n";
    }
}

$mbSaved = round($totalBytesSaved / (1024 * 1024), 2);
echo "\n============================================\n";
echo "Migration Complete!\n";
echo "Total Spots Updated: {$spotsUpdated}\n";
echo "Total Images Extracted to Files: {$totalConverted}\n";
echo "Database & Payload Bytes Saved: {$mbSaved} MB\n";
echo "Storage Location: {$uploadDir}\n";
echo "============================================\n";
