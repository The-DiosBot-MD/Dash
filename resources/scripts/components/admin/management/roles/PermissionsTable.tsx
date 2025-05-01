import { getRolePermisisons } from '@/api/admin/roles';
import Spinner from '@/components/elements/Spinner';
import { useEffect, useState } from 'react';
import { PanelPermissions } from '@/state/permissions';
import AdminBox from '@/components/elements/AdminBox';
import Checkbox from '@/components/elements/inputs/Checkbox';
import Tooltip from '@/components/elements/tooltip/Tooltip';

export default () => {
    const [permissions, setPermissions] = useState<PanelPermissions>();

    useEffect(() => {
        getRolePermisisons().then(data => setPermissions(data.attributes.permissions));
    }, []);

    if (!permissions) return <Spinner size={'large'} centered />;

    return (
        <div className={'grid lg:grid-cols-4 gap-4'}>
            {Object.keys(permissions).map(key => (
                <AdminBox title={key[0]?.toUpperCase() + key.slice(1, key.length).toString()} key={key}>
                    <p className={'mb-4 text-gray-400 text-xs'}>{permissions[key]?.description}</p>
                    <div className={'px-1'}>
                        {Object.keys(permissions[key]?.keys ?? {}).map(pkey => (
                            <div key={`${key}.${pkey}`}>
                                <Checkbox id={`${key}.${pkey}`} name={`${key}.${pkey}`} />
                                <Tooltip placement={'top'} content={permissions[key]?.description.toString() ?? ''}>
                                    <div className={'inline-flex my-auto ml-2 font-semibold'}>{`${key}.${pkey}`}</div>
                                </Tooltip>
                            </div>
                        ))}
                    </div>
                </AdminBox>
            ))}
        </div>
    );
};
