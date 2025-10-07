<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class WarehouseSyncProducts extends Command
{
    protected $signature = 'warehouse:sync-products';
    protected $description = 'Sync products from Panel to warehouse_products table';

    public function handle(): int
    {
        $base = config('app.url'); // http://localhost:9000
        $url  = rtrim($base, '/') . '/api/warehouse-products/sync';

        $resp = Http::acceptJson()->post($url);
        if ($resp->failed()) {
            $this->error('Sync failed: ' . $resp->body());
            return self::FAILURE;
        }
        $this->info('Sync OK: ' . json_encode($resp->json()));
        return self::SUCCESS;
    }
}
