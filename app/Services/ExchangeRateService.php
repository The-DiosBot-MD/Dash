<?php

namespace Everest\Services;

use Carbon\Carbon;
use Everest\Models\ExchangeRate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Config;

class ExchangeRateService
{
    /**
     * The cache duration in hours.
     */
    protected int $cacheDuration = 12;

    /**
     * API key for exchange rate service.
     */
    protected ?string $apiKey;

    /**
     * API provider to use.
     */
    protected string $provider;

    /**
     * Our system base currency - always use CAD as the reference.
     */
    protected string $systemBaseCurrency = 'CAD';

    /**
     * Initialize the service with config values.
     */
    public function __construct()
    {
        $this->apiKey = Config::get('billing.exchange_rates.api_key');
        $this->provider = Config::get('billing.exchange_rates.provider', 'exchangerate');
    }

    /**
     * Fetch exchange rates from API or database cache.
     */
    public function getExchangeRates(string $baseCurrency): array
    {
        // Always use CAD as our reference base currency for consistency
        $fetchCurrency = $this->systemBaseCurrency;

        // Check if we have cached rates that are still valid
        $cached = ExchangeRate::where('base_currency', $fetchCurrency)
                             ->where('last_updated_at', '>', Carbon::now()->subHours($this->cacheDuration))
                             ->first();

        if ($cached) {
            $rates = $cached->rates;

            // If requested base currency is different from CAD, we'll convert the rates later
            return [
                'base' => $baseCurrency,
                'reference_currency' => $fetchCurrency,
                'rates' => $this->convertRatesForBaseCurrency($rates, $fetchCurrency, $baseCurrency),
                'last_updated_at' => $cached->last_updated_at->toIso8601String(),
                'source' => 'database',
            ];
        }

        // Otherwise fetch from API
        $result = $this->fetchExchangeRates($fetchCurrency);

        // Convert rates if necessary
        if ($baseCurrency !== $fetchCurrency) {
            $result['base'] = $baseCurrency;
            $result['reference_currency'] = $fetchCurrency;
            $result['rates'] = $this->convertRatesForBaseCurrency($result['rates'], $fetchCurrency, $baseCurrency);
        }

        return $result;
    }

    /**
     * Fetch exchange rates from the API.
     */
    protected function fetchExchangeRates(string $baseCurrency): array
    {
        try {
            $response = $this->makeApiRequest($baseCurrency);

            if ($response->successful()) {
                $data = $response->json();
                $rates = $this->extractRatesFromResponse($data);

                if ($rates) {
                    // Make sure our base currency has a rate of 1.0
                    $rates[$baseCurrency] = 1.0;

                    // Update or create cache entry
                    ExchangeRate::updateOrCreate(
                        ['base_currency' => $baseCurrency],
                        [
                            'rates' => $rates,
                            'last_updated_at' => Carbon::now(),
                        ]
                    );

                    return [
                        'base' => $baseCurrency,
                        'rates' => $rates,
                        'last_updated_at' => Carbon::now()->toIso8601String(),
                        'source' => 'api',
                        'provider' => $this->provider,
                    ];
                }
            }

            throw new \Exception('Invalid API response: ' . $response->body());
        } catch (\Exception $e) {
            Log::error('Exchange rate API error: ' . $e->getMessage());

            // Try to get the most recent data from database even if it's expired
            $latestRates = ExchangeRate::where('base_currency', $baseCurrency)
                                     ->latest('last_updated_at')
                                     ->first();

            if ($latestRates) {
                return [
                    'base' => $baseCurrency,
                    'rates' => $latestRates->rates,
                    'last_updated_at' => $latestRates->last_updated_at->toIso8601String(),
                    'source' => 'outdated_cache',
                ];
            }

            // Return fallback rates if nothing else works
            return $this->getFallbackRates($baseCurrency);
        }
    }

    /**
     * Make API request to the configured provider.
     */
    protected function makeApiRequest(string $baseCurrency)
    {
        switch ($this->provider) {
            case 'exchangeratesapi':
                // ExchangeRatesAPI.io (requires API key)
                return Http::get('https://api.exchangeratesapi.io/v1/latest', [
                    'base' => $baseCurrency,
                    'access_key' => $this->apiKey,
                ]);

            case 'openexchangerates':
                // Open Exchange Rates (requires API key)
                return Http::get('https://openexchangerates.org/api/latest.json', [
                    'base' => $baseCurrency,
                    'app_id' => $this->apiKey,
                ]);

            case 'apilayer':
                // API Layer/Currency Data (requires API key)
                return Http::withHeaders([
                    'apikey' => $this->apiKey,
                ])->get('https://api.apilayer.com/currency_data/live', [
                    'source' => $baseCurrency,
                ]);

            case 'currencyapi':
                // Currency API (requires API key)
                return Http::withHeaders([
                    'apikey' => $this->apiKey,
                ])->get('https://api.currencyapi.com/v3/latest', [
                    'base_currency' => $baseCurrency,
                ]);

            case 'fixer':
                // Fixer.io
                return Http::get('http://data.fixer.io/api/latest', [
                    'base' => $baseCurrency,
                    'access_key' => $this->apiKey,
                ]);

            case 'exchangerate':
            default:
                // ExchangeRate.host
                return Http::withHeaders([
                    'access_key' => $this->apiKey,
                ])->get('https://api.exchangerate.host/latest', [
                    'base' => $baseCurrency,
                ]);
        }
    }

