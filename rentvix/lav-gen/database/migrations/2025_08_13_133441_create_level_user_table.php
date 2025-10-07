<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('level_user', function (Blueprint $table) {
            $table->id();
            $table->string('nama_level');
            $table->text('deskripsi');
            $table->enum('status', ['Aktif', 'Tidak Aktif']);

            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('level_user');
    }
};