import Spinner from '@elements/Spinner';
import AdminContentBlock from '@elements/AdminContentBlock';
import { useEffect, useState } from 'react';
import { getOrders } from '@/api/admin/billing/orders';
import OrdersTable from './OrdersTable';
import TitledGreyBox from '@elements/TitledGreyBox';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { Order } from '@/api/definitions/admin';

export default () => {
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        getOrders().then(data => setOrders(data));
    }, []);

    if (!orders) return <Spinner size={'large'} centered />;

    return (
        <AdminContentBlock title={'Billing Orders'}>
            <div className={'w-full flex flex-row items-center p-8'}>
                <div className={'flex flex-col flex-shrink'} style={{ minWidth: '0' }}>
                    <h2 className={'text-2xl text-neutral-50 font-header font-medium'}>Orders</h2>
                    <p
                        className={
                            'hidden lg:block text-base text-neutral-400 whitespace-nowrap overflow-ellipsis overflow-hidden'
                        }
                    >
                        A list of the orders placed on this Panel.
                    </p>
                </div>
            </div>
            <TitledGreyBox icon={faExclamationTriangle} title={'Important Information'} className={'mb-8'}>
                Pending orders are automatically set to expired and deleted after 7 days, making them no longer visible
                in the admin area. If you wish to remove billing orders from Jexactyl manually, you must make a database
                query to do so. Removing orders is NOT recommended, as users will not be able to renew their server if
                their original order is deleted.
            </TitledGreyBox>
            <OrdersTable data={orders} />
        </AdminContentBlock>
    );
};
