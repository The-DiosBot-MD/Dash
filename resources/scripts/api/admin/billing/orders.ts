import { Order, Transformers } from '@/api/definitions/admin';
import http from '@/api/http';

export const getOrders = (): Promise<Order[]> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/application/billing/orders`)
            .then(({ data }) => resolve((data.data || []).map(Transformers.toOrder)))
            .catch(reject);
    });
};
