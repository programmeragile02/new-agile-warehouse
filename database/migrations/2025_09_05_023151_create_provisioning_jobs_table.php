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
        Schema::create('provisioning_jobs', function (Blueprint $table) {
            $table->uuid('id')->primary(); // job_id (idempotent)
            $table->uuid('order_id');
            $table->uuid('customer_id');
            $table->string('product_code'); // RENTVIX / ABSENFAST / dll
            $table->uuid('product_id')->nullable();
            $table->enum('status', ['pending','processing','finished','failed'])->default('pending');
            $table->timestamp('requested_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->text('error_message')->nullable();
            $table->json('meta')->nullable(); // email, phone, dan extra
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('provisioning_jobs');
    }
};
