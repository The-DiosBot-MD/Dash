import {
    CashIcon,
    CodeIcon,
    CogIcon,
    CursorClickIcon,
    DatabaseIcon,
    EyeIcon,
    FolderIcon,
    KeyIcon,
    LinkIcon,
    OfficeBuildingIcon,
    PencilIcon,
    ReplyIcon,
    ServerIcon,
    ShieldExclamationIcon,
    SparklesIcon,
    TerminalIcon,
    TicketIcon,
    UserGroupIcon,
    UsersIcon,
    ViewGridIcon,
} from '@heroicons/react/outline';
import { useStoreState } from 'easy-peasy';
import { NavLink, Route, Routes } from 'react-router-dom';
import tw from 'twin.macro';
import Avatar from '@/components/Avatar';
import CollapsedIcon from '@/assets/images/logo.png';
import OverviewContainer from '@admin/general/overview/OverviewContainer';
import SettingsContainer from '@admin/general/settings/SettingsRouter';
import DatabasesContainer from '@admin/management/databases/DatabasesContainer';
import NewDatabaseContainer from '@admin/management/databases/NewDatabaseContainer';
import DatabaseEditContainer from '@admin/management/databases/DatabaseEditContainer';
import NodesContainer from '@admin/management/nodes/NodesContainer';
import NewNodeContainer from '@admin/management/nodes/NewNodeContainer';
import NodeRouter from '@admin/management/nodes/NodeRouter';
import ServersContainer from '@admin/management/servers/ServersContainer';
import NewServerContainer from '@admin/management/servers/NewServerContainer';
import ServerRouter from '@admin/management/servers/ServerRouter';
import NewUserContainer from '@admin/management/users/NewUserContainer';
import UserRouter from '@admin/management/users/UserRouter';
import NestsContainer from '@admin/service/nests/NestsContainer';
import NestEditContainer from '@admin/service/nests/NestEditContainer';
import NewEggContainer from '@admin/service/nests/NewEggContainer';
import EggRouter from '@admin/service/nests/eggs/EggRouter';
import MountsContainer from '@admin/service/mounts/MountsContainer';
import NewMountContainer from '@admin/service/mounts/NewMountContainer';
import MountEditContainer from '@admin/service/mounts/MountEditContainer';
import { NotFound } from '@elements/ScreenBlock';
import type { ApplicationStore } from '@/state';
import Sidebar from '@elements/Sidebar';
import UsersContainer from '@admin/management/users/UsersContainer';
import ApiContainer from '@admin/general/api/ApiContainer';
import NewApiKeyContainer from '@admin/general/api/NewApiKeyContainer';
import AuthContainer from '@admin/modules/auth/AuthContainer';
import TicketRouter from '@admin/modules/tickets/TicketRouter';
import ThemeContainer from '@admin/modules/theme/ThemeContainer';
import BillingRouter from '@admin/modules/billing/BillingRouter';
import AdminIndicators from '@admin/AdminIndicators';
import AlertRouter from '@admin/modules/alert/AlertRouter';
import { usePersistedState } from '@/plugins/usePersistedState';
import AIRouter from '@admin/modules/ai/AIRouter';
import MobileSidebar from '@elements/MobileSidebar';
import {
    faCog,
    faDatabase,
    faDesktop,
    faDollar,
    faEgg,
    faExclamationTriangle,
    faEye,
    faFolder,
    faIdBadge,
    faKey,
    faLayerGroup,
    faLink,
    faMessage,
    faPaintBrush,
    faServer,
    faTicket,
    faUser,
    faUserGroup,
    faWandSparkles,
} from '@fortawesome/free-solid-svg-icons';
import LinksTable from '@/components/admin/modules/links/LinksContainer';
import ActivityContainer from '@admin/general/ActivityContainer';
import WebhookRouter from '@/components/admin/modules/webhooks/WebhookRouter';
import RolesContainer from '@/components/admin/management/roles/RolesContainer';
import RoleEditContainer from '@/components/admin/management/roles/RoleEditContainer';
import Pill from '@/components/elements/Pill';

