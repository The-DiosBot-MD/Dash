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

        // Create new categories and map old category UUIDs to new ones
        foreach ($import_data['categories'] as $category) {
            // Skip existing categories if ignore_duplicates is true
            $existing_category = Category::where('uuid', $category['uuid'])->first();
            
            if ($existing_category) {
                if ($ignore_duplicates) {
                    continue; // If duplicates are being ignored, skip this category
                } else {
                    // If not ignoring duplicates, map old UUID to new UUID (in case it's updated)
                    $old_data[$category['uuid']] = $existing_category->uuid;
                    continue;
                }
            } else {
                $new_uuid = Str::uuid()->toString();

                // Create the new category
                $new_category = Category::create([
                    'uuid' => $new_uuid, // Assign new UUID
                    'name' => $category['name'],
                    'icon' => $category['icon'] ?? null,
                    'description' => $category['description'],
                    'visible' => (bool) $category['visible'],
                    'egg_id' => (int) $category['egg_id'],
                    'nest_id' => (int) $category['nest_id'],
                ]);

                // Map the old category UUID to the new category UUID
                $old_data[$category['uuid']] = $new_category->uuid;
            }
        }

        // Create products and assign them to the correct new category
        foreach ($import_data['products'] as $product) {
            // Skip existing products if ignore_duplicates is true
            if (Product::where('uuid', $product['uuid'])->exists() && $ignore_duplicates) {
                continue;
            } else {
                $category_uuid = null;
                $new_uuid = Str::uuid()->toString();

                // Check if the product's category_uuid exists in the old_data mapping
                if (array_key_exists($product['category_uuid'], $old_data)) {
                    // Assign the new category UUID based on the old category UUID mapping
                    $category_uuid = $old_data[$product['category_uuid']];
                    echo "Mapped to new category UUID: $category_uuid\n"; // Debugging output for new category UUID
                } else {
                    $category_uuid = null;
                }

                // If no valid category_uuid was assigned, throw an error
                if (!$category_uuid) {
                    throw new Exception('Unable to assign product to category. Category UUID ' . $product['category_uuid'] . ' is invalid.');
                }

                // Create the product with the new category_uuid
                Product::create([
                    'uuid' => $new_uuid, // don't overlap UUIDs
                    'name' => $product['name'],
                    'icon' => $product['icon'] ?? null,
                    'price' => (float) $product['price'],
                    'description' => $product['description'],
                    'visible' => (bool) $product['visible'],
                    'cpu_limit' => (int) $product['cpu_limit'],
                    'memory_limit' => (int) $product['memory_limit'],
                    'disk_limit' => (int) $product['disk_limit'],
                    'backup_limit' => (int) $product['backup_limit'],
                    'database_limit' => (int) $product['database_limit'],
                    'allocation_limit' => (int) $product['allocation_limit'],
                    'category_uuid' => $category_uuid,
                    'stripe_id' => null, // deprecated
                ]);
            }
        }
    }
}
