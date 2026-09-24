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
        Schema::table('stalls', function (Blueprint $table) {
            $table->string('id', 191)->change();
        });

        Schema::table('spots', function (Blueprint $table) {
            $table->string('stall_id', 191)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stalls', function (Blueprint $table) {
            $table->string('id', 50)->change();
        });

        Schema::table('spots', function (Blueprint $table) {
            $table->string('stall_id', 50)->nullable()->change();
        });
    }
};
