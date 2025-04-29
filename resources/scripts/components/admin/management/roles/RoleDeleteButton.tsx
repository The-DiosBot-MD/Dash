import { Actions, useStoreActions } from 'easy-peasy';
import { useState } from 'react';
import { deleteRole } from '@/api/admin/roles';
import { Button } from '@/components/elements/button';
import { ApplicationStore } from '@/state';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { Dialog } from '@/components/elements/dialog';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';

interface Props {
    roleId: number;
    onDeleted: () => void;
}

export default ({ roleId, onDeleted }: Props) => {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const { clearFlashes, clearAndAddHttpError } = useStoreActions(
        (actions: Actions<ApplicationStore>) => actions.flashes,
    );

    const onDelete = () => {
        setLoading(true);
        clearFlashes('role');

        deleteRole(roleId)
            .then(() => {
                setLoading(false);
                onDeleted();
            })
            .catch(error => {
                console.error(error);
                clearAndAddHttpError({ key: 'role', error });

                setLoading(false);
                setVisible(false);
            });
    };

    return (
        <>
            <Dialog.Confirm
                open={visible}
                title={'Delete role?'}
                confirm={'Yes, delete role'}
                onConfirmed={onDelete}
                onClose={() => setVisible(false)}
                buttonType={'danger'}
            >
                <SpinnerOverlay visible={loading} />
                Are you sure you want to delete this role? All administrators with this role assigned will have full
                access.
            </Dialog.Confirm>

            <Button.Danger type={'button'} size={Button.Sizes.Small} onClick={() => setVisible(true)}>
                <FontAwesomeIcon icon={faTrash} />
            </Button.Danger>
        </>
    );
};
