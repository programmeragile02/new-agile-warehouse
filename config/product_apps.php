<?php
// config/product_apps.php
return [
    'registry' => (function () {
        $env = env('PRODUCT_APPS_REGISTRY', null);
        if ($env) {
            $rows = json_decode($env, true);
            if (is_array($rows)) return $rows;
        }
        return [
            ['code' => 'TIRTABENING', 'base' => 'http://localhost:3011/api/public', 'key' => 'tb-public-key-123'],
            ['code' => 'RENTVIX',     'base' => 'http://localhost:3022/api/public', 'key' => 'rv-public-key-xyz'],
            ['code' => 'POSKITA',     'base' => 'http://localhost:3033/api/public', 'key' => 'pos-public-key-789'],
        ];
    })(),
];
