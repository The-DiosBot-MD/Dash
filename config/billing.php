<?php

return [
    'currency' => [
        'code' => env('BILLING_CURRENCY', 'USD'),
        'symbol' => env('BILLING_CURRENCY_SYMBOL', '$'),
    ],

    'exchange_rates' => [
        /*
        |--------------------------------------------------------------------------
        | Exchange Rate API Provider
        |--------------------------------------------------------------------------
        |
        | Supported providers:
        | - exchangerate (requires API key)
        | - exchangeratesapi (requires API key)
        | - openexchangerates (requires API key)
        | - apilayer (requires API key)
        | - currencyapi (requires API key)
        | - fixer (requires API key)
        */
        'provider' => env('EXCHANGE_RATE_PROVIDER', 'exchangerate'),

        /*
        |--------------------------------------------------------------------------
        | Exchange Rate API Key
        |--------------------------------------------------------------------------
        |
        | API key for the selected exchange rate provider.
        | Required for all providers.
        */
        'api_key' => env('EXCHANGE_RATE_API_KEY', 'api_key_here'),

        /*
        |--------------------------------------------------------------------------
        | Cache Duration
        |--------------------------------------------------------------------------
        |
        | How long to cache exchange rates in hours.
        */
        'cache_duration' => env('EXCHANGE_RATE_CACHE_DURATION', 12),
    ],

    // Add other billing settings here
];
