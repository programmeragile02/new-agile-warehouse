<?php

return [
    // kunci yang harus dikirim FE/BE produk di header X-API-KEY
    'client_key' => env('WAREHOUSE_TRUSTED_KEYS', 'dev-panel-key-abc'),
];
