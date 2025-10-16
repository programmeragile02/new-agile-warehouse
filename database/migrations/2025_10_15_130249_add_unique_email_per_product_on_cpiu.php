<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::table('customer_product_instance_users', function (Blueprint $t) {
      $t->unique(['product_code','email'], 'uq_cpiu_prod_email'); // ← kunci utamanya
    });
  }
  public function down(): void {
    Schema::table('customer_product_instance_users', function (Blueprint $t) {
      $t->dropUnique('uq_cpiu_prod_email');
    });
  }
};