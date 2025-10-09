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
            $table->timestamp('renewal_reminder_last_sent_at')->nullable()->index();
            $table->json('renewal_reminder_sent_days')->nullable(); // simpan daftar [30,14,7,3,1] yang sudah terkirim
            $table->index(['end_date', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_product_instances', function (Blueprint $table) {
            $table->dropColumn(['renewal_reminder_last_sent_at','renewal_reminder_sent_days']);
            $table->dropIndex(['customer_product_instances_end_date_status_index']);
        });
    }
};
