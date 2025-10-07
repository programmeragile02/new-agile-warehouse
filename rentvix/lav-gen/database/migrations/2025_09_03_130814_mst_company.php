<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mst_company', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->string('company_id'); 
            $table->string('password'); // otomatis akan di-hash lewat model
            $table->string('name')->nullable(); 
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mst_company');
    }
};
