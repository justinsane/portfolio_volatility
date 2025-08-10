# Render Deployment Checklist

## ✅ Pre-deployment (Completed)
- [x] Repository pushed to GitHub
- [x] Backend files configured (Procfile, runtime.txt)
- [x] CORS settings updated for production
- [x] Frontend configured for Vercel

## 🚀 Backend Deployment (Render)

### Step 1: Render Setup
- [ ] Go to [render.com](https://render.com)
- [ ] Sign up with GitHub account
- [ ] Verify email address

### Step 2: Create Web Service
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repo: `justinsane/portfolio_volatility`
- [ ] Configure settings:
  - [ ] Name: `portfolio-volatility-backend`
  - [ ] Environment: `Python 3`
  - [ ] Region: Choose closest location
  - [ ] Branch: `main`
  - [ ] Root Directory: (leave empty)
  - [ ] Build Command: `pip install -r requirements.txt`
  - [ ] Start Command: `python run.py`
  - [ ] Plan: Free

### Step 3: Deploy Backend
- [ ] Click "Create Web Service"
- [ ] Wait for build to complete (5-10 minutes)
- [ ] Copy the Render URL (e.g., `https://portfolio-volatility-backend.onrender.com`)

### Step 4: Test Backend
- [ ] Visit your Render URL
- [ ] Should see API status message
- [ ] Visit `/docs` endpoint for API documentation
- [ ] Test is working correctly

## 🎨 Frontend Deployment (Vercel)

### Step 5: Deploy Frontend
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Sign in with GitHub
- [ ] Click "New Project"
- [ ] Import repo: `justinsane/portfolio_volatility`
- [ ] Configure:
  - [ ] Framework Preset: Next.js
  - [ ] Root Directory: `frontend`
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `.next`
- [ ] Click "Deploy"
- [ ] Wait for build to complete
- [ ] Copy Vercel URL

### Step 6: Connect Frontend to Backend
- [ ] In Vercel dashboard, go to project settings
- [ ] Navigate to "Environment Variables"
- [ ] Add variable:
  - [ ] Name: `NEXT_PUBLIC_API_URL`
  - [ ] Value: `https://your-render-backend-url.onrender.com`
  - [ ] Environment: Production
- [ ] Click "Save"
- [ ] Go to "Deployments" → "Redeploy"

## 🧪 Testing

### Step 7: Test Complete Application
- [ ] Visit your Vercel frontend URL
- [ ] Test portfolio upload with sample CSV:
  ```csv
  Ticker,Weight
  AAPL,25
  VTI,35
  TSLA,15
  VOO,25
  ```
- [ ] Check browser console for errors
- [ ] Verify API calls work
- [ ] Test all features work correctly

### Step 8: CORS Testing
- [ ] Open browser dev tools (F12)
- [ ] Go to Network tab
- [ ] Upload a portfolio file
- [ ] Check for CORS errors
- [ ] If CORS errors occur, update `app.py` and redeploy

## 🔧 Troubleshooting

### If Backend Build Fails:
- [ ] Check Render build logs
- [ ] Verify `requirements.txt` has all dependencies
- [ ] Check Python version compatibility
- [ ] Ensure all files are committed to GitHub

### If Frontend Can't Connect:
- [ ] Verify `NEXT_PUBLIC_API_URL` is set correctly
- [ ] Check backend is running (visit Render URL)
- [ ] Test backend API directly
- [ ] Check CORS settings

### If CORS Errors:
- [ ] Update CORS origins in `app.py` with your Vercel URL
- [ ] Push changes to GitHub
- [ ] Render will auto-redeploy
- [ ] Clear browser cache

## 📊 Performance Check

### Step 9: Performance Testing
- [ ] Test with different portfolio sizes
- [ ] Check response times
- [ ] Verify error handling
- [ ] Test edge cases

## 🎯 Final Verification

### Step 10: Production Ready
- [ ] Backend accessible and responding
- [ ] Frontend accessible and functional
- [ ] API communication working
- [ ] File uploads working
- [ ] Error handling verified
- [ ] Performance acceptable

## 🚀 Success!

Your Portfolio Volatility Predictor is now live:

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.onrender.com`
- **API Docs**: `https://your-app.onrender.com/docs`

## 📝 Notes

- Render free tier: 750 hours/month
- Vercel free tier: 100GB bandwidth/month
- Auto-deploy enabled on both platforms
- Monitor usage to stay within free limits

## 🔄 Updates

To update your application:
1. Make changes locally
2. Push to GitHub
3. Render and Vercel will auto-deploy
4. No manual deployment needed
