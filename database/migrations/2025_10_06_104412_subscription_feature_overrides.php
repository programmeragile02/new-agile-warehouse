<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('subscription_feature_overrides', function (Blueprint $t) {
            $t->id();
            $t->uuid('subscription_instance_id')->index();
            $t->string('feature_code', 100)->index();
            $t->boolean('enabled')->default(true);
            $t->string('source', 32)->nullable(); // 'addon' | 'ops' | 'system'
            $t->timestamps();

            $t->unique(['subscription_instance_id','feature_code'], 'uniq_subfeatovr_instance_feature');
        });
    }
    public function down(): void {
        Schema::dropIfExists('subscription_feature_overrides');
    }
};