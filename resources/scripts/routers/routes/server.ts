import { lazy } from 'react';
import { route, type ServerRouteDefinition } from '@/routers/routes/utils';

const ServerConsoleContainer = lazy(() => import('@/components/server/console/ServerConsoleContainer'));
const FileManagerContainer = lazy(() => import('@/components/server/files/FileManagerContainer'));
const FileEditContainer = lazy(() => import('@/components/server/files/FileEditContainer'));
const DatabasesContainer = lazy(() => import('@/components/server/databases/DatabasesContainer'));
const ScheduleContainer = lazy(() => import('@/components/server/schedules/ScheduleContainer'));
const ScheduleEditContainer = lazy(() => import('@/components/server/schedules/ScheduleEditContainer'));
const UsersContainer = lazy(() => import('@/components/server/users/UsersContainer'));
const BackupContainer = lazy(() => import('@/components/server/backups/BackupContainer'));
const NetworkContainer = lazy(() => import('@/components/server/network/NetworkContainer'));
const StartupContainer = lazy(() => import('@/components/server/startup/StartupContainer'));
const SettingsContainer = lazy(() => import('@/components/server/settings/SettingsContainer'));
const ServerActivityLogContainer = lazy(() => import('@/components/server/ServerActivityLogContainer'));
const ServerBillingContainer = lazy(() => import('@/components/server/billing/ServerBillingContainer'));

const server: ServerRouteDefinition[] = [
    route('', ServerConsoleContainer, { permission: 'control.console', name: 'Console', end: true }),
    route('files/*', FileManagerContainer, { permission: 'file.*', name: 'Files' }),
    route('files/:action/*', FileEditContainer, { permission: 'file.*' }),
    route('databases/*', DatabasesContainer, { permission: 'database.*', name: 'Databases' }),
    route('schedules/*', ScheduleContainer, { permission: 'schedule.*', name: 'Schedules' }),
    route('schedules/:id/*', ScheduleEditContainer, { permission: 'schedule.*' }),
    route('users/*', UsersContainer, { permission: 'user.*', name: 'Users' }),
    route('backups/*', BackupContainer, { permission: 'backup.*', name: 'Backups' }),
    route('network/*', NetworkContainer, { permission: 'allocation.*', name: 'Network' }),
    route('startup/*', StartupContainer, { permission: 'startup.*', name: 'Startup' }),
    route('settings/*', SettingsContainer, { permission: ['settings.*', 'file.sftp'], name: 'Settings' }),
    route('activity/*', ServerActivityLogContainer, { permission: 'activity.*', name: 'Activity' }),
    route('billing/*', ServerBillingContainer, {
        permission: 'billing.*',
        name: 'Billing',
        condition: flags => flags.billable,
    }),
];

export default server;
