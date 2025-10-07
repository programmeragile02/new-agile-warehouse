<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mst_feature_builder', function (Blueprint $table) {
            $table->id();
            $table->string('product_id', 36);
            $table->string('product_code', 64)->nullable();
            $table->unsignedBigInteger('parent_id')->nullable()->index();
            $table->string('name', 160);
            $table->string('feature_code', 128)->index();
            $table->enum('type', ['category','feature','subfeature'])->default('feature');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('crud_menu_id')->nullable();
            $table->unsignedInteger('price_addon')->default(0);
            $table->boolean('trial_available')->default(false);
            $table->unsignedInteger('trial_days')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('order_number')->default(0);
            $table->softDeletes();
            $table->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('mst_feature_builder');
    }
};