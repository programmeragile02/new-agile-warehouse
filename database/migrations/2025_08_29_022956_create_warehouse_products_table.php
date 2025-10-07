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
        Schema::create('warehouse_products', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();   // <- id harus sama dengan Panel
            $table->string('product_code', 64)->unique()->index();
            $table->string('product_name', 160);
            $table->string('category', 80)->nullable();
            $table->string('status', 32)->default('Active');
            $table->text('description')->nullable();
            $table->string('master_db_name', 60);
            $table->unsignedInteger('total_features')->default(0);
            $table->string('master_schema_version', 32)->nullable();
            // $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('warehouse_products');
    }
};
