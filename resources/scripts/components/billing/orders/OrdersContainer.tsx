import Pill, { PillStatus } from '@elements/Pill';
import PageContentBlock from '@elements/PageContentBlock';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Body, BodyItem, PaginatedFooter, Header, HeaderItem, Table } from '@elements/Table';
import { useEffect, useState } from 'react';
import { getOrders, Order } from '@/api/billing/orders';
import Spinner from '@elements/Spinner';
import { formatDistanceToNowStrict } from 'date-fns';
import usePagination from '@/plugins/usePagination';
import { useStoreState } from '@/state/hooks';

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

export default () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const settings = useStoreState(s => s.everest.data!.billing);

    useEffect(() => {
        getOrders()
            .then(data => setOrders(data))
            .catch(error => console.log(error));
    }, []);

    if (!orders) return <Spinner size={'small'} centered />;

    const pagination = usePagination<Order>(orders, 10);

    return (
        <PageContentBlock>
            <div className={'text-3xl lg:text-5xl font-bold mt-8 mb-12'}>
                Billing Activity
                <p className={'text-gray-400 font-normal text-sm mt-1'}>
                    View and manage the active and previous subscriptions you&apos;ve created.
                </p>
                <FlashMessageRender byKey={'billing:plans'} className={'mt-4'} />
            </div>
            <div className={'text-gray-400 text-center'}>
                <Table>
                    <Header>
                        <HeaderItem>Name</HeaderItem>
                        <HeaderItem>Price</HeaderItem>
                        <HeaderItem>Description</HeaderItem>
                        <HeaderItem>Created At</HeaderItem>
                        <HeaderItem>Payment State</HeaderItem>
                        <HeaderItem>&nbsp;</HeaderItem>
                    </Header>
                    <Body>
                        {pagination.paginatedItems.map(order => (
                            <BodyItem
                                item={order.name.split('-')[0]!.toString()}
                                key={1}
                                to={`/billing/order/${order.product_id}`}
                            >
                                <td className={'px-6 py-4 text-white font-bold'}>
                                    {settings.currency.symbol}
                                    {order.total}/mo
                                </td>
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
                            </BodyItem>
                        ))}
                    </Body>
                </Table>
                <PaginatedFooter pagination={pagination} />
            </div>
        </PageContentBlock>
    );
};