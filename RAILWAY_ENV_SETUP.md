# Railway Environment Variables Setup

## Copy and paste these environment variables in Railway Dashboard:

### Database Configuration (choose one method):

#### Method 1: Individual Variables (Recommended)

```
DB_CONNECTION=pgsql
DB_HOST=db.mwashfvplyrygvrywtfh.supabase.co
DB_PORT=6543
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=jT6OO733mxTFSMLs
DB_SSLMODE=require
```

#### Method 2: Single URL (Alternative)

```
DATABASE_URL=postgres://postgres:jT6OO733mxTFSMLs@db.mwashfvplyrygvrywtfh.supabase.co:6543/postgres?sslmode=require
```

### Laravel Configuration (Required)

```
APP_NAME=FlashCards
APP_ENV=production
APP_KEY=base64:z/+7xU/BEeu143q9+/f0ym2Fp+rtm0O5hrjIuyjHtMw=
APP_DEBUG=false
APP_URL=https://flash-cards-production-5df5.up.railway.app

LOG_CHANNEL=stderr
LOG_LEVEL=info

CACHE_STORE=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync
```

## Steps to Add in Railway:

1. Go to Railway Dashboard
2. Click on your Flash Cards service
3. Go to "Variables" tab
4. Click "New Variable"
5. Add each variable name and value
6. Click "Deploy" after adding all variables

## Verification Commands:

After deployment, test:

```bash
curl https://flash-cards-production-5df5.up.railway.app/api/health
curl https://flash-cards-production-5df5.up.railway.app/api/decks
```

## Alternative: Railway CLI

```bash
railway login
railway link
railway variables set DB_CONNECTION=pgsql
railway variables set DB_HOST=db.mwashfvplyrygvrywtfh.supabase.co
railway variables set DB_PORT=6543
railway variables set DB_DATABASE=postgres
railway variables set DB_USERNAME=postgres
railway variables set DB_PASSWORD=jT6OO733mxTFSMLs
railway variables set DB_SSLMODE=require
railway variables set APP_KEY=base64:z/+7xU/BEeu143q9+/f0ym2Fp+rtm0O5hrjIuyjHtMw=
railway variables set APP_ENV=production
railway variables set APP_DEBUG=false
railway deploy
```
