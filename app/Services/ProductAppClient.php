<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

class ProductAppClient
{
    /** @var array<string, array{base:string,key:string}> */
    protected array $map = [];

    public function __construct()
    {
        $rows = (array) config('product_apps.registry', []);
        foreach ($rows as $r) {
            $code = strtoupper(trim((string) ($r['code'] ?? '')));
            $base = rtrim((string) ($r['base'] ?? ''), '/');
            $key  = (string) ($r['key'] ?? '');
            if ($code && $base) {
                $this->map[$code] = ['base' => $base, 'key' => $key];
            }
        }
    }

    protected function clientFor(string $productCode): ?Client
    {
        $p = $this->map[strtoupper($productCode)] ?? null;
        if (!$p) return null;
        return new Client([
            'base_uri' => $p['base'] . '/',
            'timeout'  => 15,
        ]);
    }

    protected function headersFor(string $productCode): array
    {
        $p = $this->map[strtoupper($productCode)] ?? null;
        return [
            'Accept'          => 'application/json',
            'X-PRODUCT-KEY'   => $p['key'] ?? '',
        ];
    }

    public function getProductMeta(string $code): array
    {
        $http = $this->clientFor($code);
        if (!$http) return ['ok' => false, 'status' => 404, 'error' => 'Unknown product code'];
        try {
            $res  = $http->get("catalog/products/{$code}", ['headers' => $this->headersFor($code)]);
            $json = json_decode((string) $res->getBody(), true) ?: [];
            return ['ok' => true, 'status' => $res->getStatusCode(), 'json' => $json, 'data' => $json['data'] ?? $json];
        } catch (GuzzleException $e) {
            $r = method_exists($e, 'getResponse') ? $e->getResponse() : null;
            return ['ok' => false, 'status' => $r?->getStatusCode() ?? 0, 'error' => $e->getMessage()];
        }
    }

    public function listFeatures(string $code): array
    {
        $http = $this->clientFor($code);
        if (!$http) return ['ok' => false, 'status' => 404, 'error' => 'Unknown product code'];
        try {
            $res  = $http->get("catalog/products/{$code}/features", ['headers' => $this->headersFor($code)]);
            $json = json_decode((string) $res->getBody(), true) ?: [];
            $rows = $json['data'] ?? (is_array($json) ? $json : []);
            return ['ok' => true, 'status' => $res->getStatusCode(), 'json' => $json, 'data' => is_array($rows) ? $rows : []];
        } catch (GuzzleException $e) {
            $r = method_exists($e, 'getResponse') ? $e->getResponse() : null;
            return ['ok' => false, 'status' => $r?->getStatusCode() ?? 0, 'error' => $e->getMessage()];
        }
    }

    public function listMenus(string $code): array
    {
        $http = $this->clientFor($code);
        if (!$http) return ['ok' => false, 'status' => 404, 'error' => 'Unknown product code'];
        try {
            $res  = $http->get("catalog/products/{$code}/menus", ['headers' => $this->headersFor($code)]);
            $json = json_decode((string) $res->getBody(), true) ?: [];
            $rows = $json['data'] ?? (is_array($json) ? $json : []);
            return ['ok' => true, 'status' => $res->getStatusCode(), 'json' => $json, 'data' => is_array($rows) ? $rows : []];
        } catch (GuzzleException $e) {
            $r = method_exists($e, 'getResponse') ? $e->getResponse() : null;
            return ['ok' => false, 'status' => $r?->getStatusCode() ?? 0, 'error' => $e->getMessage()];
        }
    }

    public function hasProduct(string $code): bool
{
    return isset($this->map[strtoupper($code)]);
}

}
