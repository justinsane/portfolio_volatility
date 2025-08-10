# Deployment Checklist

## ✅ Pre-deployment (Completed)
- [x] Updated Next.js config for production API routing
- [x] Added Vercel configuration files
- [x] Updated CORS settings for production
- [x] Created deployment documentation
- [x] Pushed changes to GitHub

## 🚀 Frontend Deployment (Vercel)

### Step 1: Deploy Frontend
1. [ ] Go to [vercel.com](https://vercel.com)
2. [ ] Sign in with GitHub
3. [ ] Click "New Project"
4. [ ] Import `justinsane/portfolio_volatility` repository
5. [ ] Configure project:
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
6. [ ] Click "Deploy"
7. [ ] Wait for build to complete
8. [ ] Copy the Vercel URL (e.g., `https://portfolio-volatility-abc123.vercel.app`)

## 🔧 Backend Deployment (Railway - Recommended)

### Step 2: Deploy Backend
1. [ ] Go to [railway.app](https://railway.app)
2. [ ] Sign in with GitHub
3. [ ] Click "New Project"
4. [ ] Select "Deploy from GitHub repo"
5. [ ] Choose `justinsane/portfolio_volatility` repository
6. [ ] Railway will auto-detect Python app
7. [ ] Wait for deployment to complete
8. [ ] Copy the Railway URL (e.g., `https://portfolio-volatility-backend.railway.app`)

### Step 3: Configure Environment Variables
1. [ ] In Railway dashboard, go to your project
2. [ ] Click "Variables" tab
3. [ ] Add environment variable:
   - Key: `FRONTEND_URL`
   - Value: `https://your-vercel-url.vercel.app`

## 🔗 Connect Frontend to Backend

### Step 4: Update Frontend Environment
1. [ ] Go back to Vercel dashboard
2. [ ] Select your project
3. [ ] Go to "Settings" → "Environment Variables"
4. [ ] Add environment variable:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `https://your-railway-url.railway.app`
5. [ ] Click "Save"
6. [ ] Go to "Deployments" tab
7. [ ] Click "Redeploy" to apply environment variables

## 🧪 Testing

### Step 5: Test Deployment
1. [ ] Test backend API:
   - Visit `https://your-railway-url.railway.app/`
   - Should see API status message
   - Visit `https://your-railway-url.railway.app/docs` for API docs

2. [ ] Test frontend:
   - Visit your Vercel URL
   - Try uploading a sample portfolio CSV
   - Check that API calls work without errors

3. [ ] Test CORS:
   - Open browser dev tools (F12)
   - Check Console tab for CORS errors
   - If errors occur, update CORS settings in `app.py`

## 🔧 Troubleshooting

### If CORS Errors Occur:
1. [ ] Update `app.py` CORS origins with your Vercel URL
2. [ ] Redeploy backend to Railway

### If Build Fails:
1. [ ] Check Vercel build logs
2. [ ] Ensure all dependencies are in `package.json`
3. [ ] Verify Next.js configuration

### If API Calls Fail:
1. [ ] Verify `NEXT_PUBLIC_API_URL` is set correctly
2. [ ] Check Railway logs for backend errors
3. [ ] Test backend URL directly in browser

## 📝 Final Steps

### Step 6: Documentation
1. [ ] Update README.md with production URLs
2. [ ] Document any custom configurations
3. [ ] Share deployment URLs with team

### Step 7: Monitoring
1. [ ] Set up basic monitoring (optional)
2. [ ] Test application thoroughly
3. [ ] Document any issues found

## 🎉 Success!
Your Portfolio Volatility Predictor is now live at:
- Frontend: `https://your-vercel-url.vercel.app`
- Backend: `https://your-railway-url.railway.app`
- API Docs: `https://your-railway-url.railway.app/docs`
