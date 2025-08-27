# Tests Directory

This directory contains all testing scripts, setup utilities, and validation tools for the Flash Cards application.

## 📁 Test Files

### Setup Scripts

- **`setup-backend.ps1`** - Automated Laravel backend installation and configuration script
  - Creates Laravel project structure
  - Configures SQLite database
  - Sets up models, controllers, and migrations
  - Seeds initial data
  - **Prerequisites**: PHP 8.2+, Composer
  - **Usage**: `powershell -ExecutionPolicy Bypass -File "setup-backend.ps1"`

### API Tests

- **`test-api.ps1`** - Basic Laravel API endpoint testing
  - Tests individual API endpoints
  - Validates request/response format
  - **Prerequisites**: Laravel server running on http://127.0.0.1:8000
  - **Usage**: `powershell -ExecutionPolicy Bypass -File "test-api.ps1"`

### Integration Tests

- **`final-test.ps1`** - Complete end-to-end API integration testing
  - Tests full CRUD operations on decks and cards
  - Validates data persistence
  - Tests card state management (known/unknown)
  - **Prerequisites**: Laravel server running on http://127.0.0.1:8000
  - **Usage**: `powershell -ExecutionPolicy Bypass -File "final-test.ps1"`

## 🚀 Running Tests

### 1. Setup Backend (First Time Only)

```powershell
cd "c:\xXNJEEBXx\Projects\flash Cards\tests"
powershell -ExecutionPolicy Bypass -File "setup-backend.ps1"
```

### 2. Start Laravel Server

```powershell
cd "c:\xXNJEEBXx\Projects\flash Cards\backend"
php artisan serve
```

### 3. Run API Tests

```powershell
cd "c:\xXNJEEBXx\Projects\flash Cards\tests"
powershell -ExecutionPolicy Bypass -File "test-api.ps1"
```

### 4. Run Integration Tests

```powershell
cd "c:\xXNJEEBXx\Projects\flash Cards\tests"
powershell -ExecutionPolicy Bypass -File "final-test.ps1"
```

## 📋 Test Coverage

### Backend API Tests

- ✅ GET `/api/decks` - List all decks
- ✅ POST `/api/decks` - Create new deck
- ✅ PUT `/api/decks/{id}` - Update deck
- ✅ DELETE `/api/decks/{id}` - Delete deck
- ✅ POST `/api/decks/{id}/reset` - Reset deck progress
- ✅ POST `/api/decks/{id}/cards` - Add card to deck
- ✅ PUT `/api/decks/{id}/cards/{cardId}` - Update card
- ✅ DELETE `/api/decks/{id}/cards/{cardId}` - Delete card
- ✅ POST `/api/decks/{id}/cards/{cardId}/toggle-known` - Toggle card status

### Frontend Integration Tests

- ✅ React app connects to Laravel API
- ✅ Graceful fallback to localStorage when API unavailable
- ✅ Data synchronization between frontend and backend
- ✅ Field mapping (frontend: question/answer ↔ backend: question/answer)

## 🐛 Troubleshooting

### Common Issues

**Laravel Server Not Starting**

- Ensure PHP 8.2+ is installed and in PATH
- Check if port 8000 is available
- Verify `.env` file exists in backend directory

**API Connection Fails**

- Confirm Laravel server is running on http://127.0.0.1:8000
- Check Windows Firewall settings
- Verify CORS configuration in Laravel

**Database Issues**

- Ensure SQLite database file exists: `backend/database/database.sqlite`
- Run migrations: `php artisan migrate:fresh --seed`
- Check database permissions

**PowerShell Execution Policy**

- Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- Or use: `powershell -ExecutionPolicy Bypass -File "script.ps1"`

## 📝 Adding New Tests

When adding new test files to this directory:

1. **Name descriptively**: Use clear, descriptive names that indicate the test purpose
2. **Add documentation**: Include header comments explaining the test's purpose and usage
3. **Follow conventions**: Use appropriate file extensions (`.ps1` for PowerShell, `.js` for JavaScript/Node)
4. **Update this README**: Add documentation for new tests in the appropriate section
5. **Test prerequisites**: Clearly document any dependencies or setup requirements

## 🔄 Continuous Integration

These tests are designed to validate:

- Backend API functionality
- Frontend-backend integration
- Data persistence and integrity
- Error handling and fallback mechanisms
- Cross-platform compatibility (Windows focus)

For automated CI/CD, these scripts can be integrated into GitHub Actions or other CI platforms with appropriate PowerShell runners.
