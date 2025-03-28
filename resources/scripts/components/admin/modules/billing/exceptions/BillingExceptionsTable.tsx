import Spinner from '@elements/Spinner';
import usePagination from '@/plugins/usePagination';
import { formatDistanceToNowStrict } from 'date-fns';
import { NoItems } from '@elements/AdminTable';
import { Body, BodyItem, Header, HeaderItem, PaginatedFooter, Table } from '@elements/Table';
import { BillingException } from '@/api/definitions/admin';
import { Button } from '@/components/elements/button';
import { CheckCircleIcon } from '@heroicons/react/outline';
import { resolveBillingException } from '@/api/admin/billing/exceptions';

export default ({ data }: { data?: BillingException[] }) => {
    if (!data) return <Spinner centered />;

    const pagination = usePagination<BillingException>(data, 10);

    return (
        <>
            <Table>
                <Header>
                    <HeaderItem>UUID</HeaderItem>
                    <HeaderItem>Exception</HeaderItem>
                    <HeaderItem>Resolution</HeaderItem>
                    <HeaderItem>Created At</HeaderItem>
                    <HeaderItem>Actions</HeaderItem>
                </Header>
                <Body>
                    {pagination.paginatedItems.map(exception => (
                        <BodyItem item={exception.uuid.split('-')[0]!.toString()} key={exception.id}>
                            <td className={'px-6 py-4 text-white font-bold'}>{exception.title}</td>
                            <td className={'px-6 py-4'}>{exception.description}</td>
                            <td className={'px-6 py-4'}>
                                {formatDistanceToNowStrict(exception.created_at, { addSuffix: true })}
                            </td>
                            <td className={'px-6 py-4'}>
                                <Button
                                    size={Button.Sizes.Small}
                                    className={'text-white font-bold'}
                                    onClick={() => resolveBillingException(exception.uuid)}
                                >
                                    <CheckCircleIcon className={'w-4 h-4 mt-[2px] mr-0.5'} /> Resolve
                                </Button>
                            </td>
                        </BodyItem>
                    ))}
                </Body>
            </Table>
            {data.length < 1 ? <NoItems /> : <PaginatedFooter pagination={pagination} />}
        </>
    );
};
