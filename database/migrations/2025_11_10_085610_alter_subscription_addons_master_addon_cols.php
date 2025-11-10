<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Tambah kolom baru bila belum ada
        Schema::table('subscription_addons', function (Blueprint $t) {
            if (!Schema::hasColumn('subscription_addons','addon_code'))     $t->string('addon_code', 80)->nullable()->after('feature_code');
            if (!Schema::hasColumn('subscription_addons','qty'))            $t->unsignedInteger('qty')->default(1)->after('currency');
            if (!Schema::hasColumn('subscription_addons','unit_price'))     $t->unsignedBigInteger('unit_price')->nullable()->after('qty');
            if (!Schema::hasColumn('subscription_addons','pricing_mode'))   $t->string('pricing_mode', 20)->nullable()->after('unit_price'); // flat|per_unit
            if (!Schema::hasColumn('subscription_addons','kind'))           $t->string('kind', 20)->nullable()->after('pricing_mode');        // feature|master|seat|unit
            if (!Schema::hasColumn('subscription_addons','currency'))       $t->string('currency', 8)->nullable()->after('kind');

            if (!Schema::hasColumn('subscription_addons','billable_from_start'))  $t->date('billable_from_start')->nullable()->after('purchased_at');
            if (!Schema::hasColumn('subscription_addons','follow_base_duration')) $t->boolean('follow_base_duration')->default(true)->after('billable_from_start');
            if (!Schema::hasColumn('subscription_addons','cycle_code'))           $t->string('cycle_code', 20)->nullable()->after('follow_base_duration');
        });

        // Tambah unique index idempoten (cek pakai SHOW INDEX)
        if (!$this->indexExists('subscription_addons', 'uq_addons_instance_feature')) {
            Schema::table('subscription_addons', function (Blueprint $t) {
                $t->unique(['subscription_instance_id','feature_code'],'uq_addons_instance_feature');
            });
        }

        if (!$this->indexExists('subscription_addons', 'uq_addons_instance_addon')) {
            Schema::table('subscription_addons', function (Blueprint $t) {
                $t->unique(['subscription_instance_id','addon_code'],'uq_addons_instance_addon');
            });
        }

        // (Opsional) Backfill ringan agar data lama konsisten
        // Hati-hati di shared env; jalankan sekali saja.
        // try {
        //     DB::table('subscription_addons')->whereNull('kind')->update(['kind' => 'feature']);
        //     DB::table('subscription_addons')->whereNull('pricing_mode')->update(['pricing_mode' => 'flat']);
        //     DB::table('subscription_addons')->whereNull('qty')->update(['qty' => 1]);
        //     DB::table('subscription_addons')
        //         ->whereNull('unit_price')
        //         ->update(['unit_price' => DB::raw('price_amount')]);
        // } catch (\Throwable $e) {
        //     // biarkan non-fatal; catat kalau perlu
        //     \Log::warning('Backfill subscription_addons skipped: '.$e->getMessage());
        // }
    }

    public function down(): void
    {
        // optional: tidak perlu rollback index/kolom jika sudah dipakai luas
        // kalau ingin lengkap, drop index dengan nama yang sama:
        // Schema::table('subscription_addons', function (Blueprint $t) {
        //     $t->dropUnique('uq_addons_instance_feature');
        //     $t->dropUnique('uq_addons_instance_addon');
        //     $t->dropColumn([...]);
        // });
    }

    private function indexExists(string $table, string $indexName): bool
    {
        // SHOW INDEX mengembalikan baris per kolom index;
        // cukup cek Key_name cocok.
        $rows = DB::select("SHOW INDEX FROM `{$table}` WHERE `Key_name` = ?", [$indexName]);
        return count($rows) > 0;
    }
};