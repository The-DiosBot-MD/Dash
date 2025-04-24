import http, { PaginatedResult, getPaginationSet } from '@/api/http';
import { Transformers, User } from '@/api/definitions/admin';
import useSWR from 'swr';
import { createContext } from '@/api/admin';
import { TicketMessage } from '../getTickets';
import { useContext } from 'react';

const filters = ['id'] as const;
export type Filters = (typeof filters)[number];

export interface ContextFilters {
    id?: number;
    message?: string;
    author?: User;
    created_at?: Date;
    updated_at?: Date | null;
}

export const Context = createContext<ContextFilters>();

const getTicketMessages = (id: number): Promise<TicketMessage> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/application/tickets/${id}/messages`)
            .then(({ data }) => resolve(Transformers.toTicketMessage(data)))
            .catch(reject);
    });
};

const useGetTicketMessages = (id: number, include: string[] = []) => {
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

    return useSWR<PaginatedResult<TicketMessage>>(['ticket_messages', page, filters, sort, sortDirection], async () => {
        const { data } = await http.get(`/api/application/tickets/${id}/messages`, {
            params: { include: include.join(','), page, ...params },
        });

        return {
            items: (data.data || []).map(Transformers.toTicketMessage),
            pagination: getPaginationSet(data.meta.pagination),
        };
    });
};

export { useGetTicketMessages, getTicketMessages };
