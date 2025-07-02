<?php

namespace Everest\Http\Requests\Api\Client\Account;

use Everest\Http\Requests\Api\Client\ClientApiRequest;

class RegisterSecurityKeyRequest extends ClientApiRequest
{
    public function rules(): array
    {
        return [
            'name' => ['string', 'required'],
            'token_id' => ['required', 'string'],
            'registration' => ['required', 'array'],
            'registration.id' => ['required', 'string'],
            'registration.type' => ['required', 'in:public-key'],
            'registration.response.attestationObject' => ['required', 'string'],
            'registration.response.clientDataJSON' => ['required', 'string'],
        ];
    }
}
