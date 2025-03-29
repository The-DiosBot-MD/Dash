<?php

namespace Everest\Http\Controllers\Api\Client\Billing;

use Everest\Models\Node;
use Everest\Models\Billing\BillingException;
use Everest\Transformers\Api\Client\NodeTransformer;
use Everest\Http\Controllers\Api\Client\ClientApiController;

class BillingController extends ClientApiController
{
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Returns all the nodes that the server can be deployed to.
     */
    public function nodes(): array
    {
        $nodes = Node::where('deployable', true)->get();

        if ($nodes->count() == 0) {
            BillingException::create([
                'title' => 'No nodes are available for deployment',
                'exception_type' => BillingException::TYPE_DEPLOYMENT,
                'description' => 'Set the \'deployable\' variable on any node to true',
            ]);
        }

        return $this->fractal->collection($nodes)
            ->transformWith(NodeTransformer::class)
            ->toArray();
    }
}
