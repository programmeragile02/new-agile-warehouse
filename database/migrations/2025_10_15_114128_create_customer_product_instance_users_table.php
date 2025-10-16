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
        Schema::create('customer_product_instance_users', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('product_code', 64);          // contoh: TIRTABENING
            $table->string('company_id', 64);            // contoh: TIRTABENING_903048

            $table->string('email', 191);                // email original (as is)
            $table->string('password_plain', 255)->nullable();
            $table->string('password_hash', 255)->nullable();  // bcrypt/argon2
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            // Lookup cepat (email lowercase dipakai via WHERE lower(email)=?)
            $table->index(['product_code']);
            $table->index(['company_id']);
            $table->index(['email']);

            // Unik per (produk, company, email)
            $table->unique(['product_code','company_id','email'], 'uq_cpiu_prod_company_email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_product_instance_users');
    }
};
