<?php

namespace App\Http\Controllers\Generate;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use App\Models\AccessControlMatrix;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MenuController extends Controller
{
    // GET /api/menus?product_code=RENTVIX&trash=with|only|none
    public function index(Request $req)
    {
        $productCode = $req->query('product_code');
        $trash = $req->query('trash', 'none');

        $q = Menu::query()->forProduct($productCode);
        if ($trash === 'with') $q->withTrashed();
        elseif ($trash === 'only') $q->onlyTrashed();

        return response()->json(['success' => true, 'data' => $q->orderBy('order_number')->get()]);
    }

 
   public function tree(Request $req)
    {
        $productCode     = $req->query('product_code');
        $includeInactive = $req->boolean('include_inactive', false);
        $levelId         = $req->query('level_id'); // <-- dipakai untuk prune

        // Ambil root + subtree
        $q = Menu::query();
        if ($productCode) {
            $q->forProduct($productCode);
        }
        if (!$includeInactive) {
            $q->active();
        }

        $roots = $q->whereNull('parent_id')
            ->orderBy('order_number')
            ->with(['recursiveChildren'])
            ->get();

        // Kumpulan menu yang diizinkan untuk level tertentu
        $allowedId  = null;
        $allowedKey = null;

        if (!empty($levelId)) {
            // izinkan berdasarkan view=1
            $allowedId  = AccessControlMatrix::query()
                ->where('user_level_id', $levelId)
                ->where('view', 1)
                ->whereNotNull('menu_id')
                ->pluck('menu_id')
                ->map(fn($v) => (int) $v)
                ->toArray();

            // opsional: kalau kamu juga pakai menu_key
            $allowedKey = AccessControlMatrix::query()
                ->where('user_level_id', $levelId)
                ->where('view', 1)
                ->whereNotNull('menu_key')
                ->pluck('menu_key')
                ->map(fn($v) => (string) $v)
                ->toArray();
        }

        // Normalisasi type
        $normalizeType = function (Menu $m): string {
            $t = strtolower((string) $m->type);
            if (in_array($t, ['group', 'module', 'menu', 'submenu'], true)) {
                // perlakukan 'submenu' sebagai kontainer juga
                return $t === 'submenu' ? 'module' : $t;
            }
            // fallback by level
            $lvl = (int) ($m->level ?? 0);
            return $lvl <= 0 ? 'group' : ($lvl === 1 ? 'module' : 'menu');
        };

        // Filter izin untuk node "menu" (leaf)
        $canView = function (Menu $m) use ($allowedId, $allowedKey): bool {
            // kalau tanpa level id, jangan prune (kompatibilitas lama)
            if ($allowedId === null && $allowedKey === null) return true;

            // kalau node bukan tipe menu, biarkan dulu (diputus di level anak)
            $t = strtolower((string) $m->type);
            $isMenuLike = $t === 'menu';

            // cek id/key
            $id  = (int) $m->id;
            $key = (string) ($m->menu_key ?? '');

            if ($isMenuLike) {
                $okId  = is_array($allowedId)  ? in_array($id, $allowedId, true) : true;
                $okKey = is_array($allowedKey) ? in_array($key, $allowedKey, true) : true;
                // kalau punya keduanya, cukup salah satu true
                return $okId || $okKey;
            }
            return true;
        };

        // Rekursif map + prune
        $mapNode = function (Menu $node) use (&$mapNode, $normalizeType, $canView) {
            $type = $normalizeType($node);

            // Map anak dulu
            $children = [];
            foreach ($node->recursiveChildren ?? [] as $ch) {
                $mapped = $mapNode($ch);
                if ($mapped) $children[] = $mapped;
            }

            // Kalau node ini "menu", putuskan boleh tampil atau tidak
            if ($type === 'menu') {
                if (!$canView($node)) {
                    return null; // tidak boleh view → buang
                }
            }

            // Kalau bukan leaflet tapi semua anak terbuang dan dia bukan 'menu', periksa:
            // - group/module tanpa anak → boleh tampil jika memang kontainer di desainmu masih ingin terlihat.
            //   Di sini kita tampilkan kontainernya hanya jika masih punya anak.
            if ($type !== 'menu' && empty($children)) {
                // group/module kosong → sembunyikan
                return null;
            }

            return [
                'id'         => $node->id,
                'title'      => $node->title,
                'type'       => $type,
                'route_path' => $node->route_path,
                'icon'       => $node->icon,
                'color'      => $node->color,
                'children'   => $children,
            ];
        };

        $data = [];
        foreach ($roots as $r) {
            $mapped = $mapNode($r);
            if ($mapped) $data[] = $mapped;
        }

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }


