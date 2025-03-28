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
use Everest\Models\Billing\BillingException;
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
        $publicKey = $this->settings->get('settings::modules:billing:keys:publishable') ?? null;

        if (!$publicKey) {
            BillingException::create([
                'exception_type' => BillingException::TYPE_STOREFRONT,
                'title' => 'The Stripe Public API key is missing',
                'description' => 'Add the Stripe \'publishable\' key to your billing panel',
            ]);
        }

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

        if (!$paymentIntent->client_secret) {
            BillingException::create([
                'exception_type' => BillingException::TYPE_STOREFRONT,
                'title' => 'The PaymentIntent client secret was not generated',
                'description' => 'Double check your billing API keys and Stripe Dashboard',
            ]);
        }

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
        
        if (!$intent) {
            BillingException::create([
                'exception_type' => BillingException::TYPE_STOREFRONT,
                'title' => 'The PaymentIntent requested does not exist',
                'description' => 'Check Stripe Dashboard and ask in the Jexactyl Discord for support',
            ]);
        }

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

            BillingException::create([
                'order_id' => $order->id,
                'exception_type' => BillingException::TYPE_DEPLOYMENT,
                'title' => 'Unable to fetch PaymentIntent while processing order',
                'description' => 'Check Stripe Dashboard and ask in the Jexactyl Discord for support',
            ]);
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

            $server = $this->serverCreation->process($request, $product, $metadata, $order);
        }

        // Capture the payment after processing the order
        if ($intent->status === 'requires_capture') {
            try {
                $intent->capture(); // Capture the payment now that the order is processed
            } catch (DisplayException $ex) {
                $server->delete();

                BillingException::create([
                    'order_id' => $order->id,
                    'exception_type' => BillingException::TYPE_PAYMENT,
                    'title' => 'Failed to capture payment via Stripe',
                    'description' => 'Check Stripe Dashboard and ask in the Jexactyl Discord for support',
                ]);

                throw new DisplayException('Unable to capture payment for this order.');
            }
        }

        // Mark the order as processed
        $order->update([
            'status' => Order::STATUS_PROCESSED,
        ]);

        return $this->returnNoContent();
    }
}
