import tw from 'twin.macro';
import { Link } from 'react-router-dom';
import AdminContentBlock from '@elements/AdminContentBlock';
import { Button } from '@elements/button';
import * as Table from '@/components/elements/Table';
import { useGetUsers } from '@/api/admin/users';
import Spinner from '@/components/elements/Spinner';
import usePagination from '@/plugins/usePagination';
import { User } from '@/api/definitions/admin';
import Pill from '@/components/elements/Pill';
import {
    faUserGear,
    faUser,
    faUserSlash,
    faUserCheck,
    faLockOpen,
    faLock,
    faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function UsersContainer() {
    const { data: users } = useGetUsers();

    if (!users) return <Spinner size={'large'} centered />;

    const pagination = usePagination<User>(users.items, 10);

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
                        <Button>
                            <FontAwesomeIcon icon={faPlus} className={'mr-2 my-auto'} /> New User
                        </Button>
                    </Link>
                </div>
            </div>
            <Table.Table>
                <Table.Header>
                    <Table.HeaderItem>Username</Table.HeaderItem>
                    <Table.HeaderItem>Email Address</Table.HeaderItem>
                    <Table.HeaderItem>Account State</Table.HeaderItem>
                    <Table.HeaderItem>2 Factor</Table.HeaderItem>
                    <Table.HeaderItem>Created At</Table.HeaderItem>
                </Table.Header>
                <Table.Body>
                    {pagination.paginatedItems.map(user => (
                        <Table.BodyItem item={user.username} key={user.id} to={`/admin/users/${user.id}`}>
                            <td className={'px-6 py-4 whitespace-nowrap text-sm text-neutral-50'}>{user.email}</td>
                            <td className={'px-6 py-4 whitespace-nowrap text-sm text-neutral-50'}>
                                {user.isRootAdmin ? (
                                    <Pill type={'success'}>
                                        <FontAwesomeIcon icon={faUserGear} className={'my-auto mr-1'} size={'sm'} />{' '}
                                        Admin
                                    </Pill>
                                ) : (
                                    <Pill type={'unknown'}>
                                        <FontAwesomeIcon icon={faUser} className={'my-auto mr-1'} size={'sm'} />{' '}
                                        Standard
                                    </Pill>
                                )}
                                {user.state === 'suspended' ? (
                                    <Pill type={'warn'}>
                                        <FontAwesomeIcon icon={faUserSlash} className={'my-auto mr-1'} size={'sm'} />{' '}
                                        Suspended
                                    </Pill>
                                ) : (
                                    <Pill type={'success'}>
                                        <FontAwesomeIcon icon={faUserCheck} className={'my-auto mr-1'} size={'sm'} />{' '}
                                        Active
                                    </Pill>
                                )}
                            </td>
                            <td css={tw`px-6 text-sm text-neutral-200 text-left whitespace-nowrap`}>
                                {user.isUsingTwoFactor ? (
                                    <Pill type={'success'}>
                                        <FontAwesomeIcon icon={faLock} className={'my-auto mr-1'} size={'sm'} /> Enabled
                                    </Pill>
                                ) : (
                                    <Pill type={'danger'}>
                                        <FontAwesomeIcon icon={faLockOpen} className={'my-auto mr-1'} size={'sm'} />{' '}
                                        Disabled
                                    </Pill>
                                )}
                            </td>
                            <td css={tw`px-6 text-sm text-neutral-200 text-left whitespace-nowrap`}>
                                <code css={tw`font-mono bg-neutral-900 rounded py-1 px-2`}>
                                    {user.createdAt.toLocaleString()}
                                </code>
                            </td>
                        </Table.BodyItem>
                    ))}
                </Table.Body>
            </Table.Table>
            <Table.PaginatedFooter pagination={pagination} />
        </AdminContentBlock>
    );
}

export default () => {
    return <UsersContainer />;
};
