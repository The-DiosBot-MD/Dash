import { forwardRef } from 'react';
import * as React from 'react';
import { Form } from 'formik';
import styled from 'styled-components';
import { breakpoint } from '@/theme';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
};

const Container = styled.div`
    ${breakpoint('sm')`
        ${tw`w-4/5 mx-auto`}
    `};

    ${breakpoint('md')`
        ${tw`p-10`}
    `};

    ${breakpoint('lg')`
        ${tw`w-3/5`}
    `};

    ${breakpoint('xl')`
        ${tw`w-full pt-32`}
    `};
`;

export default forwardRef<HTMLFormElement, Props>(({ title, ...props }, ref) => (
    <Container>
        <div className={'w-full'}>
            <div className={'lg:w-1/2 lg:mx-auto'}>
                {title && <h2 css={tw`text-3xl text-center text-neutral-100 font-medium py-4`}>{title}</h2>}
                <FlashMessageRender css={tw`mb-2 px-1`} />
                <Form {...props} ref={ref}>
                    <div css={tw`w-full bg-zinc-800/50 shadow-lg rounded-lg p-6 mx-1`}>
                        <div css={tw`flex-1`}>{props.children}</div>
                    </div>
                </Form>
                <p css={tw`text-center text-neutral-300 text-xs mt-4`}>
                    &copy; {new Date().getFullYear()}&nbsp;
                    <a
                        rel={'noopener nofollow noreferrer'}
                        href={'https://jexactyl.com'}
                        target={'_blank'}
                        css={tw`no-underline text-neutral-300 hover:text-green-400 duration-300`}
                    >
                        Jexactyl
                    </a>
                    , built on&nbsp;
                    <a
                        rel={'noopener nofollow noreferrer'}
                        href={'https://pterodactyl.io'}
                        target={'_blank'}
                        css={tw`no-underline text-neutral-300 hover:text-green-400 duration-300`}
                    >
                        Pterodactyl.
                    </a>
                </p>
            </div>
        </div>
    </Container>
));
