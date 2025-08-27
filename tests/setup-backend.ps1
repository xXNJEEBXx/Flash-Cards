<#
.SYNOPSIS
Sets up a Laravel backend in ./backend for the Flash Cards app.

.DESCRIPTION
- Checks for PHP and Composer
- Creates Laravel app if missing
- Configures .env for SQLite
- Enables CORS for http://localhost:3000
- Adds models, migrations, controllers, routes, seeders, and tests
- Runs migrations and seeders

.USAGE
PowerShell (Windows):
  ./setup-backend.ps1
#>

param(
  [string]$AppDir = "backend",
  [string]$FrontendOrigin = "http://localhost:3000"
)

function Assert-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Write-Error "Required command '$Name' not found in PATH." -ErrorAction Stop
  }
}

Write-Host "[1/8] Checking prerequisites..." -ForegroundColor Cyan
Assert-Command php
Assert-Command composer

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path $AppDir)) {
  Write-Host "[2/8] Creating Laravel app in '$AppDir'..." -ForegroundColor Cyan
  composer create-project laravel/laravel $AppDir | Write-Host
} else {
  Write-Host "Laravel app directory already exists. Skipping create-project." -ForegroundColor Yellow
}

Set-Location $AppDir

Write-Host "[3/8] Configuring .env for SQLite..." -ForegroundColor Cyan
if (-not (Test-Path ".env")) { Copy-Item ".env.example" ".env" }
(Get-Content .env) |
  ForEach-Object {
    $_ -replace '^DB_CONNECTION=.*', 'DB_CONNECTION=sqlite' `
       -replace '^DB_HOST=.*', '# DB_HOST=127.0.0.1' `
       -replace '^DB_PORT=.*', '# DB_PORT=3306' `
       -replace '^DB_DATABASE=.*', '# DB_DATABASE=laravel' `
       -replace '^DB_USERNAME=.*', '# DB_USERNAME=root' `
       -replace '^DB_PASSWORD=.*', '# DB_PASSWORD='
  } | Set-Content .env

# Create SQLite database file
$dbDir = Join-Path (Get-Location) "database"
New-Item -ItemType Directory -Force -Path $dbDir | Out-Null
New-Item -ItemType File -Force -Path (Join-Path $dbDir "database.sqlite") | Out-Null

Write-Host "[4/8] Installing backend dependencies..." -ForegroundColor Cyan
composer install | Write-Host
php artisan key:generate | Write-Host

Write-Host "[5/8] Enabling CORS for $FrontendOrigin ..." -ForegroundColor Cyan
# Install fruitcake/laravel-cors if not present
if (-not (Select-String -Path composer.json -Pattern 'fruitcake/laravel-cors' -Quiet)) {
  composer require fruitcake/laravel-cors | Write-Host
}

# Configure config/cors.php
if (-not (Test-Path "config\cors.php")) { php artisan vendor:publish --provider="Fruitcake\Cors\CorsServiceProvider" | Write-Host }

(Get-Content "config\cors.php") |
  ForEach-Object { $_ } |
  Set-Content "config\cors.php"

(Get-Content "config\cors.php") -replace "'paths' => \[\]", "'paths' => ['api/*']" `
  -replace "'allowed_origins' => \[\]", "'allowed_origins' => ['$FrontendOrigin']" `
  -replace "'supports_credentials' => false", "'supports_credentials' => false" |
  Set-Content "config\cors.php"

Write-Host "[6/8] Adding app scaffolds (models, migrations, controllers, routes, seeders, tests)..." -ForegroundColor Cyan

# Create directories if missing
@(
  'app/Models',
  'app/Http/Controllers',
  'database/migrations',
  'database/seeders',
  'routes',
  'tests/Feature'
) | ForEach-Object { New-Item -ItemType Directory -Force -Path $_ | Out-Null }

# Write files
$contentRoot = Split-Path -Parent $root
$scaffoldRoot = Join-Path $root "_scaffold"
New-Item -ItemType Directory -Force -Path $scaffoldRoot | Out-Null

# Models
@'
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Deck extends Model
{
    use HasFactory;
    protected $fillable = ['title', 'description'];
    public function cards(): HasMany { return $this->hasMany(Card::class); }
}
?>
'@ | Set-Content "app/Models/Deck.php"

@'
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Card extends Model
{
    use HasFactory;
    protected $fillable = ['question', 'answer', 'known', 'deck_id'];
    protected $casts = ['known' => 'boolean'];
    public function deck(): BelongsTo { return $this->belongsTo(Deck::class); }
}
?>
'@ | Set-Content "app/Models/Card.php"

# Migrations
@'
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('decks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('decks'); }
};
?>
'@ | Set-Content "database/migrations/2025_01_01_000000_create_decks_table.php"

@'
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deck_id')->constrained('decks')->onDelete('cascade');
            $table->string('question');
            $table->text('answer');
            $table->boolean('known')->default(false);
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('cards'); }
};
?>
'@ | Set-Content "database/migrations/2025_01_01_000001_create_cards_table.php"

# Controllers
@'
<?php
namespace App\Http\Controllers;

use App\Models\Deck;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeckController extends Controller
{
    public function index() { return Deck::with('cards')->orderBy('id','asc')->get(); }
    public function show(Deck $deck) { return $deck->load('cards'); }
    public function store(Request $request) {
        $data = $request->validate(['title' => 'required|string|max:255', 'description' => 'nullable|string']);
        $deck = Deck::create($data);
        return response()->json($deck, 201);
    }
    public function update(Request $request, Deck $deck) {
        $data = $request->validate(['title' => 'required|string|max:255', 'description' => 'nullable|string']);
        $deck->update($data);
        return $deck;
    }
    public function destroy(Deck $deck) { $deck->delete(); return response()->noContent(); }
    public function reset(Deck $deck) { $deck->cards()->update(['known' => false]); return $deck->load('cards'); }
}
?>
'@ | Set-Content "app/Http/Controllers/DeckController.php"

@'
<?php
namespace App\Http\Controllers;

use App\Models\Card;
use App\Models\Deck;
use Illuminate\Http\Request;

class CardController extends Controller
{
    public function store(Request $request, Deck $deck) {
        $data = $request->validate([
            'question' => 'required|string',
            'answer' => 'required|string',
        ]);
        $card = $deck->cards()->create($data);
        return response()->json($card, 201);
    }
    public function update(Request $request, Deck $deck, Card $card) {
        $this->assertCardInDeck($deck, $card);
        $data = $request->validate([
            'question' => 'sometimes|required|string',
            'answer' => 'sometimes|required|string',
            'known' => 'sometimes|boolean',
        ]);
        $card->update($data);
        return $card;
    }
    public function destroy(Deck $deck, Card $card) {
        $this->assertCardInDeck($deck, $card);
        $card->delete();
        return response()->noContent();
    }
    public function toggleKnown(Deck $deck, Card $card) {
        $this->assertCardInDeck($deck, $card);
        $card->known = !$card->known;
        $card->save();
        return $card;
    }
    private function assertCardInDeck(Deck $deck, Card $card): void {
        if ($card->deck_id !== $deck->id) { abort(404); }
    }
}
?>
'@ | Set-Content "app/Http/Controllers/CardController.php"

# Routes
@'
<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DeckController;
use App\Http\Controllers\CardController;

Route::get('/decks', [DeckController::class, 'index']);
Route::post('/decks', [DeckController::class, 'store']);
Route::get('/decks/{deck}', [DeckController::class, 'show']);
Route::put('/decks/{deck}', [DeckController::class, 'update']);
Route::delete('/decks/{deck}', [DeckController::class, 'destroy']);
Route::post('/decks/{deck}/reset', [DeckController::class, 'reset']);

Route::post('/decks/{deck}/cards', [CardController::class, 'store']);
Route::put('/decks/{deck}/cards/{card}', [CardController::class, 'update']);
Route::delete('/decks/{deck}/cards/{card}', [CardController::class, 'destroy']);
Route::post('/decks/{deck}/cards/{card}/toggle-known', [CardController::class, 'toggleKnown']);
?>
'@ | Set-Content "routes/api.php"

# Seeder (converts existing sample data to DB)
@'
<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Deck;
use App\Models\Card;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $deck = Deck::create([
            'title' => 'Cybersecurity Concepts',
            'description' => 'A comprehensive deck of cybersecurity terms and concepts in both English and Arabic',
        ]);

        $cards = json_decode(file_get_contents(database_path('seeders/cards.cybersecurity.json')), true);
        foreach ($cards as $c) {
            $deck->cards()->create([
                'question' => $c['question'],
                'answer' => $c['answer'],
                'known' => false,
            ]);
        }
    }
}
?>
'@ | Set-Content "database/seeders/DatabaseSeeder.php"

@'
[
  // Minimal subset to keep the file small; add more as needed or import full set.
  {"question": "Digital Signature (التوقيع الرقمي)", "answer": "A mathematical technique used to validate the authenticity of a message, verifying it was sent by a particular sender. (إثبات مرسل وصحة رسالة.)"},
  {"question": "AES (Advanced Encryption Standard) (معيار التشفير المتقدم)", "answer": "The current symmetric block cipher standard, using 128-bit blocks and key sizes of 128, 192, or 256 bits, based on a substitution-permutation network (not Feistel). (معيار تشفير حديث وقوي.)"},
  {"question": "SSL/TLS (Secure Sockets Layer / Transport Layer Security) (طبقة المقابس الآمنة / أمن طبقة النقل)", "answer": "Standard technology for keeping an internet connection secure and data confidential between two systems (e.g., browser-server), using encryption and MACs. TLS is the successor to SSL. (تأمين اتصال الإنترنت.)"}
]
'@ | Set-Content "database/seeders/cards.cybersecurity.json"

# Feature tests
@'
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
'@ | Set-Content "tests/Feature/DeckApiTest.php"

Write-Host "[7/8] Running migrations and seeders..." -ForegroundColor Cyan
php artisan migrate:fresh --seed | Write-Host

Write-Host "[8/8] Done. Start the API with: php artisan serve" -ForegroundColor Green
