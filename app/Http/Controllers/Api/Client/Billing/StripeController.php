<?php

namespace Everest\Http\Controllers\Api\Client\Billing;

use Stripe\StripeClient;
use Everest\Models\Server;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Everest\Models\Billing\Order;
use Illuminate\Http\JsonResponse;
use Everest\Models\Billing\Product;
use Everest\Exceptions\DisplayException;
use Everest\Services\Billing\CreateOrderService;
use Everest\Services\Billing\CreateServerService;
use Everest\Http\Controllers\Api\Client\ClientApiController;
use Everest\Contracts\Repository\SettingsRepositoryInterface;
use Everest\Repositories\Wings\DaemonConfigurationRepository;

class StripeController extends ClientApiController
{
    public function __construct(
        private CreateOrderService $orderService,
        private CreateServerService $serverCreation,
        private SettingsRepositoryInterface $settings,
        private DaemonConfigurationRepository $repository,
    ) {
        parent::__construct();

        $this->stripe = new StripeClient(
            $this->settings->get('settings::modules:billing:keys:secret')
        );
    }

    /**
     * Send the Stripe public key to the frontend.
     */
    public function publicKey(Request $request, int $id): JsonResponse
    {
        return response()->json([
            'key' => $this->settings->get('settings::modules:billing:keys:publishable'),
        ]);
    }

    /**
     * Create a Stripe payment intent.
     */
    public function intent(Request $request, int $id): JsonResponse
    {
        $paymentMethodTypes = ['card'];
        $product = Product::findOrFail($id);

        if ($this->settings->get('settings::modules:billing:paypal')) {
            $paymentMethodTypes[] = 'paypal';
        }

        if ($this->settings->get('settings::modules:billing:link')) {
            $paymentMethodTypes[] = 'link';
        }

        // Create payment intent with manual capture
        $paymentIntent = $this->stripe->paymentIntents->create([
            'amount' => $product->price * 100,
            'currency' => strtolower(config('modules.billing.currency.code')),
            'payment_method_types' => array_values($paymentMethodTypes),
            'capture_method' => 'manual', // Prevent immediate capture
        ]);

        // Create the order
        $this->orderService->create(
            $paymentIntent->id,
            $request->user(),
            $product,
            Order::STATUS_PENDING,
            boolval($request->input('renewal') ?? false),
        );

        return response()->json([
            'id' => $paymentIntent->id,
            'secret' => $paymentIntent->client_secret,
        ]);
    }

    /**
     * Update a Payment Intent with new data from the UI.
     */
    public function updateIntent(Request $request, ?int $id = null): Response
    {
        $intent = $this->stripe->paymentIntents->retrieve($request->input('intent'));

        $metadata = [
            'customer_email' => $request->user()->email,
            'customer_name' => $request->user()->username,
            'product_id' => (string) $id,
            'node_id' => (string) ($request->input('node_id') ?? ''),
            'server_id' => (string) ($request->input('server_id') ?? 0),
        ];

        $variables = $request->input('variables') ?? [];
        $metadata['variables'] = !empty($variables) ? json_encode($variables) : '';

        $intent->metadata = $metadata;
        $intent->save();

        return $this->returnNoContent();
    }

    /**
     * Process a successful subscription purchase.
     */
    public function process(Request $request): Response
    {
        // Hate doing this, but gives Stripe's API time to catch up
        // and process the payment.
        sleep(2);

        $order = Order::where('user_id', $request->user()->id)->latest()->first();
        $intent = $this->stripe->paymentIntents->retrieve($request->input('intent'));

        if (!$intent) {
            throw new DisplayException('Unable to fetch payment intent from Stripe.');
        }

        // Check if order has already been processed
        if (
            $order->status === Order::STATUS_PROCESSED
            && $intent->id === $order->payment_intent_id
        ) {
            throw new DisplayException('This order has already been processed.');
        }

        // If the payment wasn't successful, mark the order as failed
        if ($intent->status !== 'requires_capture') {
            $order->update(['status' => Order::STATUS_FAILED]);
            throw new DisplayException('The order has been canceled.');
        }

        // Process the renewal or product purchase
        if ($order->is_renewal && ((int) $intent->metadata->server_id != 0)) {
            $server = Server::findOrFail((int) $intent->metadata->server_id);

            $server->update([
                'days_until_renewal' => $server->days_until_renewal + 30,
                'status' => $server->isSuspended() ? null : $server->status,
            ]);
        } else {
            $product = Product::findOrFail($intent->metadata->product_id);

            $metadata = $intent->metadata;
            if (!empty($metadata->variables)) {
                $metadata->variables = json_decode($metadata->variables, true) ?? [];
            }

            $this->serverCreation->process($request, $product, $metadata, $order);
        }

        // Capture the payment after processing the order
        if ($intent->status === 'requires_capture') {
            $intent->capture(); // Capture the payment now that the order is processed
        }

        // Mark the order as processed
        $order->update([
            'status' => Order::STATUS_PROCESSED,
        ]);

        return $this->returnNoContent();
    }
}
