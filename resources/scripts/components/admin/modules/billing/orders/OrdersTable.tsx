import { Order } from '@/api/billing/orders';
import Spinner from '@elements/Spinner';
import usePagination from '@/plugins/usePagination';
import { formatDistanceToNowStrict } from 'date-fns';
import { NoItems } from '@elements/AdminTable';
import Pill, { PillStatus } from '@elements/Pill';
import { Body, BodyItem, Header, HeaderItem, PaginatedFooter, Table } from '@elements/Table';

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

export default ({ data }: { data?: Order[] }) => {
    if (!data) return <Spinner centered />;

    const pagination = usePagination<Order>(data, 10);

    return (
        <>
            <Table>
                <Header>
                    <HeaderItem>Name</HeaderItem>
                    <HeaderItem>Price</HeaderItem>
                    <HeaderItem>Description</HeaderItem>
                    <HeaderItem>Created At</HeaderItem>
                    <HeaderItem>Payment State</HeaderItem>
                    <HeaderItem>Order Type</HeaderItem>
                    <HeaderItem>Risk Index</HeaderItem>
                </Header>
                <Body>
                    {pagination.paginatedItems.map(order => (
                        <BodyItem
                            item={order.name.split('-')[0]!.toString()}
                            key={1}
                            to={`/billing/order/${order.product_id}`}
                        >
                            <td className={'px-6 py-4 text-white font-bold'}>${order.total}/mo</td>
                            <td className={'px-6 py-4'}>{order.description}</td>
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
                                    type={order.threat_index > 0 ? getColor(order.threat_index) : 'unknown'}
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
                        </BodyItem>
                    ))}
                </Body>
            </Table>
            {data.length < 1 ? <NoItems /> : <PaginatedFooter pagination={pagination} />}
        </>
    );
};
