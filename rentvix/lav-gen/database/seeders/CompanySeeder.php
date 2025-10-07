<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Company;

class CompanySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // contoh 1 perusahaan default
        Company::create([
            // id otomatis UUID via booted() di model
            'password' => 'admin123', // auto hash via casts
        ]);

        // kalau mau beberapa sekaligus, bisa array:
        /*
        $companies = [
            ['password' => 'secret123'],
            ['password' => 'testing456'],
        ];

        foreach ($companies as $c) {
            Company::create($c);
        }
        */
    }
}
