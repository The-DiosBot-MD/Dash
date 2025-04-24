import http, { PaginatedResult, getPaginationSet } from '@/api/http';
import { Transformers, User } from '@/api/definitions/admin';
import useSWR from 'swr';
import { createContext } from '@/api/admin';
import { useContext } from 'react';

export type TicketStatus = 'resolved' | 'unresolved' | 'in-progress' | 'pending';

const filters = ['id', 'title', 'user', 'assigned_to', 'status', 'created_at'] as const;
export type Filters = (typeof filters)[number];

export interface Ticket {
    id: number;
    title: string;
    user: User;
    assigned_to?: User;
    status: TicketStatus;
    created_at: Date;
    updated_at?: Date | null;
    relationships: {
        messages?: TicketMessage[];
    };
}

export interface TicketMessage {
    id: number;
    message: string;
    author: User;
    created_at: Date;
    updated_at?: Date | null;
}

export interface ContextFilters {
    id?: number;
    title?: string;
    user?: User;
    assigned_to?: User;
    status?: TicketStatus;
    created_at?: Date;
    updated_at?: Date | null;
}

export const Context = createContext<ContextFilters>();

const getTickets = (): Promise<Ticket> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/application/tickets`)
            .then(({ data }) => resolve(Transformers.toTicket(data)))
            .catch(reject);
    });
};

const useGetTickets = (include: string[] = []) => {
    const { page, filters, sort, sortDirection } = useContext(Context);

    const params = {};
    if (filters !== null) {
        Object.keys(filters).forEach(key => {
            // @ts-expect-error todo
            params['filter[' + key + ']'] = filters[key];
        });
    }

    if (sort !== null) {
        // @ts-expect-error todo
        params.sort = (sortDirection ? '-' : '') + sort;
    }

    return useSWR<PaginatedResult<Ticket>>(['tickets', page, filters, sort, sortDirection], async () => {
        const { data } = await http.get('/api/application/tickets', {
            params: { include: include.join(','), page, ...params },
        });

        return {
            items: (data.data || []).map(Transformers.toTicket),
            pagination: getPaginationSet(data.meta.pagination),
        };
    });
};

export { getTickets, useGetTickets };
