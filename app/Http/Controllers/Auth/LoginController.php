<?php

namespace Everest\Http\Controllers\Auth;

use Everest\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Everest\Facades\Activity;
use Illuminate\Http\Response;
use Everest\Models\SecurityKey;
use Illuminate\Http\JsonResponse;
use Illuminate\Contracts\View\View;
use Everest\Exceptions\DisplayException;
use Everest\Services\Users\UserCreationService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Everest\Contracts\Repository\SettingsRepositoryInterface;
use Everest\Repositories\SecurityKeys\WebauthnServerRepository;

class LoginController extends AbstractLoginController
{
    private const METHOD_TOTP = 'totp';
    private const METHOD_WEBAUTHN = 'webauthn';

    /**
     * LoginController constructor.
     */
    public function __construct(
        private UserCreationService $creationService,
        private SettingsRepositoryInterface $settings,
        protected WebauthnServerRepository $webauthnServerRepository
    ) {
        parent::__construct();
    }

    /**
     * Handle all incoming requests for the authentication routes and render the
     * base authentication view component. React will take over at this point and
     * turn the login area into an SPA.
     */
    public function index(): View
    {
        return view('templates/auth.core');
    }

    /**
     * Handle a login request to the application.
     *
     * @throws \Everest\Exceptions\DisplayException
     * @throws \Webauthn\Exception\InvalidDataException
     * @throws \Illuminate\Validation\ValidationException
     */
    public function login(Request $request): JsonResponse
    {
        if ($this->hasTooManyLoginAttempts($request)) {
            $this->fireLockoutEvent($request);
            $this->sendLockoutResponse($request);
        }

        try {
            $username = $request->input('user');

            /** @var \Everest\Models\User $user */
            $user = User::query()->where($this->getField($username), $username)->firstOrFail();
        } catch (ModelNotFoundException) {
            $this->sendFailedLoginResponse($request);
        }

        // Ensure that the account is using a valid username and password before trying to
        // continue. Previously this was handled in the 2FA checkpoint, however that has
        // a flaw in which you can discover if an account exists simply by seeing if you
        // can proceed to the next step in the login process.
        if (!password_verify($request->input('password'), $user->password)) {
            $this->sendFailedLoginResponse($request, $user);
        }

        // Return early if the user does not have 2FA enabled, otherwise we will require them
        // to complete a secondary challenge before they can log in.
        if (!$user->has2FAEnabled()) {
            return $this->sendLoginResponse($user, $request);
        }

        Activity::event('auth:checkpoint')->withRequestMetadata()->subject($user)->log();

        $request->session()->put('auth_confirmation_token', [
            'user_id' => $user->id,
            'token_value' => $token = Str::random(64),
            'expires_at' => CarbonImmutable::now()->addMinutes(5),
        ]);

        $response = [
            'complete' => false,
            'methods' => array_values(array_filter([
                $user->use_totp ? self::METHOD_TOTP : null,
                $user->securityKeys->isNotEmpty() ? self::METHOD_WEBAUTHN : null,
            ])),
            'confirm_token' => $token,
        ];

        if ($user->securityKeys->isNotEmpty()) {
            $key = $this->webauthnServerRepository->generatePublicKeyCredentialRequestOptions($user);

            $request->session()->put(SecurityKey::PK_SESSION_NAME, $key);

            $request['webauthn'] = ['public_key' => $key];
        }

        return new JsonResponse($response);
    }

    /**
     * Handle a user registration request.
     */
    public function register(Request $request): JsonResponse
    {
        if ($this->hasTooManyLoginAttempts($request)) {
            $this->fireLockoutEvent($request);
            $this->sendLockoutResponse($request);
        }

        $email = $request->input('email');
        $username = $request->input('username');
        $password = $request->input('password');
        $passwordConfirm = $request->input('confirm_password');

        if (User::where('email', $email)->exists()) {
            throw new DisplayException('This email is already in use.');
        }

        if ($password !== $passwordConfirm) {
            throw new DisplayException('The passwords entered do not match.');
        }

        $this->createAccount($this->settings, ['email' => $email, 'username' => $username, 'password' => $password]);

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }
}
