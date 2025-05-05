<?php

namespace Everest\Services\Billing;

use Everest\Models\User;
use Everest\Models\Billing\Order;

class AdminPermissionService
{
    /**
     * Process the creation of an order.
     */
    public function handle(User $user): array
    {
        $permissions = [];

        if ($user->admin_role_id) {
            $role = AdminRole::findOrFail($user->admin_role_id);
            $permissions[] = $role->permissions;
        } else {
            $permissions[] = ['*'];
        }

        return $permissions;
    }
}
