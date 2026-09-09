<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('spots', 'is_pinned')) {
            Schema::table('spots', function (Blueprint $table) {
                $table->boolean('is_pinned')->default(false)->after('ai_verified');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('spots', 'is_pinned')) {
            Schema::table('spots', function (Blueprint $table) {
                $table->dropColumn('is_pinned');
            });
        }
    }
};
