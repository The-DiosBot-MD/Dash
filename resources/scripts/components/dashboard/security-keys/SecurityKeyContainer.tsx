import { useEffect } from 'react';
import ContentBox from '@elements/ContentBox';
import SpinnerOverlay from '@elements/SpinnerOverlay';
import FlashMessageRender from '@/components/FlashMessageRender';
import PageContentBlock from '@elements/PageContentBlock';
import tw from 'twin.macro';
import GreyRowBox from '@elements/GreyRowBox';
import { useFlashKey } from '@/plugins/useFlash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey } from '@fortawesome/free-solid-svg-icons';
import CreateSecurityKeyForm from '@/components/dashboard/security-keys/CreateSecurityKeyForm';
import { useSecurityKeys } from '@/api/account/security-keys';
import { Button } from '../../elements/button';

export default () => {
    const { clearAndAddHttpError } = useFlashKey('account');
    const { data, isValidating, error } = useSecurityKeys({
        revalidateOnMount: true,
        revalidateOnFocus: false,
    });

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error, data]);

    return (
        <PageContentBlock title={'Security Keys'}>
            <FlashMessageRender byKey={'account'} />
            <div className={'text-3xl lg:text-5xl font-bold mt-8 mb-12'}>
                Security Keys
                <p className={'text-gray-400 font-normal text-sm mt-1'}>
                    Create, use and delete security keys to access your account.
                </p>
            </div>
            <div css={tw`md:flex flex-nowrap my-10`}>
                <ContentBox title={'Add security key'} css={tw`flex-none w-full md:w-1/2`}>
                    <CreateSecurityKeyForm />
                </ContentBox>
                <ContentBox title={'Available Keys'} css={tw`flex-1 overflow-hidden mt-8 md:mt-0 md:ml-8`}>
                    <SpinnerOverlay visible={!data && isValidating} />
                    {!data || !data.length ? (
                        <p css={tw`text-center text-sm`}>{!data ? 'Loading...' : 'No keys exist for this account.'}</p>
                    ) : (
                        data.map((key, index) => (
                            <GreyRowBox
                                key={key.publicKeyId}
                                css={[tw`bg-black/50 flex space-x-4 items-center`, index > 0 && tw`mt-2`]}
                            >
                                <FontAwesomeIcon icon={faKey} css={tw`text-neutral-300`} />
                                <div css={tw`flex-1`}>
                                    <p css={tw`text-lg font-bold break-words`}>{key.name}</p>
                                    <p css={tw`text-xs mt-1 font-mono truncate text-gray-300`}>{key.uuid}</p>
                                    <p css={tw`text-xs mt-1 text-gray-400 uppercase`}>
                                        Added on:&nbsp;
                                        {key.createdAt.toLocaleString()}
                                    </p>
                                </div>
                                <Button.Danger>Delete</Button.Danger>
                            </GreyRowBox>
                        ))
                    )}
                </ContentBox>
            </div>
        </PageContentBlock>
    );
};
