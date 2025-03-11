import Pill, { PillStatus } from '@elements/Pill';
import PageContentBlock from '@elements/PageContentBlock';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Body, BodyItem, PaginatedFooter, Header, HeaderItem, Table } from '@elements/Table';
import { useEffect, useState } from 'react';
import { getOrders, Order } from '@/api/billing/orders';
import Spinner from '@elements/Spinner';
import { formatDistanceToNowStrict } from 'date-fns';
import usePagination from '@/plugins/usePagination';
import { useStoreState } from '@/state/hooks';
import Select from '@elements/Select';
import useFlash from '@/plugins/useFlash';

// Add currency conversion interfaces
interface ExchangeRates {
    [key: string]: number;
}

interface CurrencyData {
    code: string;
    symbol: string;
    name: string;
}

// Most common currencies with their symbols
const currencies: Record<string, CurrencyData> = {
    USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
    EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
    GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
    CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    RUB: { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
};

export function format(date: number): string {
    let prefix = 'th';

    switch (date) {
        case 1:
        case 21:
        case 31:
            prefix = 'st';
            break;
        case 2:
        case 22:
            prefix = 'nd';
            break;
        case 3:
        case 23:
            prefix = 'rd';
            break;
        default:
            break;
    }

    return `${date}${prefix}`;
}

export function type(state: string): PillStatus {
    switch (state) {
        case 'processed':
            return 'success';
        case 'failed':
            return 'danger';
        case 'pending':
            return 'warn';
        default:
            return 'unknown';
    }
}

export default () => {
    const { addError } = useFlash();
    const [orders, setOrders] = useState<Order[]>([]);
    const settings = useStoreState(s => s.everest.data!.billing);
    const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
    const [selectedCurrency, setSelectedCurrency] = useState<string>(() => {
        // Try to load from localStorage or use browser's language to determine default currency
        const saved = localStorage.getItem('preferred_currency');
        if (saved && currencies[saved]) return saved;
        
        // Default to system currency
        return settings.currency.code;
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingRates, setIsLoadingRates] = useState(true);

    // Function to convert currency
    const convertCurrency = (amount: number): { value: number; formatted: string } => {
        // If we're already in the system's base currency or rates aren't loaded yet
        if (selectedCurrency === settings.currency.code || !exchangeRates[selectedCurrency]) {
            return {
                value: amount,
                formatted: `${currencies[settings.currency.code]?.symbol || settings.currency.symbol}${amount.toFixed(2)}`
            };
        }
        
        // Since our rates are CAD-based, we need to convert from CAD to the target currency
        // The rate represents how much of the target currency you get for 1 CAD
        const rate = exchangeRates[selectedCurrency];
        const convertedValue = amount * rate;
        
        // Log the conversion for debugging
        console.log(`Converting ${amount} ${settings.currency.code} to ${selectedCurrency}:
            Rate: 1 ${settings.currency.code} = ${rate} ${selectedCurrency}
            Result: ${amount} × ${rate} = ${convertedValue.toFixed(2)} ${selectedCurrency}`);
        
        return {
            value: parseFloat(convertedValue.toFixed(2)),
            formatted: `${currencies[selectedCurrency]?.symbol || ''}${convertedValue.toFixed(2)}`
        };
    };
    
    // Fetch exchange rates
    const fetchExchangeRates = async () => {
        setIsLoadingRates(true);
        try {
            // Check if we have cached rates less than 1 hour old
            const cachedRates = localStorage.getItem('exchange_rates');
            const cachedTimestamp = localStorage.getItem('exchange_rates_timestamp');
            
            if (cachedRates && cachedTimestamp) {
                const timestamp = parseInt(cachedTimestamp);
                const oneHourAgo = Date.now() - 60 * 60 * 1000;
                
                // Use cached rates if less than 1 hour old
                if (timestamp > oneHourAgo) {
                    setExchangeRates(JSON.parse(cachedRates));
                    setIsLoadingRates(false);
                    return;
                }
            }
            
            // Use our custom backend endpoint
            const response = await fetch(`/api/client/exchange-rates?base=${settings.currency.code}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch exchange rates');
            }
            
            const data = await response.json();
            
            if (data && data.rates) {
                // Store the rates in state and localStorage
                setExchangeRates(data.rates);
                localStorage.setItem('exchange_rates', JSON.stringify(data.rates));
                localStorage.setItem('exchange_rates_timestamp', Date.now().toString());
            } else {
                throw new Error('Invalid response from exchange rate API');
            }
        } catch (error) {
            console.error('Error fetching exchange rates:', error);
            addError('Failed to fetch currency conversion rates. Using estimated rates instead.');
            
            // Set fallback rates - based on CAD
            setExchangeRates({
                USD: 0.74,
                EUR: 0.64,
                GBP: 0.58,
                CAD: 1.00,
                AUD: 1.11,
                JPY: 111.50,
                INR: 61.60,
                CNY: 5.33,
                BRL: 3.72,
                RUB: 67.24,
            });
        } finally {
            setIsLoadingRates(false);
        }
    };
    
    // Save currency preference
    useEffect(() => {
        localStorage.setItem('preferred_currency', selectedCurrency);
    }, [selectedCurrency]);

    useEffect(() => {
        setIsLoading(true);
        Promise.all([
            getOrders(),
            fetchExchangeRates()
        ])
        .then(([ordersData]) => {
            setOrders(ordersData);
            setIsLoading(false);
        })
        .catch(error => {
            console.error(error);
            setIsLoading(false);
            addError('Failed to load order data.');
        });
    }, []);

    if (isLoading) return <Spinner size={'small'} centered />;

    const pagination = usePagination<Order>(orders, 10);

    return (
        <PageContentBlock>
            <div className={'text-3xl lg:text-5xl font-bold mt-8 mb-12'}>
                Billing Activity
                <p className={'text-gray-400 font-normal text-sm mt-1'}>
                    View and manage the active and previous subscriptions you&apos;ve created.
                </p>
                <FlashMessageRender byKey={'billing:plans'} className={'mt-4'} />
            </div>
            
            {/* Currency selector */}
            <div className="flex justify-end mb-4">
                <div className="w-64">
                    <label htmlFor="currency-select" className="text-xs text-neutral-400 mb-1 block">
                        Display Currency
                    </label>
                    <Select
                        id="currency-select"
                        onChange={e => setSelectedCurrency(e.target.value)}
                        value={selectedCurrency}
                    >
                        {Object.values(currencies).map(currency => (
                            <option key={currency.code} value={currency.code}>
                                {currency.name} ({currency.symbol})
                            </option>
                        ))}
                    </Select>
                </div>
            </div>
            
            <div className={'text-gray-400 text-center'}>
                <Table>
                    <Header>
                        <HeaderItem>Name</HeaderItem>
                        <HeaderItem>Price</HeaderItem>
                        <HeaderItem>Description</HeaderItem>
                        <HeaderItem>Created At</HeaderItem>
                        <HeaderItem>Payment State</HeaderItem>
                        <HeaderItem>&nbsp;</HeaderItem>
                    </Header>
                    <Body>
                        {pagination.paginatedItems.map(order => {
                            const convertedPrice = convertCurrency(order.total);
                            
                            return (
                                <BodyItem
                                    item={order.name.split('-')[0]!.toString()}
                                    key={order.id || Math.random().toString(36)}
                                    to={`/billing/orders/${order.id}`}
                                >
                                    <td className={'px-6 py-4 text-white font-bold'}>
                                        {convertedPrice.formatted}/mo
                                        {selectedCurrency !== settings.currency.code && (
                                            <span className="block text-xs text-neutral-400 font-normal mt-1">
                                                ({settings.currency.symbol}{order.total.toFixed(2)} {settings.currency.code})
                                            </span>
                                        )}
                                    </td>
                                    <td className={'px-6 py-4'}>{order.description}</td>
                                    <td className={'px-6 py-4'}>
                                        {formatDistanceToNowStrict(order.created_at, { addSuffix: true })}
                                    </td>
                                    <td className={'px-6 py-4 text-left'}>
                                        <Pill size={'small'} type={type(order.status)}>
                                            {order.status}
                                        </Pill>
                                    </td>
                                    <td className={'pr-12 py-4 text-right'}>
                                        <Pill size={'small'} type={order.is_renewal ? 'info' : 'success'}>
                                            {order.is_renewal ? 'Upgrade' : 'New Server'}
                                        </Pill>
                                    </td>
                                </BodyItem>
                            );
                        })}
                    </Body>
                </Table>
                <PaginatedFooter pagination={pagination} />
            </div>
        </PageContentBlock>
    );
};
