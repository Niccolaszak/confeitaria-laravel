<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExerciseListTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_route_returns_successful_response(): void
    {
        $this->get('/')->assertStatus(200);
    }

    public function test_module_index_routes_return_successful_responses(): void
    {
        foreach (['/produtos', '/clientes', '/pedidos', '/entregas'] as $path) {
            $this->get($path)->assertStatus(200);
        }
    }

    public function test_product_listing_displays_its_heading(): void
    {
        $this->get('/produtos')->assertOk()->assertSee('Produtos e estoque');
    }

    public function test_missing_route_returns_not_found(): void
    {
        $this->get('/rota-que-nao-existe')->assertNotFound();
    }

    public function test_product_can_be_created_and_found_in_the_database(): void
    {
        Product::create($this->validProduct());

        $this->assertDatabaseHas('products', ['name' => 'Bolo de teste', 'price' => 25.50]);
    }

    public function test_customer_can_be_created_through_post(): void
    {
        $response = $this->post('/clientes', [
            'name' => 'Cliente de teste',
            'email' => 'cliente@example.com',
            'phone' => '11999990000',
            'address' => 'Rua dos Testes, 20',
            'city' => 'São Paulo',
        ]);

        $response->assertRedirect('/clientes');
        $this->assertDatabaseHas('customers', ['email' => 'cliente@example.com']);
    }

    public function test_product_validation_rejects_missing_name(): void
    {
        $this->post('/produtos', $this->validProduct(['name' => '']))
            ->assertSessionHasErrors('name');
    }

    public function test_product_validation_rejects_invalid_price(): void
    {
        $this->post('/produtos', $this->validProduct(['price' => -1]))
            ->assertSessionHasErrors('price');
    }

    public function test_product_price_can_be_updated_and_customer_deleted(): void
    {
        $product = Product::create($this->validProduct());
        $customer = Customer::create(['name' => 'Cliente para excluir']);

        $this->put("/produtos/{$product->id}", $this->validProduct(['price' => 31.75]))
            ->assertRedirect('/produtos');
        $this->assertDatabaseHas('products', ['id' => $product->id, 'price' => 31.75]);

        $this->delete("/clientes/{$customer->id}")->assertRedirect('/clientes');
        $this->assertDatabaseMissing('customers', ['id' => $customer->id]);
    }

    public function test_order_reduces_product_stock_by_ordered_quantity(): void
    {
        $customer = Customer::create(['name' => 'Cliente do pedido']);
        $product = Product::create($this->validProduct(['stock' => 10]));

        $this->post('/pedidos', [
            'customer_id' => $customer->id,
            'product_id' => $product->id,
            'quantity' => 3,
            'status' => 'confirmed',
        ])->assertRedirect('/pedidos');

        $this->assertDatabaseHas('orders', ['customer_id' => $customer->id, 'product_id' => $product->id, 'quantity' => 3]);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 7]);
    }

    public function test_order_larger_than_stock_is_rejected_without_creating_order(): void
    {
        $customer = Customer::create(['name' => 'Cliente do pedido inválido']);
        $product = Product::create($this->validProduct(['stock' => 2]));

        $this->post('/pedidos', [
            'customer_id' => $customer->id,
            'product_id' => $product->id,
            'quantity' => 3,
            'status' => 'pending',
        ])->assertSessionHasErrors('quantity');

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 2]);
    }

    private function validProduct(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Bolo de teste',
            'category' => 'Bolos',
            'price' => 25.50,
            'stock' => 10,
            'minimum_stock' => 2,
            'active' => true,
        ], $overrides);
    }
}
