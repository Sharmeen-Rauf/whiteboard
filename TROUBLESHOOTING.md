# Real-Time Collaboration Troubleshooting Guide

## Issue: Users Can't See Each Other's Work

### Step 1: Check Environment Variables

**Vercel Environment Variables:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `NEXT_PUBLIC_SOCKET_URL` is set correctly:
   - ✅ Should be: `https://whiteboard-production-2c7a.up.railway.app`
   - ❌ Should NOT be: `whiteboard-production-2c7a.up.railway.app` (missing https://)
   - ❌ Should NOT be: `http://whiteboard-production-2c7a.up.railway.app` (use https)

**Railway Environment Variables:**
1. Go to Railway Dashboard → whiteboard service → Variables tab
2. Verify `NEXT_PUBLIC_APP_URL` is set:
   - Should be your Vercel URL: `https://your-app.vercel.app`

### Step 2: Check Browser Console

Open browser DevTools (F12) and check Console tab:

**Good Signs:**
- ✅ `Connecting to Socket.io server: https://...`
- ✅ `✅ Connected to Socket.io server: [socket-id]`
- ✅ `👤 [username] joined room [roomId]`
- ✅ `📤 Sending update: X elements`
- ✅ `📥 Received remote update: X elements`

**Bad Signs:**
- ❌ `❌ Socket connection error: ...`
- ❌ `CORS blocked origin: ...`
- ❌ `Room not found: ...`

### Step 3: Check Railway Logs

1. Go to Railway Dashboard → whiteboard service → Logs tab
2. Look for:
   - ✅ `Socket.io server running on port [PORT]`
   - ✅ `User connected: [socket-id]`
   - ✅ `👤 [username] joined room [roomId]`
   - ✅ `📨 Received change for room [roomId]`
   - ✅ `📤 Broadcasting to X other clients`

### Step 4: Verify Connection Status

On the whiteboard page, check the status badge:
- 🟢 **Connected - Live Collaboration** = Working!
- 🔵 **Connecting...** = Still connecting (wait a few seconds)
- ⚪ **Working Offline** = Not connected (check environment variables)

### Step 5: Test Connection

1. **Open two browser windows** (or two devices)
2. **Join the same room** (same URL)
3. **Draw something in window 1**
4. **Check window 2** - should see the drawing appear

### Common Issues & Fixes

#### Issue: "Working Offline" Status
**Fix:**
- Check `NEXT_PUBLIC_SOCKET_URL` in Vercel
- Ensure URL starts with `https://`
- Redeploy Vercel after changing environment variables

#### Issue: CORS Error
**Fix:**
- Add `NEXT_PUBLIC_APP_URL` in Railway Variables
- Set it to your Vercel URL: `https://your-app.vercel.app`
- Restart Railway service

#### Issue: Connection Error
**Fix:**
- Verify Railway service is "Online"
- Check Railway URL is correct
- Ensure Railway service is exposed (has public URL)

#### Issue: Updates Not Syncing
**Fix:**
- Check browser console for errors
- Verify both users are in the same room (same URL)
- Check Railway logs for broadcast messages
- Ensure both users have "🟢 Connected" status

### Debug Mode

To enable more detailed logging:

1. Open browser console (F12)
2. All Socket.io events are logged with emojis:
   - 🔵 = Connection events
   - 👤 = User events
   - 📤 = Outgoing updates
   - 📥 = Incoming updates
   - ✅ = Success
   - ❌ = Error

### Still Not Working?

1. **Check Railway Service Status:**
   - Should show "Online" with green dot
   - Should have public URL visible

2. **Check Vercel Deployment:**
   - Latest deployment should be successful
   - Environment variables should be set

3. **Test Locally:**
   ```bash
   # Terminal 1
   npm run dev
   
   # Terminal 2
   npm run server
   ```
   - Open http://localhost:3000
   - Set `NEXT_PUBLIC_SOCKET_URL=http://localhost:3001` in `.env.local`
   - Test if local collaboration works

4. **Check Network Tab:**
   - Open DevTools → Network tab
   - Filter by "WS" (WebSocket)
   - Should see connection to Railway URL
   - Status should be "101 Switching Protocols"
