<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema; // ⬅️ tambahkan ini

class AccessControlMatrix extends Model
{
    protected $table = 'access_control_matrix';

    protected $fillable = [
        'user_level_id',
        'menu_id',
        'view', 'add', 'edit', 'delete', 'approve',
    ];

    protected $casts = [
        'user_level_id' => 'integer',
        'menu_id' => 'integer',
        'view' => 'boolean',
        'add' => 'boolean',
        'edit' => 'boolean',
        'delete' => 'boolean',
        'approve' => 'boolean',
    ];

    public function level(): BelongsTo { return $this->belongsTo(LevelUser::class, 'user_level_id'); }
    public function menu(): BelongsTo { return $this->belongsTo(Menu::class, 'menu_id'); }

    public function scopeForLevel($q, $levelId) { return $q->where('user_level_id', $levelId); }

    /** SYNC menu_id only: upsert + hapus yang tak dikirim + bersihkan legacy menu_key */
    public static function syncForLevel(int $levelId, array $rows): void
    {
        DB::transaction(function () use ($levelId, $rows) {
            $now = now();
            $payload = [];
            $ids = [];

            foreach ($rows as $r) {
                $mid = isset($r['menu_id']) ? (int)$r['menu_id'] : null;
                if (!$mid) continue;
                $ids[] = $mid;
                $payload[] = [
                    'user_level_id' => $levelId,
                    'menu_id'       => $mid,
                    'view'    => (bool)($r['view'] ?? false),
                    'add'     => (bool)($r['add'] ?? false),
                    'edit'    => (bool)($r['edit'] ?? false),
                    'delete'  => (bool)($r['delete'] ?? false),
                    'approve' => (bool)($r['approve'] ?? false),
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            foreach (array_chunk($payload, 1000) as $chunk) {
                static::upsert(
                    $chunk,
                    ['user_level_id', 'menu_id'],
                    ['view','add','edit','delete','approve','updated_at']
                );
            }

            // benar-benar sync: sisakan hanya id yang dikirim
            static::where('user_level_id', $levelId)
                ->whereNotIn('menu_id', $ids ?: [-1])
                ->delete();

            // bersihkan warisan menu_key hanya jika kolomnya memang ada
            if (Schema::hasColumn('access_control_matrix', 'menu_key')) {
                static::where('user_level_id', $levelId)
                      ->whereNotNull('menu_key')
                      ->delete();
            }
        });
    }
}
