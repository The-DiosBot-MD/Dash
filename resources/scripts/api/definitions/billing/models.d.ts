import { Model } from '@definitions';

interface Order extends Model {
    id: number;
    name: string;
    user_id: number;
    description: string;
    total: number;
    status: OrderStatus;
    is_renewal: boolean;
    created_at: Date;
}
