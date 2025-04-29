import { useGetRolePermissions, Context as PermissionContext } from '@/api/admin/roles/permissions';
import AdminTable, {
    ContentWrapper,
    Pagination,
    TableHead,
    TableHeader,
    TableBody,
    TableRow,
    Loading,
    NoItems,
} from '@elements/AdminTable';
import { useContext } from 'react';

export default () => {
    const { data: permissions, error, isValidating } = useGetRolePermissions();
    const { setPage, sort, sortDirection, setSort, setFilters } = useContext(PermissionContext);

    const length = permissions?.items?.length || 0;

    const onSearch = (query: string): Promise<void> => {
        return new Promise(resolve => {
            if (query.length < 2) {
                setFilters(null);
            } else {
                setPage(1);
                setFilters({
                    key: query,
                });
            }
            return resolve();
        });
    };

    return (
        <AdminTable>
            <ContentWrapper onSearch={onSearch}>
                <Pagination data={permissions} onPageSelect={setPage}>
                    <div className={'overflow-x-auto'}>
                        <table className={'w-full table-auto'}>
                            <TableHead>
                                <TableHeader
                                    name={'Key'}
                                    direction={sort === 'key' ? (sortDirection ? 1 : 2) : null}
                                    onClick={() => setSort('key')}
                                />
                                <TableHeader name={'Description'} />
                            </TableHead>

                            <TableBody>
                                {permissions !== undefined &&
                                    !error &&
                                    !isValidating &&
                                    length > 0 &&
                                    permissions.items.map(permission => (
                                        <TableRow key={permission.key}>
                                            <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
                                                <code className={'font-mono bg-neutral-900 rounded py-1 px-2'}>
                                                    {permission.key}
                                                </code>
                                            </td>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </table>

                        {permissions === undefined || (error && isValidating) ? (
                            <Loading />
                        ) : length < 1 ? (
                            <NoItems />
                        ) : null}
                    </div>
                </Pagination>
            </ContentWrapper>
        </AdminTable>
    );
};
