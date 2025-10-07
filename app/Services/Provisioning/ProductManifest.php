<?php

namespace App\Services\Provisioning;

class ProductManifest
{
    public function get(string $productCode): array
    {
        $all = config('products', []);
        $key = strtoupper($productCode);

        if (!isset($all[$key])) {
            throw new \RuntimeException("Product manifest not found for {$productCode}");
        }
        return $all[$key];
    }
}
