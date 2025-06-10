import { Model } from '@definitions';

interface Order extends Model {
    id: number;
    name: string;
    user_id: number;
    description: string;
    total: number;
    product_id: number;
    status: OrderStatus;
    is_renewal: boolean;
    created_at: Date;
}
