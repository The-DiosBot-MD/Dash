import { Suspense, useEffect, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import { NotFound } from '@elements/ScreenBlock';
import Spinner from '@elements/Spinner';
import routes from '@/routers/routes';
import { useStoreState } from '@/state/hooks';
import CollapsedIcon from '@/assets/images/logo.png';
import TicketContainer from '@/components/dashboard/tickets/TicketContainer';
import ViewTicketContainer from '@/components/dashboard/tickets/view/ViewTicketContainer';
import { usePersistedState } from '@/plugins/usePersistedState';
import Sidebar from '@elements/Sidebar';
import {
    CodeIcon,
    CogIcon,
    DesktopComputerIcon,
    ExternalLinkIcon,
    LogoutIcon,
    ShoppingCartIcon,
    TerminalIcon,
    TicketIcon,
    ViewListIcon,
} from '@heroicons/react/outline';
import Avatar from '@/components/Avatar';
import MobileSidebar from '@elements/MobileSidebar';
import { faCog, faKey, faShoppingBag, faTerminal, faTicket, faUser } from '@fortawesome/free-solid-svg-icons';
import { CustomLink } from '@/api/admin/links';
import { getLinks } from '@/api/getLinks';
import http from '@/api/http';
import ProductsContainer from '@/components/billing/ProductsContainer';
import OrdersContainer from '@/components/billing/orders/OrdersContainer';
import Processing from '@/components/billing/order/summary/Processing';
import OrderContainer from '@/components/billing/order/OrderContainer';
import Cancel from '@/components/billing/order/summary/Cancel';
import Success from '@/components/billing/order/summary/Success';

function DashboardRouter() {
    const user = useStoreState(s => s.user.data!);
    const { name } = useStoreState(s => s.settings.data!);
    const theme = useStoreState(state => state.theme.data!);
    const [links, setLinks] = useState<CustomLink[] | null>();
    const { tickets, billing } = useStoreState(state => state.everest.data!);
    const [collapsed, setCollapsed] = usePersistedState<boolean>(`sidebar_user_${user.uuid}`, false);

    useEffect(() => {
        getLinks()
            .then(data => setLinks(data))
            .catch(error => console.error(error));
    }, []);

    const onTriggerLogout = () => {
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    console.log(user);

    return (
        <div className={'h-screen flex'}>
            <MobileSidebar>
                <MobileSidebar.Home />
                <MobileSidebar.Link icon={faUser} text={'Account'} linkTo={'/account'} end />
                <MobileSidebar.Link icon={faKey} text={'API'} linkTo={'/account/api'} />
                <MobileSidebar.Link icon={faTerminal} text={'SSH'} linkTo={'/account/ssh'} />
                {tickets.enabled && <MobileSidebar.Link icon={faTicket} text={'Tickets'} linkTo={'/account/tickets'} />}
                {billing.enabled && (
                    <>
                        <MobileSidebar.Link icon={faShoppingBag} text={'Billing'} linkTo={'/billing/order'} />
                        <MobileSidebar.Link icon={faShoppingBag} text={'Orders'} linkTo={'/billing/orders'} />
                    </>
                )}
                {(user.rootAdmin || user.admin_role_id) && (
                    <MobileSidebar.Link icon={faCog} text={'Admin'} linkTo={'/admin'} />
                )}
            </MobileSidebar>
            <Sidebar className={'flex-none'} $collapsed={collapsed} theme={theme}>
                <div
                    className={
                        'h-16 w-full flex flex-col items-center justify-center mt-1 mb-3 select-none cursor-pointer'
                    }
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {!collapsed ? (
                        <h1 className={'text-2xl text-neutral-50 whitespace-nowrap font-medium'}>{name}</h1>
                    ) : (
                        <img src={CollapsedIcon} className={'mt-4 w-12'} alt={'Everest Icon'} />
                    )}
                </div>
                <Sidebar.Wrapper theme={theme}>
                    <NavLink to={'/'} end className={'mb-[18px]'}>
                        <DesktopComputerIcon />
                        <span>Dashboard</span>
                    </NavLink>
                    <Sidebar.Section>Account</Sidebar.Section>
                    <NavLink to={'/account'} end>
                        <Avatar.User />
                        <span>Account</span>
                    </NavLink>
                    <NavLink to={'/account/api'}>
                        <CodeIcon />
                        <span>API Keys</span>
                    </NavLink>
                    <NavLink to={'/account/ssh'}>
                        <TerminalIcon />
                        <span>SSH Keys</span>
                    </NavLink>
                    {tickets.enabled && (
                        <>
                            <Sidebar.Section>Tickets</Sidebar.Section>
                            <NavLink to={'/account/tickets'}>
                                <TicketIcon />
                                <span>Tickets</span>
                            </NavLink>
                        </>
                    )}
                    {billing.enabled && (
                        <>
                            <Sidebar.Section>Billing</Sidebar.Section>
                            <NavLink to={'/billing/order'}>
                                <ShoppingCartIcon />
                                <span>Billing</span>
                            </NavLink>
                            <NavLink to={'/billing/orders'}>
                                <ViewListIcon />
                                <span>Orders</span>
                            </NavLink>
                        </>
                    )}
                </Sidebar.Wrapper>
                <span className={'mt-auto mb-3 mr-auto'}>
                    {!collapsed && (
                        <>
                            {links?.map(link => (
                                <a key={link.id} href={link.url} target={'_blank'} rel={'noreferrer'}>
                                    <ExternalLinkIcon />
                                    <span>{link.name}</span>
                                </a>
                            ))}
                        </>
                    )}
                    {(user.rootAdmin || user.admin_role_id) && (
                        <NavLink to={'/admin'}>
                            <CogIcon />
                            <span className={collapsed ? 'hidden' : ''}>Settings</span>
                        </NavLink>
                    )}
                    <NavLink to={'/'} onClick={onTriggerLogout}>
                        <LogoutIcon />
                        <span className={collapsed ? 'hidden' : ''}>Logout</span>
                    </NavLink>
                </span>
                <Sidebar.User>
                    <span className="flex items-center">
                        <Avatar.User />
                    </span>
                    <div className={'flex flex-col ml-3'}>
                        <span
                            className={
                                'font-sans font-normal text-xs text-gray-300 whitespace-nowrap leading-tight select-none'
                            }
                        >
                            <div className={'text-gray-400 text-sm'}>Welcome back,</div>
                            {user.email}
                        </span>
                    </div>
                </Sidebar.User>
            </Sidebar>
            <div className={'flex-1 overflow-x-hidden p-4 lg:p-8'}>
                <Suspense fallback={<Spinner centered />}>
                    <Routes>
                        <Route path="" element={<DashboardContainer />} />

                        {routes.account.map(({ route, component: Component }) => (
                            <Route key={route} path={`/account/${route}`.replace(/\/$/, '')} element={<Component />} />
                        ))}

                        {tickets.enabled && (
                            <>
                                <Route path={'/account/tickets'} element={<TicketContainer />} />
                                <Route path={'/account/tickets/:id'} element={<ViewTicketContainer />} />
                            </>
                        )}

                        {billing.enabled && (
                            <>
                                <Route path={'/billing/order'} element={<ProductsContainer />} />
                                <Route path={'/billing/order/:id'} element={<OrderContainer />} />
                                <Route path={'/billing/orders'} element={<OrdersContainer />} />

                                <Route path={'/billing/processing'} element={<Processing />} />
                                <Route path={'/billing/success'} element={<Success />} />
                                <Route path={'/billing/cancel'} element={<Cancel />} />
                            </>
                        )}

                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Suspense>
            </div>
        </div>
    );
}

export default DashboardRouter;
