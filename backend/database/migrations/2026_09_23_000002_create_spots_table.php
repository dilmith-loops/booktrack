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
        Schema::create('spots', function (Blueprint $table) {
            $table->string('id', 60)->primary();
            $table->string('post_type', 20)->default('spot');
            $table->string('book_name');
            $table->string('author')->nullable();
            $table->string('stall_id', 50)->nullable();
            $table->string('stall_name');
            $table->string('hall', 100);
            $table->string('stall_number', 50);
            $table->json('images')->nullable();
            $table->string('finder_name');
            $table->string('finder_handle');
            $table->bigInteger('timestamp');
            $table->string('price_or_offer')->nullable();
            $table->text('shelf_location_note')->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 50)->default('In Stock');
            $table->integer('helpful_count')->default(0);
            $table->decimal('rating_average', 3, 1)->default(5.0);
            $table->integer('rating_count')->default(1);
            $table->boolean('ai_verified')->default(true);
            $table->string('sampath_card_discount')->nullable();
            $table->string('reply_to_request_id', 60)->nullable();
            $table->string('tagged_requester_name')->nullable();
            $table->string('tagged_requester_handle')->nullable();
            $table->boolean('is_resolved')->default(false);
            $table->string('resolved_by_spot_id', 60)->nullable();
            $table->timestamps();

            $table->index('post_type');
            $table->index('timestamp');
            $table->index('stall_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('spots');
    }
};
