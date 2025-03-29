import { useGetUsers, Context as UsersContext } from '@/api/admin/users';
import tw from 'twin.macro';
import AdminTable, {
    ContentWrapper,
    Pagination,
    TableHead,
    TableHeader,
    TableBody,
    TableRow,
    Loading,
    NoItems,
    useTableHooks,
} from '@elements/AdminTable';
import { useContext } from 'react';
import CopyOnClick from '@elements/CopyOnClick';
import { Link, NavLink } from 'react-router-dom';
import type { RealFilters } from '@/api/admin/users';
import AdminContentBlock from '@elements/AdminContentBlock';
import { Button } from '@elements/button';
import { useStoreState } from '@/state/hooks';
import Pill from '@/components/elements/Pill';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faLockOpen, faUser, faUserCheck, faUserGear, faUserSlash } from '@fortawesome/free-solid-svg-icons';

function UsersContainer() {
    const { data: users } = useGetUsers();
    const { colors } = useStoreState(state => state.theme.data!);
    const { setPage, setFilters, sort, setSort, sortDirection } = useContext(UsersContext);

    const onSearch = (query: string): Promise<void> => {
        return new Promise(resolve => {
            if (query.length < 2) {
                setFilters(null);
            } else {
                setFilters({ username: query });
            }
            return resolve();
        });
    };

    return (
        <AdminContentBlock title={'User Accounts'}>
            <div css={tw`w-full flex flex-row items-center mb-8`}>
                <div css={tw`flex flex-col flex-shrink`} style={{ minWidth: '0' }}>
                    <h2 css={tw`text-2xl text-neutral-50 font-header font-medium`}>User Accounts</h2>
                    <p
                        css={tw`hidden md:block text-base text-neutral-400 whitespace-nowrap overflow-ellipsis overflow-hidden`}
                    >
                        All users that have access to the system.
                    </p>
                </div>

                <div css={tw`flex ml-auto pl-4`}>
                    <Link to={'/admin/users/new'}>
                        <Button>New User</Button>
                    </Link>
                </div>
            </div>
            <AdminTable>
                <ContentWrapper onSearch={onSearch}>
                    <Pagination data={users} onPageSelect={setPage}>
                        <div css={tw`overflow-x-auto`}>
                            <table css={tw`w-full table-auto`}>
                                <TableHead>
                                    <TableHeader
                                        name={'ID'}
                                        direction={sort === 'id' ? (sortDirection ? 1 : 2) : null}
                                        onClick={() => setSort('id')}
                                    />
                                    <TableHeader
                                        name={'Username'}
                                        direction={sort === 'username' ? (sortDirection ? 1 : 2) : null}
                                        onClick={() => setSort('username')}
                                    />
                                    <TableHeader
                                        name={'Email Address'}
                                        direction={sort === 'email' ? (sortDirection ? 1 : 2) : null}
                                        onClick={() => setSort('email')}
                                    />
                                    <TableHeader name={'Account State'} />
                                    <TableHeader name={'2 Factor'} />
                                    <TableHeader name={'Created At'} />
                                </TableHead>
                                <TableBody>
                                    {users !== undefined &&
                                        users.items.length > 0 &&
                                        users.items.map(user => (
                                            <TableRow key={user.id}>
                                                <td css={tw`px-6 text-sm text-neutral-200 text-left whitespace-nowrap`}>
                                                    <CopyOnClick text={user.id}>
                                                        <code css={tw`font-mono bg-neutral-900 rounded py-1 px-2`}>
                                                            {user.uuid.slice(0, 8)}
                                                        </code>
                                                    </CopyOnClick>
                                                </td>
                                                <td css={tw`px-6 text-sm text-neutral-200 text-left whitespace-nowrap`}>
                                                    <NavLink
                                                        to={`/admin/users/${user.id}`}
                                                        style={{ color: colors.primary }}
                                                        className={'hover:brightness-125 duration-300'}
                                                    >
                                                        {user.username}
                                                    </NavLink>
                                                </td>
                                                <td css={tw`px-6 text-sm text-neutral-200 text-left whitespace-nowrap`}>
                                                    {user.email}
                                                </td>
                                                <td css={tw`px-6 text-sm text-neutral-200 text-left whitespace-nowrap`}>
                                                    {user.isRootAdmin ? (
                                                        <Pill type={'success'}>
                                                            <FontAwesomeIcon
                                                                icon={faUserGear}
                                                                className={'my-auto mr-1'}
                                                                size={'sm'}
                                                            />{' '}
                                                            Admin
                                                        </Pill>
                                                    ) : (
                                                        <Pill type={'unknown'}>
                                                            <FontAwesomeIcon
                                                                icon={faUser}
                                                                className={'my-auto mr-1'}
                                                                size={'sm'}
                                                            />{' '}
                                                            Standard
                                                        </Pill>
                                                    )}
                                                    {user.state === 'suspended' ? (
                                                        <Pill type={'warn'}>
                                                            <FontAwesomeIcon
                                                                icon={faUserSlash}
                                                                className={'my-auto mr-1'}
                                                                size={'sm'}
                                                            />{' '}
                                                            Suspended
                                                        </Pill>
                                                    ) : (
                                                        <Pill type={'success'}>
                                                            <FontAwesomeIcon
                                                                icon={faUserCheck}
                                                                className={'my-auto mr-1'}
                                                                size={'sm'}
                                                            />{' '}
                                                            Active
                                                        </Pill>
                                                    )}
                                                </td>
                                                <td css={tw`px-6 text-sm text-neutral-200 text-left whitespace-nowrap`}>
                                                    {user.isUsingTwoFactor ? (
                                                        <Pill type={'success'}>
                                                            <FontAwesomeIcon
                                                                icon={faLock}
                                                                className={'my-auto mr-1'}
                                                                size={'sm'}
                                                            />{' '}
                                                            Enabled
                                                        </Pill>
                                                    ) : (
                                                        <Pill type={'danger'}>
                                                            <FontAwesomeIcon
                                                                icon={faLockOpen}
                                                                className={'my-auto mr-1'}
                                                                size={'sm'}
                                                            />{' '}
                                                            Disabled
                                                        </Pill>
                                                    )}
                                                </td>
                                                <td css={tw`px-6 text-sm text-neutral-200 text-left whitespace-nowrap`}>
                                                    <code css={tw`font-mono bg-neutral-900 rounded py-1 px-2`}>
                                                        {user.createdAt.toLocaleString()}
                                                    </code>
                                                </td>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </table>

                            {users === undefined ? <Loading /> : users.items.length < 1 ? <NoItems /> : null}
                        </div>
                    </Pagination>
                </ContentWrapper>
            </AdminTable>
        </AdminContentBlock>
    );
}

export default () => {
    const hooks = useTableHooks<RealFilters>();

    return (
        <UsersContext.Provider value={hooks}>
            <UsersContainer />
        </UsersContext.Provider>
    );
};
