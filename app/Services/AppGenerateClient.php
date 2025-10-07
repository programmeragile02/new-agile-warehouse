<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Psr\Http\Message\ResponseInterface;

class AppGenerateClient
{
    protected ?Client $http = null;
    protected string $key = '';

    public function __construct()
    {
        $base      = trim((string) config('services.appgenerate.base', ''));
        $this->key = (string) config('services.appgenerate.key', '');

        if ($base !== '') {
            $this->http = new Client([
                'base_uri' => rtrim($base, '/') . '/',
                'timeout'  => 15,
            ]);
        }
    }

    protected function ensureClient(): void
    {
        if ($this->http !== null) return;

        $base = trim((string) config('services.appgenerate.base', ''));
        if ($base === '') {
            throw new \RuntimeException('AppGenerate base URL is not configured');
        }
        $this->http = new Client([
            'base_uri' => rtrim($base, '/') . '/',
            'timeout'  => 15,
        ]);
    }

    protected function headers(): array
    {
        return [
            'Accept'   => 'application/json',
            'X-AG-KEY' => $this->key, // <- harus cocok dengan middleware VerifyGatewayKey di AppGenerate
        ];
    }

    protected function ok(ResponseInterface $res, array $json): array
    {
        return [
            'ok'     => true,
            'status' => $res->getStatusCode(),
            'json'   => $json,
            'data'   => $json['data'] ?? null,
        ];
    }

    protected function fail(?ResponseInterface $res, \Throwable $e = null, ?string $fallback = null): array
    {
        $status = $res?->getStatusCode() ?? 0;
        $body   = null;

        if ($res) {
            try {
                $body = (string) $res->getBody();
                $try  = json_decode($body, true);
                if (is_array($try) && isset($try['message'])) {
                    $fallback = $try['message'];
                }
            } catch (\Throwable) {}
        }

        return [
            'ok'     => false,
            'status' => $status,
            'error'  => $e?->getMessage() ?? $fallback ?? ($body ?: 'Unknown error'),
        ];
    }

    protected function requestJson(string $method, string $path, array $opts = []): array
    {
        try {
            $this->ensureClient();
            $res  = $this->http->request($method, ltrim($path, '/'), $opts);
            $json = json_decode((string) $res->getBody(), true) ?? [];
            if (!is_array($json)) $json = [];
            return $this->ok($res, $json);
        } catch (GuzzleException $e) {
            $res = method_exists($e, 'getResponse') ? $e->getResponse() : null;
            return $this->fail($res, $e);
        } catch (\Throwable $e) {
            return $this->fail(null, $e);
        }
    }

    /** ----------------- FEATURES ----------------- */

    public function listFeatures(array $query = []): array
    {
        return $this->requestJson('GET', 'public/features', [
            'headers' => $this->headers(),
            'query'   => $query,
        ]);
    }

    public function featuresByProduct(string $idOrCode, array $query = []): array
    {
        $id = rawurlencode($idOrCode);
        return $this->requestJson('GET', "public/features/by-product/{$id}", [
            'headers' => $this->headers(),
            'query'   => $query,
        ]);
    }

    public function listAllFeatures(array $baseQuery = []): array
    {
        $try = $this->listFeatures($baseQuery + ['paginate' => 0]);
        if ($try['ok']) {
            $data = $try['json']['data'] ?? (is_array($try['json']) ? $try['json'] : []);
            if (is_array($data)) {
                return ['ok' => true, 'status' => $try['status'], 'data' => $data, 'json' => $try['json']];
            }
        }
        $page = 1; $per = (int)($baseQuery['per_page'] ?? 100); $all = [];
        while (true) {
            $resp = $this->listFeatures($baseQuery + ['page' => $page, 'per_page' => $per]);
            if (!$resp['ok']) return ['ok' => false, 'status' => $resp['status'], 'error' => $resp['error'] ?? 'Unknown'];
            $json = $resp['json'];
            $rows = $json['data'] ?? (is_array($json) ? $json : []);
            if (!is_array($rows) || !count($rows)) break;
            $all = array_merge($all, $rows);
            $hasMore = !empty($json['links']['next'])
                || (isset($json['meta']['current_page'], $json['meta']['last_page']) && (int)$json['meta']['current_page'] < (int)$json['meta']['last_page']);
            if (!$hasMore) break;
            $page++;
        }
        return ['ok' => true, 'status' => 200, 'data' => $all];
    }

    /** ----------------- MENUS ----------------- */

    /** GET /menus?product_code=RENTVIX */
    public function listMenus(array $query = []): array
    {
        return $this->requestJson('GET', 'menus', [
            'headers' => $this->headers(),
            'query'   => $query,
        ]);
    }

    /** GET /menus/tree?product_code=RENTVIX */
    public function menusTree(?string $productCode = null): array
    {
        $query = [];
        if ($productCode) $query['product_code'] = $productCode;
        return $this->requestJson('GET', 'menus/tree', [
            'headers' => $this->headers(),
            'query'   => $query,
        ]);
    }

    /** Convenience: by product (pakai /menus?product_code=...) */
    public function menusByProduct(string $idOrCode, array $query = []): array
    {
        // penting: gunakan endpoint /menus, BUKAN /public/menus/*
        $query = array_merge($query, ['product_code' => $idOrCode]);
        return $this->listMenus($query);
    }
}
