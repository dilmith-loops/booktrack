<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('spots', function (Blueprint $table) {
            $table->boolean('is_archived')->default(false)->after('is_pinned')->index();
            $table->timestamp('archived_at')->nullable()->after('is_archived');
            $table->string('archived_by')->nullable()->after('archived_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('spots', function (Blueprint $table) {
            $table->dropColumn(['is_archived', 'archived_at', 'archived_by']);
        });
    }
};
