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
        Schema::create('spot_ratings', function (Blueprint $table) {
            $table->id();
            $table->string('spot_id', 60);
            $table->unsignedTinyInteger('score');
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->foreign('spot_id')->references('id')->on('spots')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('spot_ratings');
    }
};
