<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LevelUser extends Model
{
    protected $table = 'level_user';
    protected $fillable = [
        'nama_level',
        'deskripsi',
        'status'
    ];


    public function userManagements(): HasMany
    {
        return $this->hasMany(UserManagement::class, 'role'); // <— penting: sebutkan FK 'role'
    }
    public function accessMatrix(): HasMany
    {
        return $this->hasMany(AccessControlMatrix::class, 'user_level_id');
    }

}
