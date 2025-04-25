import { Order, Transformers } from '@/api/definitions/admin';
import { OrderFilters } from './types';
import { createContext, createPaginatedHook } from '@/api/admin';

export const Context = createContext<OrderFilters>();

export const useGetOrders = createPaginatedHook<Order, OrderFilters>({
    url: '/api/application/billing/orders',
    swrKey: 'orders',
    context: Context,
    transformer: Transformers.toOrder,
});
