<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DataUser extends Model
{
    protected $table = 'mst_users';
    protected $fillable = [
        'nama',
        'email',
        'no_hp',
        'password'
    ];

    

    
    
    

    
}
