import { useFormikContext } from 'formik';
import { useEffect, useState } from 'react';

import type { Database } from '@/api/admin/databases/getDatabases';
import searchDatabases from '@/api/admin/databases/searchDatabases';
import SearchableSelect, { Option } from '@elements/SearchableSelect';
import getDatabase from '@/api/admin/databases/getDatabase';

export default ({ selected }: { selected: number | null }) => {
    const context = useFormikContext();

    const [database, setDatabase] = useState<Database | null>(null);
    const [databases, setDatabases] = useState<Database[] | null>(null);

    const onSearch = (query: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            searchDatabases({ name: query })
                .then(databases => {
                    setDatabases(databases);
                    return resolve();
                })
                .catch(reject);
        });
    };

    const onSelect = (database: Database | null) => {
        setDatabase(database);
        context.setFieldValue('databaseHostId', database?.id || null);
    };

    const getSelectedText = (database: Database | null): string | undefined => {
        return database?.name;
    };

    useEffect(() => {
        if (selected) {
            getDatabase(selected).then(database => setDatabase(database));
        }
    }, [selected]);

    return (
        <SearchableSelect
            id={'databaseId'}
            name={'databaseId'}
            label={'Database Host'}
            placeholder={'Select a database host...'}
            items={databases}
            selected={database}
            setSelected={setDatabase}
            setItems={setDatabases}
            onSearch={onSearch}
            onSelect={onSelect}
            getSelectedText={getSelectedText}
            nullable
        >
            {databases?.map(d => (
                <Option key={d.id} selectId={'databaseId'} id={d.id} item={d} active={d.id === database?.id}>
                    {d.name}
                </Option>
            ))}
        </SearchableSelect>
    );
};
