<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_management', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->string('nama');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('nomor_telp')->nullable();
            $table->unsignedBigInteger('role');
            $table->uuid('company_id')->nullable();
            $table->enum('status', ['Aktif','Tidak Aktif'])->default('Aktif');
            $table->string('foto')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_management');
    }
};
