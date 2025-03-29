import http from '@/api/http';

export const importBillingConfiguration = (
    uploadedJson: object,
    override: boolean,
    ignoreDuplicates: boolean,
): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.post('/api/application/billing/config/import', {
            data: uploadedJson,
            override,
            ignore_duplicates: ignoreDuplicates,
        })
            .then(() => resolve())
            .catch(error => reject(error));
    });
};