    /**
     * Extract rates from API response based on provider format.
     */
    protected function extractRatesFromResponse(array $data): ?array
    {
        switch ($this->provider) {
            case 'exchangeratesapi':
            case 'fixer':
                return $data['rates'] ?? null;

            case 'openexchangerates':
                return $data['rates'] ?? null;

            case 'apilayer':
                if (isset($data['quotes'])) {
                    $baseCurrency = $data['source'] ?? 'USD';
                    $rates = [];

                    // Convert from format USD+TARGET to just TARGET
                    foreach ($data['quotes'] as $pair => $rate) {
                        $targetCurrency = substr($pair, 3);  // Remove first 3 chars (e.g., "USDJPY" -> "JPY")
                        $rates[$targetCurrency] = $rate;
                    }

                    return $rates;
                }

                return null;

            case 'currencyapi':
                if (isset($data['data'])) {
                    $rates = [];
                    foreach ($data['data'] as $currency => $info) {
                        $rates[$currency] = $info['value'] ?? null;
                    }

                    return $rates;
                }

                return null;

            case 'exchangerate':
            default:
                return $data['rates'] ?? null;
        }
    }

    /**
     * Convert rates from one base currency to another.
     * This ensures we can always use CAD as our reference currency
     * but serve rates based on any requested currency.
     */
    protected function convertRatesForBaseCurrency(array $rates, string $fromBase, string $toBase): array
    {
        // If the requested base is the same as the reference base, return as is
        if ($fromBase === $toBase) {
            return $rates;
        }

        // If we don't have a rate for the requested base, use fallback rates
        if (!isset($rates[$toBase])) {
            return $this->getFallbackRates($toBase)['rates'];
        }

        // Get the rate for the requested base (e.g., rate of USD in terms of CAD)
        $baseRate = $rates[$toBase];
        $newRates = [];

        // Convert all rates to be relative to the new base
        foreach ($rates as $currency => $rate) {
            $newRates[$currency] = $rate / $baseRate;
        }

        // Ensure the new base currency has a rate of 1.0
        $newRates[$toBase] = 1.0;

        return $newRates;
    }

    /**
     * Get fallback exchange rates when API and cache fail.
     * Always use CAD-based rates as our canonical reference.
     */
    protected function getFallbackRates(string $baseCurrency): array
    {
        // CAD-specific rates (as of March 2025)
        $cadRates = [
            'USD' => 0.74,
            'EUR' => 0.64,
            'GBP' => 0.58,
            'CAD' => 1.00,
            'AUD' => 1.11,
            'JPY' => 111.50,
            'INR' => 61.60,
            'CNY' => 5.33,
            'BRL' => 3.72,
            'RUB' => 67.24,
            'KRW' => 995.60,
        ];

        // If base currency is CAD, just return the CAD rates
        if ($baseCurrency === 'CAD') {
            return [
                'base' => 'CAD',
                'rates' => $cadRates,
                'last_updated_at' => Carbon::now()->toIso8601String(),
                'source' => 'fallback',
            ];
        }

        // Otherwise convert from CAD to the requested base currency
        if (isset($cadRates[$baseCurrency]) && $cadRates[$baseCurrency] > 0) {
            $baseRate = $cadRates[$baseCurrency];
            $convertedRates = [];

            foreach ($cadRates as $currency => $rate) {
                $convertedRates[$currency] = $rate / $baseRate;
            }

            return [
                'base' => $baseCurrency,
                'rates' => $convertedRates,
                'last_updated_at' => Carbon::now()->toIso8601String(),
                'source' => 'fallback',
            ];
        }

        // In case we don't have a rate for the requested currency, return CAD rates
        return [
            'base' => 'CAD',
            'rates' => $cadRates,
            'last_updated_at' => Carbon::now()->toIso8601String(),
            'source' => 'fallback',
            'error' => 'Requested base currency not available, using CAD as fallback',
        ];
    }

    /**
     * Force refresh exchange rates from API.
     */
    public function refreshExchangeRates(string $baseCurrency): array
    {
        // Always fetch with CAD as the base currency
        $fetchCurrency = $this->systemBaseCurrency;

        // Clear any existing cache for the base currency
        ExchangeRate::where('base_currency', $fetchCurrency)->delete();

        // Fetch fresh rates
        $result = $this->fetchExchangeRates($fetchCurrency);

        // Convert rates if necessary
        if ($baseCurrency !== $fetchCurrency) {
            $result['base'] = $baseCurrency;
            $result['reference_currency'] = $fetchCurrency;
            $result['rates'] = $this->convertRatesForBaseCurrency($result['rates'], $fetchCurrency, $baseCurrency);
        }

        return $result;
    }
}
