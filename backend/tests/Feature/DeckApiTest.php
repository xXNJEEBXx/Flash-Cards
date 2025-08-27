<?php
namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeckApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_list_decks(): void
    {
        $this->seed();
        $resp = $this->getJson('/api/decks');
        $resp->assertOk()->assertJsonStructure([
            ['id','title','description','cards']
        ]);
    }
}
?>
