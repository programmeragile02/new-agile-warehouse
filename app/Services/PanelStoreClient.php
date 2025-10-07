<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

class PanelStoreClient
{
    protected ?Client $http = null;
    protected string $key = '';

    public function __construct()
    {
        $base = trim((string) config('services.panel.base', ''));
        $this->key = (string) config('services.panel.key', '');

        if ($base !== '') {
            $this->http = new Client([
                'base_uri' => rtrim($base, '/') . '/',
                'timeout'  => 10,
            ]);
        }
    }

    protected function ensureClient(): void
    {
        if ($this->http === null) {
            $base = trim((string) config('services.panel.base', ''));
            if ($base === '') {
                throw new \RuntimeException('Panel base URL is not configured');
            }
            $this->http = new Client([
                'base_uri' => rtrim($base, '/') . '/',
                'timeout'  => 10,
            ]);
        }
    }

    protected function headers(): array
    {
        // Jika nanti perlu service key / bearer, taruh di sini.
        $headers = ['Accept' => 'application/json'];
        if ($this->key !== '') {
            $headers['X-SERVICE-KEY'] = $this->key;
        }
        return $headers;
    }

    /** GET /catalog/products (Panel) */
    public function listProducts(array $query = []): array
    {
        try {
            $this->ensureClient();
            $res = $this->http->get('catalog/products', [
                'headers' => $this->headers(),
                'query'   => $query,
            ]);
            return [
                'ok'     => true,
                'status' => $res->getStatusCode(),
                'json'   => json_decode($res->getBody()->getContents(), true),
            ];
        } catch (GuzzleException $e) {
            return ['ok' => false, 'status' => 0, 'error' => $e->getMessage()];
        } catch (\Throwable $e) {
            return ['ok' => false, 'status' => 0, 'error' => $e->getMessage()];
        }
    }

    /** GET /catalog/products/{codeOrId} (Panel) */
    public function getProduct(string $codeOrId): array
    {
        try {
            $this->ensureClient();
            $res = $this->http->get("catalog/products/{$codeOrId}", [
                'headers' => $this->headers(),
            ]);
            return [
                'ok'     => true,
                'status' => $res->getStatusCode(),
                'json'   => json_decode($res->getBody()->getContents(), true),
            ];
        } catch (GuzzleException $e) {
            return ['ok' => false, 'status' => 0, 'error' => $e->getMessage()];
        } catch (\Throwable $e) {
            return ['ok' => false, 'status' => 0, 'error' => $e->getMessage()];
        }
    }

     public function getPackageMatrix(string $productCode, string $packageCode): array
    {
        try {
            $this->ensureClient();
            $res = $this->http->get("store/packages/{$productCode}/{$packageCode}/matrix", [
                'headers' => $this->headers(),
            ]);
            return [
                'ok'     => true,
                'status' => $res->getStatusCode(),
                'json'   => json_decode($res->getBody()->getContents(), true),
            ];
        } catch (GuzzleException $e) {
            return ['ok' => false, 'status' => 0, 'error' => $e->getMessage()];
        } catch (\Throwable $e) {
            return ['ok' => false, 'status' => 0, 'error' => $e->getMessage()];
        }
    }
    public function getOfferingMatrix(string $product, string $offering): array
{
    try {
        $this->ensureClient();
        $res = $this->http->get("store/offerings/{$product}/{$offering}/matrix", [
            'headers' => $this->headers(), // otomatis tambah X-SERVICE-KEY kalau ada
        ]);
        return [
            'ok'     => true,
            'status' => $res->getStatusCode(),
            'json'   => json_decode($res->getBody()->getContents(), true),
        ];
    } catch (\GuzzleHttp\Exception\GuzzleException $e) {
        return ['ok' => false, 'status' => 0, 'error' => $e->getMessage()];
    } catch (\Throwable $e) {
        return ['ok' => false, 'status' => 0, 'error' => $e->getMessage()];
    }
}
}
