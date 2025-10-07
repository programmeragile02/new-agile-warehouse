<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('subscription_addons', function (Blueprint $t) {
            $t->id();
            $t->uuid('subscription_instance_id')->index();
            $t->string('feature_code', 100)->index();
            $t->string('feature_name')->nullable();

            $t->bigInteger('price_amount')->default(0);
            $t->string('currency', 10)->default('IDR');

            $t->uuid('order_id')->nullable()->index();
            $t->string('midtrans_order_id')->nullable()->index();

            $t->timestamp('purchased_at')->nullable();
            $t->timestamps();

            $t->unique(['subscription_instance_id','feature_code'], 'uniq_subaddon_instance_feature');
        });
    }
    public function down(): void {
        Schema::dropIfExists('subscription_addons');
    }
};