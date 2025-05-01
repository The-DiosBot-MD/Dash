<?php

namespace Everest\Models;

use Illuminate\Support\Collection;

/**
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property int $sort_id
 * @property array $permissions
 */
class AdminRole extends Model
{
    /**
     * The resource name for this model when it is transformed into an
     * API representation using fractal.
     */
    public const RESOURCE_NAME = 'admin_role';

    /**
     * The table associated with the model.
     */
    protected $table = 'admin_roles';

    /**
     * Fields that are mass assignable.
     */
    protected $fillable = [
        'name',
        'description',
        'sort_id',
        'permissions',
    ];

    /**
     * Cast values to correct type.
     */
    protected $casts = [
        'sort_id' => 'int',
        'permissions' => 'array',
    ];

    public static array $validationRules = [
        'name' => 'required|string|max:64',
        'description' => 'nullable|string|max:255',
        'sort_id' => 'sometimes|numeric',
        'permissions' => 'nullable|array',
    ];

    public $timestamps = false;

    /**
     * All the permissions available on the system. You should use self::permissions()
     * to retrieve them, and not directly access this array as it is subject to change.
     *
     * @see \Everest\Models\Permission::permissions()
     */
    protected static array $permissions = [
        'overview' => [
            'description' => 'Allows the administrator to interact with the admin overview page.',
            'keys' => [
                'read' => 'Allows the administrator to read the contents of the overview.',
            ],
        ],
    ];

    /**
     * Gets the permissions associated with an admin role.
     */
    public static function permissions(): Collection
    {
        return Collection::make(self::$permissions);
    }
}
