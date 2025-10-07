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
        Schema::create('customer_product_instances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('customer_id');
            $table->uuid('order_id');
            $table->string('product_code');    // RENTVIX
            $table->string('company_id');      // e.g. RENTVIX_2345 (unik per product_code)
            $table->string('company_password_plain')->nullable(); // dikosongkan setelah kirim notif (opsional)
            $table->string('company_password_hash')->nullable();  // hash untuk verifikasi
            $table->string('database_name');   // e.g. rentvix_ab12cd34
            $table->string('app_url');         // e.g. https://apps.agile.local/rentvix-ab12cd34
            $table->string('admin_email');
            $table->string('admin_username');
            $table->string('admin_password_plain')->nullable(); // kosongkan setelah notifikasi (opsional)
            $table->timestamps();
            $table->unique(['product_code','company_id']); // jamin unik
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_product_instances');
    }
};
