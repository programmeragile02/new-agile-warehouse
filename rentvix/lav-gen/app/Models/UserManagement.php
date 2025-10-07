<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class UserManagement extends Authenticatable implements JWTSubject
{
    protected $table = 'user_management';

    protected $fillable = [
        'company_id',
        'nama',
        'email',
        'nomor_telp',
        'role',        // FK ke level_user.id
        'status',
        'foto',
        'password',
    ];

    protected $hidden = ['password'];

    protected $casts = [
        'password' => 'hashed',
    ];

    // ⬇️ pastikan properti ini ada agar ikut tampil di JSON
    protected $appends = ['foto_url', 'role_name'];

    /** GANTI relasi agar tidak bentrok nama kolom */
    public function roleRel()
    {
        return $this->belongsTo(\App\Models\LevelUser::class, 'role');
    }

    /** Accessor foto */
    public function getFotoUrlAttribute()
    {
        return $this->foto ? asset('storage/' . $this->foto) : null;
    }

    /** Accessor nama role yang ramah UI */
    public function getRoleNameAttribute()
    {
        return optional($this->roleRel)->nama_level;
    }

    // JWT
    public function getJWTIdentifier() { return $this->getKey(); }
    public function getJWTCustomClaims() { return ['typ' => 'user']; }
}
