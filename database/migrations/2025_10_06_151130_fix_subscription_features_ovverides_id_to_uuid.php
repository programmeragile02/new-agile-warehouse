<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Lepas AUTO_INCREMENT & ubah menjadi UUID (char(36))
        DB::statement('ALTER TABLE subscription_feature_overrides MODIFY id CHAR(36) NOT NULL');
        DB::statement('ALTER TABLE subscription_feature_overrides DROP PRIMARY KEY');
        DB::statement('ALTER TABLE subscription_feature_overrides ADD PRIMARY KEY (id)');
    }

    public function down(): void
    {
        // Revert ke BIGINT auto increment (opsional)
        DB::statement('ALTER TABLE subscription_feature_overrides DROP PRIMARY KEY');
        DB::statement('ALTER TABLE subscription_feature_overrides MODIFY id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT');
        DB::statement('ALTER TABLE subscription_feature_overrides ADD PRIMARY KEY (id)');
    }
};