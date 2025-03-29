<?php

namespace Everest\Services\Billing;

use Exception;
use Illuminate\Support\Str;
use Everest\Models\Billing\Category;
use Everest\Models\Billing\Product;

class BillingConfigImportService
{
    /**
     * Process a formatted JSON configuration file.
     */
    public function handle(array $import_data, bool $ignore_duplicates): void
    {
        $old_data = [];

        foreach ($import_data['categories'] as $category) {
            if (Category::where('name', $category['name'])->exists() && $ignore_duplicates) {
                continue;
            } else {
                $new_uuid = Str::uuid()->toString();

                $new_category = Category::create([
                    'uuid' => $new_uuid, // don't overlap UUIDs
                    'name' => $category['name'],
                    'icon' => $category['icon'] ?? null,
                    'description' => $category['description'],
                    'visible' => (bool) $category['visible'],
                    'egg_id' => (int) $category['egg_id'],
                    'nest_id' => (int) $category['nest_id'],
                ]);

                $old_data[$category['id']] = $new_category->id;

            };
        };

        foreach ($import_data['products'] as $product) {
            if (Product::where('name', $product['name'])->exists() && $ignore_duplicates) {
                continue;
            } else {
                $category_id = null;
                $new_uuid = Str::uuid()->toString();

                if (Category::where('id', $product['category_id'])->exists()) {
                    $category_id = Category::where('id', $product['category_id'])->first()->id;
                } else {
                    if (array_key_exists($product['category_id'], $old_data)) {
                        $category_id = $old_data[$product['category_id']];
                    }
                }

                if (!$category_id) {
                    throw new Exception('Unable to assign product to category.');
                };

                Product::create([
                    'uuid' => $new_uuid, // don't overlap UUIDs
                    'name' => $product['name'],
                    'icon' => $product['icon'] ?? null,
                    'price' => (int) $product['price'],
                    'description' => $product['description'],
                    'visible' => (bool) $product['visible'],
                    'cpu_limit' => (int) $product['cpu_limit'],
                    'memory_limit' => (int) $product['memory_limit'],
                    'disk_limit' => (int) $product['disk_limit'],
                    'backup_limit' => (int) $product['backup_limit'],
                    'database_limit' => (int) $product['database_limit'],
                    'allocation_limit' => (int) $product['allocation_limit'],
                    'category_id' => $category_id,
                    'stripe_id' => null, // deprecated
                ]);
            };
        };
    }
}
