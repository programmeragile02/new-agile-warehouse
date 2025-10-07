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
        Schema::table('provisioning_jobs', function (Blueprint $table) {
            if (!Schema::hasColumn('provisioning_jobs', 'product_name')) $table->string('product_name')->after('product_id')->nullable();
            if (!Schema::hasColumn('provisioning_jobs', 'package'))  $table->json('package')->after('product_name')->nullable();
            if (!Schema::hasColumn('provisioning_jobs', 'duration')) $table->json('duration')->after('package')->nullable();
            
            if (!Schema::hasColumn('provisioning_jobs', 'intent'))       $table->string('intent', 20)->after('duration')->nullable()->index();
            if (!Schema::hasColumn('provisioning_jobs', 'base_order_id'))$table->uuid('base_order_id')->after('intent')->nullable()->index();

            if (!Schema::hasColumn('provisioning_jobs', 'start_date'))   $table->date('start_date')->after('base_order_id')->nullable()->index();
            if (!Schema::hasColumn('provisioning_jobs', 'end_date'))     $table->date('end_date')->after('start_date')->nullable()->index();
            if (!Schema::hasColumn('provisioning_jobs', 'is_active'))    $table->boolean('is_active')->after('end_date')->default(false)->index();

            if (!Schema::hasColumn('provisioning_jobs', 'midtrans_order_id')) $table->string('midtrans_order_id')->after('is_active')->nullable()->index();
            if (!Schema::hasColumn('provisioning_jobs', 'subscription_instance_id')) $table->uuid('subscription_instance_id')->after('midtrans_order_id')->nullable()->index();

            // simpan package/duration label
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('provisioning_jobs', function (Blueprint $table) {
            $table->dropColumn([
                'intent','base_order_id','product_name',
                'start_date','end_date','is_active',
                'midtrans_order_id','subscription_instance_id',
                'package','duration',
            ]);
        });
    }
};
