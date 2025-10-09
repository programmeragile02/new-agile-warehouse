<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::create('customer_product_instance_profiles', function (Blueprint $table) {
      $table->id();
      // PK CPI kamu bertipe CHAR(36)/UUID → pakai uuid juga di FK
      $table->uuid('customer_product_instance_id');
      $table->string('customer_name')->nullable();
      $table->string('customer_email')->nullable()->index();
      $table->string('customer_phone', 40)->nullable()->index();
      $table->timestamps();

      // beri nama index UNIQUE yang pendek (hindari auto-name yang kepanjangan)
      $table->unique('customer_product_instance_id', 'cpi_prof_uidx');

      // foreign key dengan nama pendek juga
      $table->foreign('customer_product_instance_id', 'cpi_prof_fk')
            ->references('id')->on('customer_product_instances')
            ->cascadeOnUpdate()
            ->cascadeOnDelete();
    });
  }

  public function down(): void {
    // drop constraint dulu biar aman
    Schema::table('customer_product_instance_profiles', function (Blueprint $table) {
      // pakai nama yang sama seperti saat create
      $table->dropForeign('cpi_prof_fk');
      $table->dropUnique('cpi_prof_uidx');
    });

    Schema::dropIfExists('customer_product_instance_profiles');
  }
};