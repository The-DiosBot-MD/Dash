import http from '@/api/http';
import { Ticket, TicketStatus } from '@/api/admin/tickets/getTickets';
import { Transformers } from '@/api/definitions/admin';

export interface Values {
    title: string;
    user_id: number;
    assigned_to?: number | null;
    status?: TicketStatus | null;
}

export default (values: Values): Promise<Ticket> => {
    return new Promise((resolve, reject) => {
        http.post('/api/application/tickets', values)
            .then(({ data }) => resolve(Transformers.toTicket(data)))
            .catch(reject);
    });
};
