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
        Schema::table('customer_product_instances', function (Blueprint $table) {
            if (!Schema::hasColumn('customer_product_instances', 'subscription_instance_id'))
                $table->uuid('subscription_instance_id')->after('order_id')->nullable()->unique();

            if (!Schema::hasColumn('customer_product_instances', 'product_name'))
                $table->string('product_name')->after('product_code')->nullable();

            if (!Schema::hasColumn('customer_product_instances', 'package_code')) $table->string('package_code')->after('product_name')->nullable();
            if (!Schema::hasColumn('customer_product_instances', 'package_name')) $table->string('package_name')->after('package_code')->nullable();
            if (!Schema::hasColumn('customer_product_instances', 'duration_code'))$table->string('duration_code')->after('package_name')->nullable();
            if (!Schema::hasColumn('customer_product_instances', 'duration_name'))$table->string('duration_name')->after('duration_code')->nullable();

            if (!Schema::hasColumn('customer_product_instances', 'start_date')) $table->date('start_date')->after('duration_name')->nullable()->index();
            if (!Schema::hasColumn('customer_product_instances', 'end_date'))   $table->date('end_date')->after('start_date')->nullable()->index();
            if (!Schema::hasColumn('customer_product_instances', 'is_active'))  $table->boolean('is_active')->after('end_date')->default(false)->index();

            if (!Schema::hasColumn('customer_product_instances', 'midtrans_order_id'))
                $table->string('midtrans_order_id')->after('is_active')->nullable()->index();

            if (!Schema::hasColumn('customer_product_instances', 'status')) $table->string('status', 30)->after('midtrans_order_id')->default('active')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_product_instances', function (Blueprint $table) {
            $table->dropColumn([
                'subscription_instance_id','product_name',
                'package_code','package_name','duration_code','duration_name',
                'start_date','end_date','is_active','midtrans_order_id','status'
            ]);
        });
    }
};
