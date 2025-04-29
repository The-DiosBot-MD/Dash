import { AdminRolePermission, Transformers } from '@/api/definitions/admin';
import { AdminRolePermissionFilters } from './types.d';
import { createPaginatedHook, createContext } from '@/api';

export const Context = createContext<AdminRolePermissionFilters>();

export const useGetRolePermissions = createPaginatedHook<AdminRolePermission, AdminRolePermissionFilters>({
    url: '/api/application/roles/permissions',
    swrKey: 'admin_role_permissions',
    context: Context,
    transformer: Transformers.toAdminRolePermission,
});
