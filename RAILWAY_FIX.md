# 🚨 Railway Environment Variables Fix

## Problem Identified
Database connection error: `SQLSTATE[08006] [7] connection to server at "db.mwashfvplyrygvrywtfh.supabase.co"`

## Railway Environment Variables Required

Go to your Railway project → Settings → Environment Variables and add:

```
DB_CONNECTION=pgsql
DB_HOST=db.mwashfvplyrygvrywtfh.supabase.co
DB_PORT=6543
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=jT6OO733mxTFSMLs
DB_SSLMODE=require
APP_KEY=base64:z/+7xU/BEeu143q9+/f0ym2Fp+rtm0O5hrjIuyjHtMw=
APP_ENV=production
APP_DEBUG=false
```

## Alternative (Simpler)
Or use a single DB_URL:
```
DB_URL=postgres://postgres:jT6OO733mxTFSMLs@db.mwashfvplyrygvrywtfh.supabase.co:6543/postgres?sslmode=require
APP_KEY=base64:z/+7xU/BEeu143q9+/f0ym2Fp+rtm0O5hrjIuyjHtMw=
APP_ENV=production
APP_DEBUG=false
```

## After Setting Variables
1. Redeploy the service in Railway
2. Check logs for migration success
3. Test https://flash-cards-production-5df5.up.railway.app/api/health again

## Note
Railway environment variables override the .env file in the backend folder.
