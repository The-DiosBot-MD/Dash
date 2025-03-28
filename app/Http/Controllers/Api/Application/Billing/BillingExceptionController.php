<?php

namespace Everest\Http\Controllers\Api\Application\Billing;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Everest\Models\Billing\BillingException;
use Everest\Transformers\Api\Application\BillingExceptionTransformer;
use Everest\Http\Controllers\Api\Application\ApplicationApiController;

class BillingExceptionController extends ApplicationApiController
{
    /**
     * BillingExceptionController constructor.
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Get all billing exceptions.
     */
    public function index(Request $request): array
    {
        return $this->fractal->collection(BillingException::orderBy('created_at', 'desc')->get())
            ->transformWith(BillingExceptionTransformer::class)
            ->toArray();
    }

    /**
     * Resolve a billing exception.
     */
    public function resolve(BillingException $exception): Response
    {
        $exception->delete();

        return $this->returnNoContent();
    }

    /**
     * Resolve all billing exceptions.
     */
    public function resolveAll(): Response
    {
        $exceptions = BillingException::all();

        foreach ($exceptions as $exception) {
            $exception->delete();
        };

        return $this->returnNoContent();
    }
}
