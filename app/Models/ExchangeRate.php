<?php

namespace Everest\Models;

use Illuminate\Database\Eloquent\Model;

class ExchangeRate extends Model
{
    protected $fillable = [
        'base_currency',
        'rates',
        'last_updated_at',
    ];

    protected $casts = [
        'rates' => 'array',
        'last_updated_at' => 'datetime',
    ];
}