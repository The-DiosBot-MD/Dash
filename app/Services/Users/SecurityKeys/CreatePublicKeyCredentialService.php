<?php

namespace Everest\Services\Users\SecurityKeys;

use Everest\Models\User;
use Webauthn\PublicKeyCredentialCreationOptions;
use Everest\Repositories\SecurityKeys\WebauthnServerRepository;

class CreatePublicKeyCredentialService
{
    protected WebauthnServerRepository $webauthnServerRepository;

    public function __construct(WebauthnServerRepository $webauthnServerRepository)
    {
        $this->webauthnServerRepository = $webauthnServerRepository;
    }

    /**
     * @throws \Webauthn\Exception\InvalidDataException
     */
    public function handle(User $user): PublicKeyCredentialCreationOptions
    {
        return $this->webauthnServerRepository->getPublicKeyCredentialCreationOptions($user);
    }
}