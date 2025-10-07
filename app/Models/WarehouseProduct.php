<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class WarehouseProduct extends Model
{
    // use SoftDeletes;

    protected $table = 'warehouse_products';
    protected $primaryKey = 'id';
    public $incrementing = false; // <— penting, biar id dari Panel dipakai apa adanya
    protected $keyType = 'int';

    protected $fillable = [
        'id',
        'product_code',
        'product_name',
        'category',
        'status',
        'description',
        'master_db_name',
        'total_features',
        'master_schema_version',
    ];
}