    public function store(Request $req)
    {
        $data = $req->validate([
            'title'        => ['required', 'string', 'max:255'],
            'type'         => ['required', 'in:group,module,menu,submenu'],
            'product_code' => ['nullable', 'string', 'max:64'],
            'parent_id'    => ['nullable', 'exists:mst_menus,id'],
            'icon'         => ['nullable', 'string', 'max:100'],
            'color'        => ['nullable', 'string', 'max:32'],
            'order_number' => ['nullable', 'integer'],
            'crud_builder_id' => ['nullable', 'exists:crud_builders,id'],
            'route_path'   => ['nullable', 'string', 'max:255'],
            'is_active'    => ['nullable', 'boolean'],
            'note'         => ['nullable', 'string'],
            'created_by'   => ['nullable', 'exists:users,id'],
        ]);

        $data['level'] = !empty($data['parent_id'])
            ? (int) (Menu::find($data['parent_id'])->level ?? 0) + 1
            : 1;

        $row = Menu::create($data);
        return response()->json(['success' => true, 'data' => $row], 201);
    }

    public function show(string $id)
    {
        return response()->json(['success' => true, 'data' => Menu::withTrashed()->findOrFail($id)]);
    }

    public function update(Request $req, string $id)
    {
        $data = $req->validate([
            'title'        => ['sometimes', 'string', 'max:255'],
            'type'         => ['sometimes', 'in:group,module,menu,submenu'],
            'product_code' => ['sometimes', 'nullable', 'string', 'max:64'],
            'parent_id'    => ['sometimes', 'nullable', 'exists:mst_menus,id'],
            'icon'         => ['sometimes', 'nullable', 'string', 'max:100'],
            'color'        => ['sometimes', 'nullable', 'string', 'max:32'],
            'order_number' => ['sometimes', 'integer'],
            'crud_builder_id' => ['sometimes', 'nullable', 'exists:crud_builders,id'],
            'route_path'   => ['sometimes', 'nullable', 'string', 'max:255'],
            'is_active'    => ['sometimes', 'boolean'],
            'note'         => ['sometimes', 'nullable', 'string'],
            'created_by'   => ['sometimes', 'nullable', 'exists:users,id'],
        ]);

        $row = Menu::withTrashed()->findOrFail($id);

        if (array_key_exists('parent_id', $data)) {
            $parentLevel = $data['parent_id'] ? ((int)(Menu::find($data['parent_id'])->level ?? 0)) : 0;
            $data['level'] = $data['parent_id'] ? $parentLevel + 1 : 1;
        }

        $row->update($data);
        return response()->json(['success' => true, 'data' => $row]);
    }

    public function destroy(string $id)
    {
        Menu::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }

    public function restore(string $id)
    {
        $row = Menu::onlyTrashed()->findOrFail($id);
        $row->restore();
        return response()->json(['success' => true, 'data' => $row]);
    }

    public function forceDelete(string $id)
    {
        DB::transaction(function () use ($id) {
            $this->deleteSubtree((int)$id);
        });
        return response()->json(['success' => true]);
    }

    private function deleteSubtree(int $id): void
    {
        $node = Menu::withTrashed()->find($id);
        if (!$node) return;

        $children = Menu::withTrashed()->where('parent_id', $id)->get();
        foreach ($children as $ch) $this->deleteSubtree((int)$ch->id);

        $node->forceDelete();
    }

    // POST /api/menus/reorder
    // Body: [{ "id": 10, "order_number": 1, "parent_id": null }, ...]
    public function reorder(Request $req)
    {
        $items = $req->validate([
            '*.id'           => ['required', 'integer', 'exists:mst_menus,id'],
            '*.order_number' => ['required', 'integer'],
            '*.parent_id'    => ['nullable', 'integer', 'exists:mst_menus,id'],
        ]);

        DB::transaction(function () use ($items) {
            foreach ($items as $it) {
                $m = Menu::find($it['id']);
                $m->order_number = $it['order_number'];
                $m->parent_id    = $it['parent_id'] ?? null;
                $m->level        = $m->parent_id ? ((int)(Menu::find($m->parent_id)->level ?? 0) + 1) : 1;
                $m->save();
            }
        });

        return response()->json(['success' => true]);
    }
    
}