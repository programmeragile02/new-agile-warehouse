<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        Schema::table('customer_product_instance_users', function (Blueprint $t) {
            // Attempt drop old unique index; name sesuai migration lama
            // If the index doesn't exist, this will error — we guard using raw check.
            // Use DB::statement to drop only if exists (MySQL raw).
        });

        // drop index if exists (MySQL)
        DB::statement("
            SET @idx := (
                SELECT INDEX_NAME
                FROM INFORMATION_SCHEMA.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'customer_product_instance_users'
                  AND INDEX_NAME = 'uq_cpiu_prod_email'
                LIMIT 1
            );
        ");
        DB::statement("DROP INDEX IF EXISTS uq_cpiu_prod_email ON customer_product_instance_users;");

        // Now add composite unique index
        Schema::table('customer_product_instance_users', function (Blueprint $t) {
            $t->unique(['product_code', 'company_id', 'email'], 'cpiu_product_company_email_unique');
        });
    }

    public function down(): void {
        Schema::table('customer_product_instance_users', function (Blueprint $t) {
            $t->dropUnique('cpiu_product_company_email_unique');
        });

        // Recreate old unique index (if you want rollback to previous state)
        Schema::table('customer_product_instance_users', function (Blueprint $t) {
            $t->unique(['product_code', 'email'], 'uq_cpiu_prod_email');
        });
    }
};