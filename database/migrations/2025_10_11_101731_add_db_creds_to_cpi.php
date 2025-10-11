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
            $table->string('database_username')->nullable()->after('database_name');
            $table->text('database_password_enc')->nullable()->after('database_username'); // terenkripsi (Crypt)
            $table->string('database_host')->nullable()->after('database_password_enc');
            $table->string('database_port')->nullable()->after('database_host');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_product_instances', function (Blueprint $table) {
            $table->dropColumn(['database_username','database_password_enc','database_host','database_port']);
        });
    }
};
