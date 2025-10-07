<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class LevelUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (!Schema::connection('tenant')->hasTable('level_user')) {
            \Log::warning('LevelUserSeeder: level_user table not found in tenant');
            return;
        }

        DB::connection('tenant')->table('level_user')->updateOrInsert(
            ['id' => 1],
            [
                'nama_level' => 'Super Admin',
                'deskripsi'  => 'Level dengan akses penuh ke seluruh sistem',
                'status'     => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        \Log::info('LevelUserSeeder: upsert id=1');
    }
}
