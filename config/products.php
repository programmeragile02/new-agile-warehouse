<?php

return [
    'RENTVIX' => [
        'name'  => 'RentVix Pro',
        'stack' => 'laravel',
        'paths' => [
            'migrations' => 'rentvix/lav-gen/database/migrations',
            'seeders'    => [
                'menu'  => 'rentvix/lav-gen/database/seeders/MenuSeeder.php',
                'level' => 'rentvix/lav-gen/database/seeders/LevelUserSeeder.php',
            ],
        ],
        'url_template' => '{base}/rentvix-{suffix}',
    ],

    'NATABANYU' => [
        'name'  => 'Nata Banyu',
        'stack' => 'next-prisma',
        'paths' => [
            // ROOT folder project Next.js + Prisma
            'next_root' => base_path('TIRTABENING'),
        ],
        'seed' => [
            // jika pakai prisma/seed.ts → true (opsional)
            'use_prisma_seed' => false,
            // kalau punya seeder khusus tenant
            'tenant_script' => 'scripts/tenant-seed.ts'
        ],
        'bootstrap' => [
            'script' => 'scripts/bootstrap-tenant.ts'
        ],
        'url_template' => '{base}/natabanyu-{suffix}',
    ],
];
