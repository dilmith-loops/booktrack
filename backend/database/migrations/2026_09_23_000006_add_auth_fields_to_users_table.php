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
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone', 30)->nullable()->after('email')->index();
            $table->string('handle', 50)->nullable()->after('phone')->unique();
            $table->boolean('is_sampath_cardholder')->default(false)->after('handle');
            $table->string('otp_code', 10)->nullable()->after('password');
            $table->timestamp('otp_expires_at')->nullable()->after('otp_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone',
                'handle',
                'is_sampath_cardholder',
                'otp_code',
                'otp_expires_at'
            ]);
        });
    }
};
