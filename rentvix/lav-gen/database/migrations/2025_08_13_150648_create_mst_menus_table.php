<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1) CREATE tanpa FK eksternal, dan parent_id belum di-foreign
        Schema::create('mst_menus', function (Blueprint $table) {
            $table->id();

            // pakai unsignedBigInteger + index, FK nanti (step 2)
            $table->unsignedBigInteger('parent_id')->nullable()->index();

            $table->tinyInteger('level')->default(1);
            $table->enum('type', ['group', 'module', 'menu', 'submenu'])->default('menu');
            $table->string('title');
            $table->string('icon')->nullable();
            $table->string('color', 32)->nullable();
            $table->integer('order_number')->default(0);

            // kolom terkait tabel eksternal, TANPA constrained()
            $table->unsignedBigInteger('crud_builder_id')->nullable()->index();
            $table->string('product_id', 64)->index()->nullable();
            $table->string('product_code', 64)->index()->nullable();
            $table->string('route_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('note')->nullable();

            // TANPA constrained('users') – cukup kolom + index
            $table->unsignedBigInteger('created_by')->nullable()->index();

            $table->softDeletes();
            $table->timestamps();
        });

        // 2) Baru tambahkan self-FK untuk parent_id setelah tabel ada
        Schema::table('mst_menus', function (Blueprint $table) {
            $table->foreign('parent_id')
                  ->references('id')->on('mst_menus')
                  ->cascadeOnDelete();
        });

        // Kalau suatu saat kamu PASTI punya tabel ini di workspace produk,
        // kamu bisa aktifkan FK berikut:
        /*
        Schema::table('mst_menus', function (Blueprint $table) {
            if (Schema::hasTable('crud_builders')) {
                $table->foreign('crud_builder_id')->references('id')->on('crud_builders')->nullOnDelete();
            }
            if (Schema::hasTable('users')) {
                $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            }
        });
        */
    }

    public function down(): void
    {
        Schema::table('mst_menus', function (Blueprint $table) {
            // drop FK kalau ada
            try { $table->dropForeign(['parent_id']); } catch (\Throwable $e) {}
            try { $table->dropForeign(['crud_builder_id']); } catch (\Throwable $e) {}
            try { $table->dropForeign(['created_by']); } catch (\Throwable $e) {}
        });
        Schema::dropIfExists('mst_menus');
    }
};