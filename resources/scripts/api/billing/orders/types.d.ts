export type OrderStatus = 'pending' | 'expired' | 'failed' | 'processed';

export interface OrderFilters {
    id?: number;
    name?: string;
}
