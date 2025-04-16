import { useEffect, useState } from 'react';
import Spinner from '@/components/elements/Spinner';
import { getEvents, sendTestEvent, toggleEventStatus, WebhookEvent } from '@/api/admin/webhooks';
import EventsTable from './EventsTable';
import { Button } from '@/components/elements/button';
import { useStoreState } from '@/state/hooks';
import useFlash from '@/plugins/useFlash';

export default () => {
    const { colors } = useStoreState(s => s.theme.data!);
    const [events, setEvents] = useState<WebhookEvent[]>();
    const { clearFlashes, addFlash, clearAndAddHttpError } = useFlash();

    useEffect(() => {
        getEvents().then(setEvents);
    }, []);

    const doDisable = () => {
        toggleEventStatus(false).then(() => window.location.reload());
    };

    const doEnable = () => {
        toggleEventStatus(true).then(() => window.location.reload());
    };

    const doTest = () => {
        clearFlashes();

        sendTestEvent()
            .then(() => {
                addFlash({ key: 'admin:webhooks', type: 'success', message: 'Webhook sent successfully!' });
            })
            .catch(error => clearAndAddHttpError({ key: 'admin:webhooks', error }));
    };

    if (!events) return <Spinner size={'large'} centered />;

    return (
        <>
            <div className={'flex justify-end mb-6'}>
                <div className={'p-2 w-fit rounded-lg space-x-3'} style={{ background: colors.secondary }}>
                    <Button.Text onClick={doTest} variant={Button.Variants.Secondary}>
                        Send Test
                    </Button.Text>
                    <Button.Danger onClick={doDisable}>Disable All</Button.Danger>
                    <Button onClick={doEnable}>Enable All</Button>
                </div>
            </div>
            <EventsTable events={events} />
        </>
    );
};
