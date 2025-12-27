# CORS Configuration Guide

## Issue
CORS error when frontend at `https://vital3-lovat.vercel.app` tries to fetch from backend at `https://vital0-u4bp.vercel.app`

## Root Cause
Backend is not sending CORS headers allowing requests from the frontend domain.

## Solution Implemented

### 1. Backend Configuration (server.js)
✅ Enhanced CORS setup with explicit origin checking
✅ Added debugging to log allowed origins
✅ Set proper CORS options including credentials

### 2. Environment Variables
Frontend needs:
```
PUBLIC_BACKEND_URL=https://vital0-u4bp.vercel.app
```

Backend needs:
```
FRONTEND_URL_PROD=https://vital3-lovat.vercel.app
```

### 3. Vercel Configuration (vercel.json)
✅ Created vercel.json to configure serverless function timeout
✅ Set maxDuration to 60 seconds (from default 10)

## What You Need to Do

### Step 1: Check Vercel Backend Environment Variables
1. Go to Vercel Dashboard → Your Backend Project
2. Go to Settings → Environment Variables
3. Make sure these exist:
   - `FRONTEND_URL_PROD` = `https://vital3-lovat.vercel.app`
   - `MONGODB_URI` = (your connection string)
   - `JWT_SECRET` = (your secret)

### Step 2: Test Health Check
Open in browser:
```
https://vital0-u4bp.vercel.app/api/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2025-11-13T...",
  "environment": "production",
  "frontendUrl": "http://localhost:4322",
  "frontendUrlProd": "https://vital3-lovat.vercel.app"
}
```

### Step 3: Deploy
1. Commit and push changes:
   ```bash
   git add -A
   git commit -m "Fix CORS and Vercel configuration"
   git push
   ```

2. Vercel will auto-deploy both frontend and backend

### Step 4: Verify CORS Headers
Open DevTools → Network → Click login request → Headers
Look for response headers:
```
Access-Control-Allow-Origin: https://vital3-lovat.vercel.app
Access-Control-Allow-Credentials: true
```

## If Still Getting CORS Error

Try these debugging steps:

1. **Check if backend is running:**
   ```
   curl https://vital0-u4bp.vercel.app/api/health
   ```

2. **Check browser console for detailed error:**
   - It should show which origin is being blocked

3. **Check Vercel logs:**
   - Vercel Dashboard → Your Backend Project → Deployments → Logs
   - Look for CORS origin logging

4. **Fallback: Use environment variable directly**
   - Add your frontend URL as environment variable if not working

