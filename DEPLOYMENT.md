# Deployment Guide

## Current Setup
- **Next.js App**: Deployed on Vercel ✅
- **Socket.io Server**: Needs separate deployment

## Recommended Architecture

### Option 1: Railway (Recommended) 🚀
**Best for**: Easy setup, good free tier, great for Node.js

**Pros:**
- ✅ Free tier: $5 credit/month (enough for small apps)
- ✅ Very easy setup (GitHub integration)
- ✅ Auto-deploys on push
- ✅ Built-in environment variables
- ✅ Good documentation
- ✅ Fast deployment

**Cons:**
- ⚠️ Free tier limited (but enough for Socket.io server)

### Option 2: Render
**Best for**: Free tier with limitations

**Pros:**
- ✅ Free tier available (with limitations)
- ✅ Easy setup
- ✅ Auto-deploys on push

**Cons:**
- ⚠️ Free tier: Spins down after 15 min inactivity
- ⚠️ Slower cold starts
- ⚠️ Less reliable for real-time apps

## Deployment Steps

### Deploy Socket.io Server on Railway

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your repository

3. **Configure Service**
   - Railway will auto-detect Node.js
   - Set **Start Command**: `node server.js`
   - Set **Port**: Railway auto-assigns (use `$PORT` env var)

4. **Update server.js** (already done - uses `process.env.PORT`)

5. **Set Environment Variables**
   ```
   PORT=3001
   NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
   ```

6. **Get Socket.io Server URL**
   - Railway gives you a URL like: `https://your-app.railway.app`
   - Copy this URL

7. **Update Vercel Environment Variables**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `NEXT_PUBLIC_SOCKET_URL=https://your-app.railway.app`

8. **Redeploy Vercel**
   - Push a commit or manually redeploy

### Deploy Socket.io Server on Render (Alternative)

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repo

3. **Configure Service**
   - **Name**: `whiteboard-socket-server`
   - **Environment**: Node
   - **Build Command**: (leave empty or `npm install`)
   - **Start Command**: `node server.js`
   - **Plan**: Free (or paid for better performance)

4. **Set Environment Variables**
   ```
   PORT=10000
   NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
   ```

5. **Get Socket.io Server URL**
   - Render gives you: `https://your-app.onrender.com`
   - Copy this URL

6. **Update Vercel Environment Variables**
   - Add: `NEXT_PUBLIC_SOCKET_URL=https://your-app.onrender.com`

7. **Redeploy Vercel**

## Environment Variables Summary

### Railway/Render (Socket.io Server)
```
PORT=3001 (or auto-assigned)
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
```

### Vercel (Next.js App)
```
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.railway.app
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
```

## Testing

1. Deploy Socket.io server on Railway/Render
2. Update `NEXT_PUBLIC_SOCKET_URL` in Vercel
3. Open your Vercel app in two browser windows
4. Join the same whiteboard room
5. Draw something in one window → should appear in other window instantly!

## Cost Comparison

### Railway
- **Free**: $5 credit/month (usually enough for Socket.io server)
- **Paid**: $5/month minimum after free tier

### Render
- **Free**: Available but spins down after inactivity
- **Paid**: $7/month for always-on

## Recommendation: Railway 🎯

Railway is better because:
1. ✅ More reliable for real-time apps (no spin-down)
2. ✅ Better free tier
3. ✅ Easier setup
4. ✅ Faster deployments
