<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\FeatureBuilder;
use Illuminate\Http\Request;

class FeaturePublicController extends Controller
{
    /**
     * GET /api/public/features
     * Query:
     * - product_code
     * - product_id
     * - type=category|feature|subfeature
     * - include_inactive=1
     * - q=keyword
     * - paginate=0|1 (default 0 agar gateway mudah)
     * - per_page
     */
    public function index(Request $req)
    {
        $q = FeatureBuilder::query();

        if (!$req->boolean('include_inactive')) {
            $q->where('is_active', true);
        }
        if ($pc = $req->query('product_code')) {
            $q->where('product_code', $pc);
        }
        if ($pid = $req->query('product_id')) {
            $q->where('product_id', $pid);
        }
        if ($type = $req->query('type')) {
            $q->where('type', $type);
        }
        if ($search = $req->query('q')) {
            $q->where(function ($w) use ($search) {
                $w->where('name', 'like', "%{$search}%")
                  ->orWhere('feature_code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $q->whereIn('type', ['feature','subfeature']); // expose hanya feature/subfeature
        $q->orderBy('product_code')
          ->orderBy('parent_id')
          ->orderBy('order_number');

        // default: non-paginate agar gateway gampang konsumsi
        if ($req->boolean('paginate', false)) {
            $per = max(1, min(200, (int) $req->query('per_page', 50)));
            $page = $q->paginate($per);
            return response()->json($page); // paginator standar laravel
        }

        $data = $q->get()->map(fn($r) => $this->mapRow($r))->all();
        return response()->json(['data' => $data]);
    }

    /**
     * GET /api/public/features/by-product/{idOrCode}
     * Mengembalikan FLAT LIST di key 'data'
     */
    public function byProduct(string $idOrCode, Request $req)
    {
        $q = FeatureBuilder::query();

        if (!$req->boolean('include_inactive')) {
            $q->where('is_active', true);
        }

        // heuristik: kalau mengandung '-' panjang, anggap id; selain itu code
        $looksLikeId = preg_match('/^[a-z0-9-]{8,}$/i', $idOrCode) === 1;
        $looksLikeId
            ? $q->where('product_id', $idOrCode)
            : $q->where('product_code', $idOrCode);

        if ($type = $req->query('type')) {
            $q->where('type', $type);
        }

        $q->whereIn('type', ['feature','subfeature'])
          ->orderBy('parent_id')
          ->orderBy('order_number');

        $data = $q->get()->map(fn($r) => $this->mapRow($r))->all();

        return response()->json(['data' => $data]); // ← FLAT LIST
    }

    protected function mapRow(FeatureBuilder $r): array
    {
        $itemType = strtoupper($r->type) === 'SUBFEATURE' ? 'SUBFEATURE' : 'FEATURE';
        $name = (string)($r->name ?? '');
        if ($name === '') $name = (string)$r->feature_code; // fallback terakhir

        return [
            'id'              => (string)$r->id,
            'feature_code'    => (string)$r->feature_code,
            'name'            => $name,
            'description'     => (string)($r->description ?? ''),
            'module_name'     => 'General',
            'item_type'       => $itemType,
            'parent_id'       => $r->parent_id ? (string)$r->parent_id : null, // penting utk tree
            'is_active'       => (bool)$r->is_active,
            'order_number'    => (int)$r->order_number,
            'price_addon'     => (float)($r->price_addon ?? 0),
            'trial_available' => (bool)($r->trial_available ?? false),
            'trial_days'      => isset($r->trial_days) ? (int)$r->trial_days : null,
            'product_code'    => (string)$r->product_code,
            'created_at'      => $r->created_at,
            'updated_at'      => $r->updated_at,
        ];
    }
}
