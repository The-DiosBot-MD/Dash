import Pill, { PillStatus } from '@elements/Pill';
import { useGetOrders, Context as OrderContext } from '@/api/admin/billing/orders';
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
} from '@/components/elements/AdminTable';
import CopyOnClick from '@/components/elements/CopyOnClick';
import tw from 'twin.macro';
import { useContext, useEffect } from 'react';
import useFlash from '@/plugins/useFlash';
import { formatDistanceToNowStrict } from 'date-fns';
import Spinner from '@/components/elements/Spinner';
import { OrderFilters } from '@/api/admin/billing/types';

export function format(date: number): string {
    let prefix = 'th';

    switch (date) {
        case 1:
        case 21:
        case 31:
            prefix = 'st';
            break;
        case 2:
        case 22:
            prefix = 'nd';
            break;
        case 3:
        case 23:
            prefix = 'rd';
            break;
        default:
            break;
    }

    return `${date}${prefix}`;
}

export function type(state: string): PillStatus {
    switch (state) {
        case 'processed':
            return 'success';
        case 'failed':
            return 'danger';
        case 'pending':
            return 'warn';
        default:
            return 'unknown';
    }
}

function getColor(index: number) {
    if (index >= 50) return 'danger';
    if (index >= 25) return 'warn';
    else return 'success';
}

function OrderTable() {
    const { data: orders, error } = useGetOrders();
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { setSort, sort, setPage, sortDirection, setFilters } = useContext(OrderContext);

    const onSearch = (query: string): Promise<void> => {
        return new Promise(resolve => {
            if (query.length < 2) {
                setFilters(null);
            } else {
                setFilters({ name: query });
            }
            return resolve();
        });
    };

    useEffect(() => {
        if (!error) {
            clearFlashes('admin:billing:orders');
            return;
        }

        clearAndAddHttpError({ key: 'admin:billing:orders', error });
    }, [error]);

    return (
        <>
            <AdminTable>
                <ContentWrapper onSearch={onSearch}>
                    <Pagination data={orders} onPageSelect={setPage}>
                        <div css={tw`overflow-x-auto`}>
                            <table css={tw`w-full table-auto`}>
                                <TableHead>
                                    <TableHeader
                                        name={'ID'}
                                        direction={sort === 'id' ? (sortDirection ? 1 : 2) : null}
                                        onClick={() => setSort('id')}
                                    />
                                    <TableHeader
                                        name={'Total Price'}
                                        direction={sort === 'total' ? (sortDirection ? 1 : 2) : null}
                                        onClick={() => setSort('total')}
                                    />
                                    <TableHeader name={'Description'} />
                                    <TableHeader
                                        name={'Created At'}
                                        direction={sort === 'created_at' ? (sortDirection ? 1 : 2) : null}
                                        onClick={() => setSort('created_at')}
                                    />
                                    <TableHeader name={'Payment State'} />
                                    <TableHeader
                                        name={'Order Type'}
                                        direction={sort === 'is_renewal' ? (sortDirection ? 1 : 2) : null}
                                        onClick={() => setSort('is_renewal')}
                                    />
                                    <TableHeader
                                        name={'Threat Index'}
                                        direction={sort === 'threat_index' ? (sortDirection ? 1 : 2) : null}
                                        onClick={() => setSort('threat_index')}
                                    />
                                    <TableHeader />
                                </TableHead>
                                <TableBody>
                                    {orders !== undefined &&
                                        orders.items.length > 0 &&
                                        orders.items.map(order => (
                                            <TableRow key={order.id}>
                                                <td css={tw`px-6 text-sm text-neutral-200 text-left whitespace-nowrap`}>
                                                    <CopyOnClick text={order.id}>
                                                        <code css={tw`font-mono bg-neutral-900 rounded py-1 px-2`}>
                                                            {order.id}
                                                        </code>
                                                    </CopyOnClick>
                                                </td>
                                                <td className={'px-6 py-4 text-white font-bold'}>${order.total}/mo</td>
                                                <td className={'px-6 py-4'}>
                                                    {order.name.slice(0, 8)} {order.description}
                                                </td>
                                                <td className={'px-6 py-4'}>
                                                    {formatDistanceToNowStrict(order.created_at, { addSuffix: true })}
                                                </td>
                                                <td className={'px-6 py-4 text-left'}>
                                                    <Pill size={'small'} type={type(order.status)}>
                                                        {order.status}
                                                    </Pill>
                                                </td>
                                                <td className={'pr-12 py-4 text-right'}>
                                                    <Pill size={'small'} type={order.is_renewal ? 'info' : 'success'}>
                                                        {order.is_renewal ? 'Upgrade' : 'New Server'}
                                                    </Pill>
                                                </td>
                                                <td className={'pr-12 py-4 text-right'}>
                                                    <Pill
                                                        size={'small'}
                                                        type={
                                                            order.threat_index > 0
                                                                ? getColor(order.threat_index)
                                                                : 'unknown'
                                                        }
                                                    >
                                                        {order.threat_index < 0 ? (
                                                            <span className={'text-xs inline-flex my-1'}>
                                                                <Spinner size={'small'} />
                                                                &nbsp;Processing
                                                            </span>
                                                        ) : (
                                                            `${order.threat_index}/100`
                                                        )}
                                                    </Pill>
                                                </td>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </table>
                            {orders === undefined ? <Loading /> : orders.items.length < 1 ? <NoItems /> : null}
                        </div>
                    </Pagination>
                </ContentWrapper>
            </AdminTable>
        </>
    );
}

export default () => {
    const hooks = useTableHooks<OrderFilters>();

    return (
        <OrderContext.Provider value={hooks}>
            <OrderTable />
        </OrderContext.Provider>
    );
};
