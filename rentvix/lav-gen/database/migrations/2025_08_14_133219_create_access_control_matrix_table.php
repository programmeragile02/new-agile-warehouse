<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        Schema::create('access_control_matrix', function (Blueprint $table) {
            $table->id();

            // FK level user (ganti nama tabel jika berbeda)
            $table->foreignId('user_level_id')
                ->constrained('level_user')
                ->cascadeOnDelete();

            // FK menu — sekarang boleh NULL agar jalur menu_key bisa dipakai
            $table->foreignId('menu_id')
                ->nullable()
                ->constrained('mst_menus')
                ->nullOnDelete();

            // identifier dinamis
            $table->string('menu_key', 191)->nullable();

            // izin
            $table->boolean('view')->default(false);
            $table->boolean('add')->default(false);
            $table->boolean('edit')->default(false);
            $table->boolean('delete')->default(false);
            $table->boolean('approve')->default(false);

            $table->timestamps();

            // Index & unik
            $table->index('user_level_id');
            $table->index('menu_id');

            // Unik per jalur; MySQL mengizinkan banyak NULL, aman untuk kombinasi ini
            $table->unique(['user_level_id', 'menu_key'], 'acm_userlevel_menukey_uq');
            $table->unique(['user_level_id', 'menu_id'], 'acm_userlevel_menuid_uq');
        });

        // (Opsional, MySQL 8+) Pastikan minimal salah satu kolom terisi
        // Jika pakai MySQL < 8, baris berikut bisa dihapus.
        DB::statement("
            ALTER TABLE access_control_matrix
            ADD CONSTRAINT acm_menuid_or_menukey_chk
            CHECK ((menu_id IS NOT NULL) OR (menu_key IS NOT NULL))
        ");
    }

    public function down(): void {
        // Hapus constraint CHECK jika dibuat
        try {
            DB::statement("ALTER TABLE access_control_matrix DROP CHECK acm_menuid_or_menukey_chk");
        } catch (\Throwable $e) {
            // abaikan bila DB tidak mendukung CHECK
        }

        Schema::dropIfExists('access_control_matrix');
    }
};
