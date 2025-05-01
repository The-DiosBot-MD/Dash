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
            'description' => 'Permissions to allow administrator to view the index page.',
            'keys' => [
                'read' => 'Read the contents of the overview.',
            ],
        ],
        'settings' => [
            'description' => 'Permissions to allow changing basic admin settings.',
            'keys' => [
                'read' => 'Read the panel settings.',
                'update' => 'Update the panel settings.',
            ],
        ],
        'activity' => [
            'description' => 'Permissions to allow admins to see activity logs.',
            'keys' => [
                'read' => 'View the admin activity logs.',
            ],
        ],
        'api' => [
            'description' => 'Permissions to configure Application API keys.',
            'keys' => [
                'read' => 'View the existing Application API keys.',
                'create' => 'Create a new Application API key.',
                'update' => 'Change Application API key permissions.',
                'delete' => 'Delete Application API keys.',
            ],
        ],
        'auth' => [
            'description' => 'Permissions to configure the Authentication module.',
            'keys' => [
                'read' => 'View the current authentication settings.',
                'create' => 'Enable authentication modules.',
                'update' => 'Update authentication module settings.',
                'delete' => 'Disable authentication modules.',
            ],
        ],
        'billing' => [
            'description' => 'Permissions to configure the Billing module.',
            'keys' => [
                'read' => 'Read basic billing information.',
                'product-create' => 'Create a billing product.',
                'product-update' => 'Update a billing product.',
                'product-delete' => 'Delete a billing product.',
                'category-create' => 'Create a billing category.',
                'category-update' => 'Update a billing category.',
                'category-delete' => 'Delete a billing category.',
                'exceptions' => 'Manage and resolve billing exceptions.',
                'update' => 'Update billing settings.',
                'export' => 'Export current billing configuration to JSON.',
                'import' => 'Import current billing configuration from JSON.',
            ],
        ],
        'tickets' => [
            'description' => 'Permissions to configure the Ticket module.',
            'keys' => [
                'read' => 'View all existing tickets.',
                'create' => 'Create a new ticket.',
                'update' => 'Update an existing ticket.',
                'delete' => 'Delete an existing ticket.',
                'message' => 'Send a message in a ticket.',
            ],
        ],
        'ai' => [
            'description' => 'Permissions to configure the AI module.',
            'keys' => [
                'read' => 'View the Admin AI console.',
                'update' => 'Control the AI settings.',
            ],
        ],
        'webhooks' => [
            'description' => 'Permissions to configure the Webhook system.',
            'keys' => [
                'read' => 'View all available webhooks.',
                'update' => 'Control the AI settings.',
            ],
        ],
        'alerts' => [
            'description' => 'Permissions to configure Alerts.',
            'keys' => [
                'read' => 'View the alert configuration.',
                'update' => 'Control the alert settings.',
            ],
        ],
        'theme' => [
            'description' => 'Permissions to configure the panel theme.',
            'keys' => [
                'read' => 'View the current theme settings.',
                'update' => 'Adjust the panel theme.',
            ],
        ],
        'links' => [
            'description' => 'Permissions to configure external links.',
            'keys' => [
                'read' => 'View the current links.',
                'create' => 'Create a new link.',
                'update' => 'Update an existing link.',
                'delete' => 'Delete an existing link.',
            ],
        ],
        'databases' => [
            'description' => 'Permissions to configure database hosts.',
            'keys' => [
                'read' => 'View the current database hosts.',
                'create' => 'Create a new database host.',
                'update' => 'Update an existing database host.',
                'delete' => 'Delete an existing database host.',
            ],
        ],
        'nodes' => [
            'description' => 'Permissions to configure nodes.',
            'keys' => [
                'read' => 'View the current nodes.',
                'create' => 'Create a new node.',
                'update' => 'Update an existing node.',
                'delete' => 'Delete an existing node.',
            ],
        ],
        'servers' => [
            'description' => 'Permissions to configure servers.',
            'keys' => [
                'read' => 'View the current servers.',
                'create' => 'Create a new server.',
                'update' => 'Update an existing server.',
                'delete' => 'Delete an existing server.',
            ],
        ],
        'users' => [
            'description' => 'Permissions to configure users.',
            'keys' => [
                'read' => 'View the current users.',
                'create' => 'Create a new user.',
                'update' => 'Update an existing user.',
                'delete' => 'Delete an existing user.',
            ],
        ],
        'roles' => [
            'description' => 'Permissions to configure admin roles.',
            'keys' => [
                'read' => 'View the current admin roles.',
                'create' => 'Create a new admin role.',
                'update' => 'Update an existing admin role.',
                'delete' => 'Delete an existing admin role.',
            ],
        ],
        'nests' => [
            'description' => 'Permissions to configure nests.',
            'keys' => [
                'read' => 'View the current nests.',
                'create' => 'Create a new nest.',
                'update' => 'Update an existing nest.',
                'delete' => 'Delete an existing nest.',
            ],
        ],
        'eggs' => [
            'description' => 'Permissions to configure eggs.',
            'keys' => [
                'read' => 'View the current eggs.',
                'create' => 'Create a new egg.',
                'update' => 'Update an existing egg.',
                'delete' => 'Delete an existing egg.',
                'import' => 'Import an egg to an existing nest via JSON.',
                'export' => 'Export an egg via JSON.',
            ],
        ],
        'mounts' => [
            'description' => 'Permissions to configure mounts.',
            'keys' => [
                'read' => 'View the current mounts.',
                'create' => 'Create a new mount.',
                'update' => 'Update an existing mount.',
                'delete' => 'Delete an existing mount.',
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
