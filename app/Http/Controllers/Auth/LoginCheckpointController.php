<?php

namespace Everest\Http\Controllers\Auth;

use Everest\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Everest\Models\SecurityKey;
use Illuminate\Http\JsonResponse;
use PragmaRX\Google2FA\Google2FA;
use Illuminate\Contracts\Encryption\Encrypter;
use Webauthn\PublicKeyCredentialRequestOptions;
use Everest\Http\Requests\Auth\LoginCheckpointRequest;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Everest\Repositories\SecurityKeys\WebauthnServerRepository;
use Illuminate\Contracts\Validation\Factory as ValidationFactory;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class LoginCheckpointController extends AbstractLoginController
{
    private const TOKEN_EXPIRED_MESSAGE = 'The authentication token provided has expired, please refresh the page and try again.';

    /**
     * LoginCheckpointController constructor.
     */
    public function __construct(
        private Encrypter $encrypter,
        private Google2FA $google2FA,
        private WebauthnServerRepository $webauthnServerRepository,
        private ValidationFactory $validation
    ) {
        parent::__construct();
    }

    /**
     * Handle a login where the user is required to provide a TOTP authentication
     * token. Once a user has reached this stage it is assumed that they have already
     * provided a valid username and password.
     *
     * @return \Illuminate\Http\JsonResponse|void
     *
     * @throws \PragmaRX\Google2FA\Exceptions\IncompatibleWithGoogleAuthenticatorException
     * @throws \PragmaRX\Google2FA\Exceptions\InvalidCharactersException
     * @throws \PragmaRX\Google2FA\Exceptions\SecretKeyTooShortException
     * @throws \Illuminate\Validation\ValidationException
     * @throws \Everest\Exceptions\DisplayException
     * @throws \Exception
     */
    public function token(LoginCheckpointRequest $request)
    {
        $user = $this->extractUserFromRequest($request);

        // Recovery tokens go through a slightly different pathway for usage.
        if (!is_null($recoveryToken = $request->input('recovery_token'))) {
            if ($this->isValidRecoveryToken($user, $recoveryToken)) {
                return $this->sendLoginResponse($user, $request);
            }
        } else {
            if (!$user->use_totp) {
                $this->sendFailedLoginResponse($request, $user);
            }

            $decrypted = $this->encrypter->decrypt($user->totp_secret);

            if ($this->google2FA->verifyKey($decrypted, $request->input('authentication_code') ?? '', config('Everest.auth.2fa.window'))) {
                return $this->sendLoginResponse($user, $request);
            }
        }

        $this->sendFailedLoginResponse($request, $user, !empty($recoveryToken) ? 'The recovery token provided is not valid.' : null);
    }

    /**
     * Authenticates a login request using a security key for a user.
     *
     * @throws \Illuminate\Validation\ValidationException
     * @throws \Everest\Exceptions\DisplayException
     */
    public function key(Request $request): JsonResponse
    {
        $options = $request->session()->get(SecurityKey::PK_SESSION_NAME);
        if (!$options instanceof PublicKeyCredentialRequestOptions) {
            throw new BadRequestHttpException('No security keys configured in session.');
        }

        $user = $this->extractUserFromRequest($request);

        try {
            $source = $this->webauthnServerRepository->loadAndCheckAssertionResponse(
                $user,
                // TODO: we may have to `json_encode` this so it will be decoded properly.
                $request->input('data'),
                $options,
                SecurityKey::getPsrRequestFactory($request)
            );
        } catch (\Exception|\Throwable $e) {
            throw $e;
        }

        if (hash_equals($user->uuid, $source->getUserHandle())) {
            return $this->sendLoginResponse($user, $request);
        }

        throw new BadRequestHttpException('An unexpected error was encountered while validating that security key.');
    }

    /**
     * Extracts the user from the session data using the provided confirmation token.
     *
     * @throws \Illuminate\Validation\ValidationException
     * @throws \Everest\Exceptions\DisplayException
     */
    protected function extractUserFromRequest(Request $request): User
    {
        if ($this->hasTooManyLoginAttempts($request)) {
            $this->sendLockoutResponse($request);
        }

        $details = $request->session()->get('auth_confirmation_token');
        if (!$this->hasValidSessionData($details)) {
            $this->sendFailedLoginResponse($request, null, self::TOKEN_EXPIRED_MESSAGE);
        }

        if (!hash_equals($request->input('confirmation_token') ?? '', $details['token_value'])) {
            $this->sendFailedLoginResponse($request);
        }

        try {
            /** @var \Everest\Models\User $user */
            $user = User::query()->findOrFail($details['user_id']);
        } catch (ModelNotFoundException) {
            $this->sendFailedLoginResponse($request, null, self::TOKEN_EXPIRED_MESSAGE);
        }

        return $user;
    }

    /**
     * Determines if a given recovery token is valid for the user account. If we find a matching token
     * it will be deleted from the database.
     *
     * @throws \Exception
     */
    protected function isValidRecoveryToken(User $user, string $value): bool
    {
        foreach ($user->recoveryTokens as $token) {
            if (password_verify($value, $token->token)) {
                $token->delete();

                return true;
            }
        }

        return false;
    }

    protected function hasValidSessionData(array $data): bool
    {
        return static::isValidSessionData($this->validation, $data);
    }

    /**
     * Determines if the data provided from the session is valid or not. This
     * will return false if the data is invalid, or if more time has passed than
     * was configured when the session was written.
     */
    protected static function isValidSessionData(ValidationFactory $validation, array $data): bool
    {
        $validator = $validation->make($data, [
            'user_id' => 'required|integer|min:1',
            'token_value' => 'required|string',
            'expires_at' => 'required',
        ]);

        if ($validator->fails()) {
            return false;
        }

        if (!$data['expires_at'] instanceof CarbonInterface) {
            return false;
        }

        if ($data['expires_at']->isBefore(CarbonImmutable::now())) {
            return false;
        }

        return true;
    }
}
