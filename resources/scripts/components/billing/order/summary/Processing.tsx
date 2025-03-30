import { useLocation, useNavigate } from 'react-router-dom';
import { useStoreState } from '@/state/hooks';
import PageContentBlock from '@elements/PageContentBlock';
import { useEffect } from 'react';
import processOrder from '@/api/billing/processOrder';
import useFlash from '@/plugins/useFlash';
import FlashMessageRender from '@/components/FlashMessageRender';
import Spinner from '@elements/Spinner';

export default () => {
    const location = useLocation();
    const navigate = useNavigate();
    const params = new URLSearchParams(location.search);
    const { colors } = useStoreState(s => s.theme.data!);
    const { addFlash, clearFlashes } = useFlash();

    const intent = params.get('payment_intent');

    useEffect(() => {
        clearFlashes();

        const renewal = Boolean(params.get('renewal'));

        if (!intent) {
            addFlash({
                key: 'billing:process',
                type: 'error',
                message: 'Your order could not be fulfilled. Please contact an administrator.',
            });

            return;
        }

        processOrder(intent, renewal)
            .then(() => {
                navigate('/billing/success');
            })
            .catch(() => {
                navigate('/billing/cancel');
            });
    }, []);

    return (
        <PageContentBlock>
            <div className={'flex justify-center'}>
                <div
                    className={'w-full sm:w-3/4 md:w-1/2 p-12 rounded-lg shadow-lg text-center relative'}
                    style={{ backgroundColor: colors.secondary }}
                >
                    <FlashMessageRender byKey={'billing:process'} className={'mb-6'} />
                    <h2 className={'text-white font-bold text-4xl'}>
                        Processing Order <Spinner centered />
                    </h2>
                    <p className={'text-sm text-neutral-200 mt-2'}>
                        Our systems are currently working on deploying your server to our systems. Sit tight while your
                        new server is deployed!
                    </p>
                    <p className={'text-2xs text-neutral-400 mt-8'}>Session {intent ?? 'Unknown'}</p>
                </div>
            </div>
        </PageContentBlock>
    );
};