function AdminRouter() {
    const theme = useStoreState(state => state.theme.data!);
    const user = useStoreState((state: ApplicationStore) => state.user.data!);
    const standard = useStoreState(state => state.settings.data!.mode) === 'standard';
    const settings = useStoreState((state: ApplicationStore) => state.settings.data!);

    const [collapsed, setCollapsed] = usePersistedState<boolean>(`sidebar_admin_${user.uuid}`, false);

    return (
        <div css={tw`h-screen flex`}>
            {settings.indicators && <AdminIndicators />}
            <MobileSidebar>
                <MobileSidebar.Home />
                <MobileSidebar.Link icon={faDesktop} text={'Overview'} linkTo={'/admin'} end />
                <MobileSidebar.Link icon={faCog} text={'Settings'} linkTo={'/admin/settings'} />
                <MobileSidebar.Link icon={faEye} text={'Activity'} linkTo={'/admin/activity'} />
                {standard && (
                    <>
                        <MobileSidebar.Link icon={faIdBadge} text={'API'} linkTo={'/admin/api'} />
                        <MobileSidebar.Link icon={faKey} text={'Auth'} linkTo={'/admin/auth'} />
                        <MobileSidebar.Link icon={faDollar} text={'Billing'} linkTo={'/admin/billing'} />
                        <MobileSidebar.Link icon={faTicket} text={'Tickets'} linkTo={'/admin/tickets'} />
                        <MobileSidebar.Link icon={faWandSparkles} text={'AI'} linkTo={'/admin/ai'} />
                        <MobileSidebar.Link icon={faMessage} text={'Webhooks'} linkTo={'/admin/webhooks'} />
                    </>
                )}
                <MobileSidebar.Link icon={faExclamationTriangle} text={'Alerts'} linkTo={'/admin/alerts'} />
                <MobileSidebar.Link icon={faPaintBrush} text={'Theme'} linkTo={'/admin/theme'} />
                <MobileSidebar.Link icon={faLink} text={'Links'} linkTo={'/admin/links'} />
                <MobileSidebar.Link icon={faDatabase} text={'Databases'} linkTo={'/admin/databases'} />
                <MobileSidebar.Link icon={faLayerGroup} text={'Nodes'} linkTo={'/admin/nodes'} />
                <MobileSidebar.Link icon={faServer} text={'Servers'} linkTo={'/admin/servers'} />
                <MobileSidebar.Link icon={faUser} text={'Users'} linkTo={'/admin/users'} />
                <MobileSidebar.Link icon={faUserGroup} text={'Roles'} linkTo={'/admin/roles'} />
                <MobileSidebar.Link icon={faFolder} text={'Mounts'} linkTo={'/admin/mounts'} />
                <MobileSidebar.Link icon={faEgg} text={'Nests'} linkTo={'/admin/nests'} />
            </MobileSidebar>
            <Sidebar css={tw`flex-none`} $collapsed={collapsed} theme={theme}>
                <div
                    css={tw`h-16 w-full flex flex-col items-center justify-center mt-1 mb-3 select-none cursor-pointer`}
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {!collapsed ? (
                        <h1 css={tw`text-2xl text-neutral-50 whitespace-nowrap font-medium`}>{settings.name}</h1>
                    ) : (
                        <img src={CollapsedIcon} css={tw`mt-4 w-12`} alt={'Everest Icon'} />
                    )}
                </div>
                <Sidebar.Wrapper theme={theme} $admin>
                    <NavLink to="/" className={'mb-[18px]'}>
                        <ReplyIcon />
                        <span>Return</span>
                    </NavLink>
                    <Sidebar.Section>General</Sidebar.Section>
                    <NavLink to="/admin" end>
                        <OfficeBuildingIcon />
                        <span>Overview</span>
                    </NavLink>
                    <NavLink to="/admin/settings">
                        <CogIcon />
                        <span>Settings</span>
                    </NavLink>
                    <NavLink to="/admin/activity">
                        <EyeIcon />
                        <span>Activity</span>
                    </NavLink>
                    {standard && (
                        <NavLink to="/admin/api">
                            <CodeIcon />
                            <span>API</span>
                        </NavLink>
                    )}
                    <Sidebar.Section>Modules</Sidebar.Section>
                    {standard && (
                        <>
                            <NavLink to="/admin/auth">
                                <KeyIcon />
                                <span>Auth</span>
                            </NavLink>
                            <NavLink to="/admin/billing">
                                <CashIcon />
                                <span>Billing</span>
                            </NavLink>
                            <NavLink to="/admin/tickets">
                                <TicketIcon />
                                <span>Tickets</span>
                            </NavLink>
                            <NavLink to="/admin/ai">
                                <SparklesIcon />
                                <span>AI</span>
                            </NavLink>
                            <NavLink to="/admin/webhooks">
                                <CursorClickIcon />
                                <span>Webhooks</span>
                            </NavLink>
                        </>
                    )}
                    <Sidebar.Section>Appearance</Sidebar.Section>
                    <NavLink to="/admin/alerts">
                        <ShieldExclamationIcon />
                        <span>Alerts</span>
                    </NavLink>
                    <NavLink to="/admin/theme">
                        <PencilIcon />
                        <span>Theme</span>
                    </NavLink>
                    <NavLink to="/admin/links">
                        <LinkIcon />
                        <span>Links</span>
                    </NavLink>
                    <Sidebar.Section>Management</Sidebar.Section>
                    {standard && (
                        <NavLink to="/admin/databases">
                            <DatabaseIcon />
                            <span>Databases</span>
                        </NavLink>
                    )}
                    <NavLink to="/admin/nodes">
                        <ServerIcon />
                        <span>Nodes</span>
                    </NavLink>
                    <NavLink to="/admin/servers">
                        <TerminalIcon />
                        <span>Servers</span>
                    </NavLink>
                    <NavLink to="/admin/users">
                        <UsersIcon />
                        <span>Users</span>
                    </NavLink>
                    <NavLink to="/admin/roles">
                        <UserGroupIcon />
                        <span>Roles</span>
                    </NavLink>
                    <Sidebar.Section>Services</Sidebar.Section>
                    <NavLink to="/admin/nests">
                        <ViewGridIcon />
                        <span>Nests</span>
                    </NavLink>
                    {standard && (
                        <NavLink to="/admin/mounts">
                            <FolderIcon />
                            <span>Mounts</span>
                        </NavLink>
                    )}
                </Sidebar.Wrapper>
                <Sidebar.User className={'mt-auto'}>
                    <span className="flex items-center">
                        <Avatar.User />
                    </span>
                    <div className={'flex flex-col ml-3'}>
                        <span
                            className={
                                'font-sans font-normal text-xs text-gray-300 whitespace-nowrap leading-tight select-none'
                            }
                        >
                            <div className={'w-full flex justify-between mb-1'}>
                                <p className={'text-sm text-gray-400'}>Welcome,</p>
                                <Pill size={'xsmall'}>{user.roleName}</Pill>
                            </div>
                            {user.email}
                        </span>
                    </div>
                </Sidebar.User>
            </Sidebar>

            <div css={tw`flex-1 overflow-x-hidden px-6 pt-6 lg:px-10 lg:pt-8 xl:px-16 xl:pt-12`}>
                <div css={tw`w-full flex flex-col mx-auto`} style={{ maxWidth: '86rem' }}>
                    <Routes>
                        <Route path="" element={<OverviewContainer />} />
                        <Route path="activity" element={<ActivityContainer />} />
                        <Route path="settings/*" element={<SettingsContainer />} />
                        <Route path="api" element={<ApiContainer />} />
                        <Route path="api/new" element={<NewApiKeyContainer />} />
                        <Route path="auth" element={<AuthContainer />} />
                        <Route path="billing/*" element={<BillingRouter />} />
                        <Route path="tickets/*" element={<TicketRouter />} />
                        <Route path="ai/*" element={<AIRouter />} />
                        <Route path="webhooks/*" element={<WebhookRouter />} />
                        <Route path="theme" element={<ThemeContainer />} />
                        <Route path="links/*" element={<LinksTable />} />
                        <Route path="alerts/*" element={<AlertRouter />} />
                        <Route path="databases" element={<DatabasesContainer />} />
                        <Route path="databases/new" element={<NewDatabaseContainer />} />
                        <Route path="databases/:id" element={<DatabaseEditContainer />} />
                        <Route path="nodes" element={<NodesContainer />} />
                        <Route path="nodes/new" element={<NewNodeContainer />} />
                        <Route path="nodes/:id/*" element={<NodeRouter />} />
                        <Route path="servers" element={<ServersContainer />} />
                        <Route path="servers/new" element={<NewServerContainer />} />
                        <Route path="servers/:id/*" element={<ServerRouter />} />
                        <Route path="users" element={<UsersContainer />} />
                        <Route path="users/new" element={<NewUserContainer />} />
                        <Route path="users/:id/*" element={<UserRouter />} />
                        <Route path={'roles'} element={<RolesContainer />} />
                        <Route path={`roles/:id`} element={<RoleEditContainer />} />
                        <Route path="nests" element={<NestsContainer />} />
                        <Route path="nests/:nestId" element={<NestEditContainer />} />
                        <Route path="nests/:nestId/new" element={<NewEggContainer />} />
                        <Route path="nests/:nestId/eggs/:id/*" element={<EggRouter />} />
                        <Route path="mounts" element={<MountsContainer />} />
                        <Route path="mounts/new" element={<NewMountContainer />} />
                        <Route path="mounts/:id" element={<MountEditContainer />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
}

export default AdminRouter;
