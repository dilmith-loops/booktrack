<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Spot;
use App\Models\Stall;

echo "=== USERS COUNT: " . User::count() . " ===\n";
foreach (User::all() as $u) {
    echo "ID: {$u->id} | Name: {$u->name} | Email: {$u->email} | Phone: {$u->phone} | Handle: {$u->handle} | Created: {$u->created_at}\n";
}

echo "\n=== SPOTS / REQUESTS COUNT: " . Spot::count() . " ===\n";
foreach (Spot::latest()->take(10)->get() as $s) {
    echo "ID: {$s->id} | Title: {$s->book_name} | Type: {$s->post_type} | User: {$s->finder_name} | Created: {$s->created_at}\n";
}

echo "\n=== STALLS COUNT: " . Stall::count() . " ===\n";
foreach (Stall::take(5)->get() as $st) {
    echo "ID: {$st->id} | Name: {$st->name} | Hall: {$st->hall} | Stall#: {$st->stall_number}\n";
}
