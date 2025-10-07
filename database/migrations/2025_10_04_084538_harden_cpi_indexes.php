<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private string $table = 'customer_product_instances';

    public function up(): void
    {
        // Pastikan tabel ada
        if (!Schema::hasTable($this->table)) {
            throw new RuntimeException("Table {$this->table} not found.");
        }

        // Helper cek index/unique by name
        $hasIndex = function (string $indexName): bool {
            $schema = DB::getDatabaseName();
            $sql = "SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS 
                    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1";
            return (bool) DB::selectOne($sql, [$schema, $this->table, $indexName]);
        };

        // 1) Idempotency per order: UNIQUE (order_id, product_code)
        if (!$hasIndex('cpi_order_product_unique')) {
            Schema::table($this->table, function (Blueprint $t) {
                $t->unique(['order_id', 'product_code'], 'cpi_order_product_unique');
            });
        }

        // 2) Identitas instance langganan: UNIQUE (subscription_instance_id)
        //    Catatan: kolom boleh nullable; MySQL mengizinkan banyak NULL pada UNIQUE.
        if (Schema::hasColumn($this->table, 'subscription_instance_id') && !$hasIndex('cpi_subscription_unique')) {
            Schema::table($this->table, function (Blueprint $t) {
                $t->unique(['subscription_instance_id'], 'cpi_subscription_unique');
            });
        }

        // 3) Hindari bentrok company_id antar-produk: UNIQUE (product_code, company_id)
        if (Schema::hasColumn($this->table, 'company_id') && !$hasIndex('cpi_company_per_product_unique')) {
            Schema::table($this->table, function (Blueprint $t) {
                $t->unique(['product_code', 'company_id'], 'cpi_company_per_product_unique');
            });
        }

        // 4) Indeks cepat untuk resolver: (company_id, product_code, is_active, end_date, created_at)
        if (!$hasIndex('cpi_resolve_idx')) {
            Schema::table($this->table, function (Blueprint $t) {
                $t->index(['company_id', 'product_code', 'is_active', 'end_date', 'created_at'], 'cpi_resolve_idx');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable($this->table)) return;

        Schema::table($this->table, function (Blueprint $t) {
            // Drop in reverse order (aman kalau belum ada—Laravel abaikan jika tak ditemukan di sebagian driver)
            $t->dropIndex('cpi_resolve_idx');
            $t->dropUnique('cpi_company_per_product_unique');
            $t->dropUnique('cpi_subscription_unique');
            $t->dropUnique('cpi_order_product_unique');
        });
    }
};
