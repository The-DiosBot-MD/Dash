<?php

namespace Everest\Services\Billing;

use Everest\Models\Egg;
use Stripe\StripeObject;
use Everest\Models\Server;
use Illuminate\Http\Request;
use Everest\Models\Allocation;
use Everest\Models\EggVariable;
use Everest\Models\Billing\Order;
use Everest\Models\Billing\Product;
use Everest\Exceptions\DisplayException;
use Everest\Services\Servers\ServerCreationService;
use Everest\Services\Servers\VariableValidatorService;
use Everest\Exceptions\Service\Deployment\NoViableAllocationException;

class CreateServerService
{
    /**
     * CreateServerService constructor.
     */
    public function __construct(
        private ServerCreationService $creation,
        private VariableValidatorService $variableValidator
    ) {
    }

    /**
     * Process the creation of a server.
     */
    public function process(Request $request, Product $product, StripeObject $metadata, Order $order): Server
    {
        $egg = Egg::findOrFail($product->category->egg_id);
        $allocation = $this->getAllocation($metadata->node_id);

        // Get all environment variables with their default values
        $environment = $this->getEnvironmentWithDefaults($egg->id);

        try {
            $server = $this->creation->handle([
                'node_id' => $metadata->node_id,
                'allocation_id' => $allocation,
                'egg_id' => $egg->id,
                'nest_id' => $product->category->nest_id,
                'name' => $request->user()->username . '\'s server',
                'owner_id' => $request->user()->id,
                'memory' => $product->memory_limit,
                'swap' => 0,
                'disk' => $product->disk_limit,
                'io' => 500,
                'cpu' => $product->cpu_limit,
                'startup' => $egg->startup,
                'environment' => $environment,
                'image' => current($egg->docker_images),
                'order_id' => $order->id,
                'days_until_renewal' => 30,
                'database_limit' => $product->database_limit,
                'backup_limit' => $product->backup_limit,
                'allocation_limit' => $product->allocation_limit,
                'subuser_limit' => 3,
                'skip_scripts' => false, // Ensure installation scripts run
            ]);
        } catch (DisplayException $ex) {
            throw new DisplayException('Unable to create server: ' . $ex->getMessage());
        }

        return $server;
    }

    /**
     * Get all environment variables with their default values for an egg.
     */
    private function getEnvironmentWithDefaults(int $eggId): array
    {
        $variables = [];
        $defaults = EggVariable::where('egg_id', $eggId)->get();

        foreach ($defaults as $variable) {
            $variables[$variable->env_variable] = $variable->default_value;
        }

        return $variables;
    }

    /**
     * Get the environment variables for the new server.
     */
    private function getServerEnvironment(string $data, int $id): array
    {
        $decoded = json_decode($data, true);

        $variables = [];
        $default = EggVariable::where('egg_id', $id)->get();

        foreach ($decoded as $variable) {
            $variables += [$variable['key'] => $variable['value']];
        }

        foreach ($default as $variable) {
            if (!array_key_exists($variable->env_variable, $variables)) {
                $variables += [$variable->env_variable => $variable->default_value];
            }
        }

        return $variables;
    }

    /**
     * Get a suitable allocation to deploy to.
     */
    private function getAllocation(int $id): int
    {
        $allocation = Allocation::where('node_id', $id)->where('server_id', null)->first();

        if (!$allocation) {
            throw new NoViableAllocationException('No allocations are available for deployment.');
        }

        return $allocation->id;
    }
}
