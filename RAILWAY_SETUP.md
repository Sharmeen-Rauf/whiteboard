# Railway Service Expose Karne Ka Guide

## Step 1: Railway Service Ko Expose Karo

1. **Railway Dashboard mein jao**
   - Apne "whiteboard" service par click karo

2. **Settings tab par jao**
   - Left sidebar mein "Settings" par click karo

3. **Generate Domain button dhoondo**
   - Settings page mein "Networking" ya "Public Domain" section hoga
   - **"Generate Domain"** ya **"Expose"** button click karo
   - Ya **"Public URL"** toggle ON karo

4. **Public URL copy karo**
   - Railway automatically ek URL generate karega
   - Example: `https://whiteboard-production-xxxx.up.railway.app`
   - Is URL ko **copy** karo (yeh aapka Socket.io server URL hai)

## Step 2: Vercel Mein Environment Variable Add Karo

1. **Vercel Dashboard mein jao**
   - https://vercel.com/dashboard
   - Apne project par click karo

2. **Settings → Environment Variables**
   - Left sidebar se "Settings" click karo
   - "Environment Variables" section mein jao

3. **Naya Variable Add Karo**
   - **Key**: `NEXT_PUBLIC_SOCKET_URL`
   - **Value**: Railway ka URL (jo aapne copy kiya)
     - Example: `https://whiteboard-production-xxxx.up.railway.app`
   - **Environment**: Production, Preview, Development (sab select karo)
   - **"Save"** button click karo

4. **Redeploy Karo**
   - "Deployments" tab mein jao
   - Latest deployment ke right side par "..." menu
   - **"Redeploy"** click karo
   - Ya koi bhi new commit push karo

## Step 3: Railway Environment Variables (Optional but Recommended)

Railway mein bhi Vercel URL add karo:

1. **Railway Dashboard → whiteboard service → Variables tab**
2. **Add Variable**:
   - **Key**: `NEXT_PUBLIC_APP_URL`
   - **Value**: Apna Vercel URL
     - Example: `https://your-app.vercel.app`
   - **Save** karo

## Testing

1. Dono services expose ho jayen
2. Vercel app kholo
3. Whiteboard join karo
4. Connection status "🟢 Connected" dikhna chahiye
5. Do browser windows mein test karo - real-time sync kaam karna chahiye!
