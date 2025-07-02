<?php

namespace Everest\Transformers\Api\Client;

use Everest\Models\SecurityKey;
use Everest\Transformers\Api\Transformer;

class SecurityKeyTransformer extends Transformer
{
    public function getResourceName(): string
    {
        return SecurityKey::RESOURCE_NAME;
    }

    public function transform(SecurityKey $model): array
    {
        return [
            'uuid' => $model->uuid,
            'name' => $model->name,
            'type' => $model->type,
            'public_key_id' => base64_encode($model->public_key_id),
            'created_at' => self::formatTimestamp($model->created_at),
            'updated_at' => self::formatTimestamp($model->updated_at),
        ];
    }
}