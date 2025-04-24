import http from '@/api/http';
import { BillingException, Transformers } from '@/api/definitions/admin';

export const getBillingExceptions = (): Promise<BillingException[]> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/application/billing/exceptions`)
            .then(({ data }) => resolve((data.data || []).map((datum: any) => Transformers.toBillingException(datum))))
            .catch(reject);
    });
};

export const resolveBillingException = (uuid: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.delete(`/api/application/billing/exceptions/${uuid}`)
            .then(() => resolve())
            .catch(reject);
    });
};

export const resolveAllBillingExceptions = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.delete(`/api/application/billing/exceptions`)
            .then(() => resolve())
            .catch(reject);
    });
};
