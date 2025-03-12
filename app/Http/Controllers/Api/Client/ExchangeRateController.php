<?php

namespace Everest\Http\Controllers\Api\Client;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Everest\Services\ExchangeRateService;

class ExchangeRateController extends ClientApiController
{
    protected ExchangeRateService $exchangeRateService;

    public function __construct(ExchangeRateService $exchangeRateService)
    {
        parent::__construct();
        $this->exchangeRateService = $exchangeRateService;
    }

    /**
     * Get exchange rates for a base currency.
     */
    public function index(Request $request): JsonResponse
    {
        $baseCurrency = $request->query('base', 'CAD');
        $forceRefresh = $request->query('refresh', false);

        if ($forceRefresh) {
            $data = $this->exchangeRateService->refreshExchangeRates($baseCurrency);
        } else {
            $data = $this->exchangeRateService->getExchangeRates($baseCurrency);
        }

        return response()->json($data);
    }
}
