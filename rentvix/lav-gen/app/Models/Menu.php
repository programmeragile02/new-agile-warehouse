<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Menu extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'mst_menus';

    protected $fillable = [
        'parent_id',
        'level',
        'type',
        'title',
        'icon',
        'color',
        'order_number',
        'crud_builder_id',
        'product_code',
        'route_path',
        'is_active',
        'note',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'level' => 'integer',
        'order_number' => 'integer',
    ];

    public function parent()  { return $this->belongsTo(Menu::class, 'parent_id'); }
    public function children(){ return $this->hasMany(Menu::class, 'parent_id')->orderBy('order_number'); }
    public function recursiveChildren(){ return $this->children()->with('recursiveChildren'); }
    public function crudBuilder(){ return $this->belongsTo(\App\Models\CrudBuilder::class, 'crud_builder_id'); }
    public function creator(){ return $this->belongsTo(\App\Models\User::class, 'created_by'); }

    public function scopeForProduct($q, ?string $code)
    {
        if ($code) $q->where('product_code', $code);
        return $q;
    }

    public function scopeActive($q){ return $q->where('is_active', true); }
}