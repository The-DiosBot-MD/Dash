import classNames from 'classnames';
import Spinner from '@elements/Spinner';
import { Button } from '@elements/button';
import { useStoreState } from '@/state/hooks';
import ContentBox from '@elements/ContentBox';
import { ReactElement, useEffect, useState } from 'react';
import PageContentBlock from '@elements/PageContentBlock';
import { getProducts, Product } from '@/api/billing/products';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import getCategories, { Category } from '@/api/billing/getCategories';
import {
    IconDefinition,
    faArchive,
    faDatabase,
    faEthernet,
    faExclamationTriangle,
    faHdd,
    faMemory,
    faMicrochip,
    faShoppingBag,
    faSync,
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Alert } from '@elements/alert';
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
    KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
};

interface LimitProps {
    icon: IconDefinition;
    limit: ReactElement;
}

const LimitBox = ({ icon, limit }: LimitProps) => (
    <div className={'text-gray-400 mt-1'}>
        <FontAwesomeIcon icon={icon} className={'w-4 h-4 mr-2'} />
        {limit}
    </div>
);

export default () => {
    const { addError } = useFlash();
    const [category, setCategory] = useState<number>();
    const [products, setProducts] = useState<Product[] | undefined>();
    const [categories, setCategories] = useState<Category[] | undefined>();
    const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
    const [isLoadingRates, setIsLoadingRates] = useState(true);
    const [selectedCurrency, setSelectedCurrency] = useState<string>(() => {
        // Try to load from localStorage or use browser's language to determine default currency
        const saved = localStorage.getItem('preferred_currency');
        if (saved && currencies[saved]) return saved;
        
        // Try to detect from browser language
        const browserLang = navigator.language || 'en-US';
        const langMap: {[key: string]: string} = {
            'en-US': 'USD',
            'en-GB': 'GBP',
            'en-CA': 'CAD',
            'en-AU': 'AUD',
            'de': 'EUR',
            'fr': 'EUR',
            'es': 'EUR',
            'it': 'EUR',
            'ja': 'JPY',
            'zh': 'CNY',
            'ru': 'RUB',
            'pt-BR': 'BRL',
            'ko': 'KRW',
            'hi': 'INR'
        };
        
        // Default to system currency if cannot detect
        return langMap[browserLang.split('-')[0]] || langMap[browserLang] || 'USD';
    });

    const settings = useStoreState(s => s.everest.data!.billing);
    const { colors } = useStoreState(state => state.theme.data!);
    
    // Function to convert currency
    const convertCurrency = (amount: number): { value: number; formatted: string } => {
        // If we're already in CAD, no conversion needed
        if (selectedCurrency === settings.currency.code) {
            return {
                value: amount,
                formatted: `${currencies[settings.currency.code]?.symbol || ''}${amount.toFixed(2)}`
            };
        }
        
        // Make sure we have rates for the selected currency
        if (!exchangeRates[selectedCurrency]) {
            console.warn(`No exchange rate found for ${selectedCurrency}, using CAD`);
            return {
                value: amount,
                formatted: `${currencies[settings.currency.code]?.symbol || ''}${amount.toFixed(2)}`
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
    
    // Fetch exchange rates from our backend API instead of directly from exchangerate.host
    const fetchExchangeRates = async () => {
        setIsLoadingRates(true);
        try {
            // Check if we have cached rates less than 1 hour old in localStorage
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
            
            // Always request rates based on CAD
            const response = await fetch(`/api/client/exchange-rates?base=CAD`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch exchange rates');
            }
            
            const data = await response.json();
            
            // Log the response data for debugging
            console.log("Exchange rates API response:", data);
            
            if (data && data.rates) {
                // Check if the rates look correct
                console.log(`Example conversions from API:
                    1 CAD = ${data.rates.EUR} EUR (should be ~0.64)
                    1 CAD = ${data.rates.USD} USD (should be ~0.74)
                `);
                
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
            
            // Try to use previously cached rates if available
            const cachedRates = localStorage.getItem('exchange_rates');
            if (cachedRates) {
                setExchangeRates(JSON.parse(cachedRates));
            } else {
                // Use fallback rates if nothing else is available - BASED ON CAD
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
                    KRW: 995.60,
                });
            }
        } finally {
            setIsLoadingRates(false);
        }
    };
    
    // Save currency preference
    useEffect(() => {
        localStorage.setItem('preferred_currency', selectedCurrency);
    }, [selectedCurrency]);

    useEffect(() => {
        (async function () {
            await getCategories().then(data => {
                setCategories(data);
                setCategory(Number(data[0]!.id));
            });
            // Fetch exchange rates
            await fetchExchangeRates();
        })();
    }, []);

    useEffect(() => {
        if (products || !category) return;

        getProducts(category).then(data => {
            setProducts(data);
        });
    }, [category]);
    
    // Force refresh exchange rates
    const refreshRates = () => {
        // Clear localStorage cache
        localStorage.removeItem('exchange_rates');
        localStorage.removeItem('exchange_rates_timestamp');
        
        // Set loading state
        setIsLoadingRates(true);
        
        // Make API request with refresh parameter
        fetch(`/api/client/exchange-rates?base=${settings.currency.code}&refresh=true`)
            .then(response => {
                if (!response.ok) throw new Error('Failed to refresh rates');
                return response.json();
            })
            .then(data => {
                if (data && data.rates) {
                    setExchangeRates(data.rates);
                    localStorage.setItem('exchange_rates', JSON.stringify(data.rates));
                    localStorage.setItem('exchange_rates_timestamp', Date.now().toString());
                }
            })
            .catch(error => {
                console.error('Error refreshing exchange rates:', error);
                addError('Failed to refresh currency rates.');
            })
            .finally(() => {
                setIsLoadingRates(false);
            });
    };

    if (!settings.keys.publishable) {
        return (
            <Alert type={'danger'}>
                Due to a configuration error, the store is currently unavailable. Please try again later, or refresh the
                page.
            </Alert>
        );
    }

    return (
        <PageContentBlock title={'Available Products'}>
            <div className={'text-3xl lg:text-5xl font-bold mt-8 mb-12'}>
                Order a Product
                <p className={'text-gray-400 font-normal text-sm mt-1'}>
                    Choose and configure any of the products below to your liking.
                </p>
            </div>
            
            {/* Currency selector */}
            <div className="flex justify-end mb-6">
                <div className="w-64 flex items-end">
                    <div className="flex-1">
                        <label htmlFor="currency-select" className="text-xs text-neutral-400 mb-1 block">
                            Display Currency
                        </label>
                        <Select
                            id="currency-select"
                            onChange={e => setSelectedCurrency(e.target.value)}
                            value={selectedCurrency}
                            disabled={isLoadingRates}
                        >
                            {Object.values(currencies).map(currency => (
                                <option key={currency.code} value={currency.code}>
                                    {currency.name} ({currency.symbol})
                                </option>
                            ))}
                        </Select>
                    </div>
                    <Button
                        size={Button.Sizes.Small}
                        className="ml-2 mb-1"
                        disabled={isLoadingRates}
                        onClick={refreshRates}
                    >
                        <FontAwesomeIcon icon={faSync} spin={isLoadingRates} />
                    </Button>
                </div>
            </div>
            
            <div className={'grid lg:grid-cols-4 gap-4 lg:gap-12'}>
                <div className={'border-r-4 border-gray-500'}>
                    <p className={'text-2xl text-gray-300 mb-8 mt-4 font-bold'}>Categories</p>
                    {(!categories || categories.length < 1) && (
                        <div className={'font-semibold my-4 text-gray-400'}>
                            <FontAwesomeIcon icon={faExclamationTriangle} className={'w-5 h-5 mr-2 text-yellow-400'} />
                            No categories found.
                        </div>
                    )}
                    {categories?.map(cat => (
                        <button
                            className={classNames(
                                'font-semibold my-4 w-full text-left hover:brightness-150 duration-300 cursor-pointer line-clamp-1',
                                Number(cat.id) === category && 'brightness-150',
                            )}
                            disabled={category === Number(cat.id)}
                            style={{ color: colors.primary }}
                            onClick={() => {
                                setCategory(Number(cat.id));
                                setProducts(undefined);
                            }}
                            key={cat.id}
                        >
                            {cat.icon && <img src={cat.icon} className={'w-7 h-7 inline-flex rounded-full mr-3'} />}
                            {cat.name}
                            <div className={'h-0.5 mt-4 bg-gray-600 mr-8 rounded-full'} />
                        </button>
                    ))}
                </div>
                <div className={'lg:col-span-3'}>
                    {!products ? (
                        <Spinner centered />
                    ) : (
                        <>
                            {products?.length < 1 && (
                                <div className={'font-semibold my-4 text-gray-400'}>
                                    <FontAwesomeIcon
                                        icon={faExclamationTriangle}
                                        className={'w-5 h-5 mr-2 text-yellow-400'}
                                    />
                                    No products could be found in this category.
                                </div>
                            )}
                            <div className={'grid grid-cols-1 xl:grid-cols-3 gap-4'}>
                                {products?.map(product => {
                                    const convertedPrice = convertCurrency(product.price);
                                    
                                    return (
                                        <ContentBox key={product.id}>
                                            <div className={'p-3 lg:p-6'}>
                                                <div className={'flex justify-center'}>
                                                    {product.icon ? (
                                                        <img src={product.icon} className={'w-16 h-16'} />
                                                    ) : (
                                                        <FontAwesomeIcon
                                                            icon={faShoppingBag}
                                                            className={'w-12 h-12 m-2'}
                                                            style={{ color: colors.primary }}
                                                        />
                                                    )}
                                                </div>
                                                <p className={'text-3xl font-bold text-center mt-3'}>{product.name}</p>
                                                <p className={'text-lg font-semibold text-center mt-1 mb-4 text-gray-400'}>
                                                    <span style={{ color: colors.primary }} className={'mr-1'}>
                                                        {convertedPrice.formatted}
                                                        &nbsp;
                                                        {selectedCurrency}
                                                    </span>
                                                    <span className={'text-base'}>/ monthly</span>
                                                    
                                                    {/* Show original price if different currency */}
                                                    {selectedCurrency !== settings.currency.code && (
                                                        <span className={'block text-xs text-neutral-400'}>
                                                            ({settings.currency.symbol}{product.price.toFixed(2)} {settings.currency.code})
                                                        </span>
                                                    )}
                                                </p>
                                                <div className={'grid justify-center items-center'}>
                                                    <LimitBox icon={faMicrochip} limit={<>{product.limits.cpu}% CPU</>} />
                                                    <LimitBox
                                                        icon={faMemory}
                                                        limit={<>{product.limits.memory / 1024} GiB of RAM</>}
                                                    />
                                                    <LimitBox
                                                        icon={faHdd}
                                                        limit={<>{product.limits.disk / 1024} GiB of Storage</>}
                                                    />
                                                    <div className={'border border-dashed border-gray-500 my-4'} />
                                                    {product.limits.backup ? (
                                                        <LimitBox
                                                            icon={faArchive}
                                                            limit={<>{product.limits.backup} backup slots</>}
                                                        />
                                                    ) : (
                                                        <></>
                                                    )}
                                                    {product.limits.database ? (
                                                        <LimitBox
                                                            icon={faDatabase}
                                                            limit={<>{product.limits.database} database slots</>}
                                                        />
                                                    ) : (
                                                        <></>
                                                    )}
                                                    <LimitBox
                                                        icon={faEthernet}
                                                        limit={
                                                            <>
                                                                {product.limits.allocation} network port
                                                                {product.limits.allocation > 1 && 's'}
                                                            </>
                                                        }
                                                    />
                                                </div>
                                                <div className={'text-center mt-6'}>
                                                    <Link to={`/billing/order/${product.id}`}>
                                                        <Button size={Button.Sizes.Large} className={'w-full'}>
                                                            Configure
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </ContentBox>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </PageContentBlock>
    );
};
