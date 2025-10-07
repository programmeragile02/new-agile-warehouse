<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class FeatureBuilder extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'mst_feature_builder';
    protected $fillable = [
        'product_id','product_code','parent_id','name','feature_code','type',
        'description','crud_menu_id','price_addon','trial_available','trial_days',
        'is_active','order_number'
    ];

    protected $casts = [
        'trial_available' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function children() {
        return $this->hasMany(self::class, 'parent_id')->orderBy('order_number');
    }

    public function parent() {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function menu() {
        return $this->belongsTo(\App\Models\Menu::class, 'crud_menu_id');
    }
}