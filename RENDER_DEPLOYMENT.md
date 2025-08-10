# Render Deployment Guide

Complete guide to deploy Portfolio Volatility Predictor on Render.

## 🏗️ Architecture

- **Frontend**: Next.js app on Vercel
- **Backend**: FastAPI app on Render
- **Database**: No database required (session-only processing)

## 🚀 Step 1: Deploy Backend to Render

### 1.1 Sign Up for Render
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Verify your email address

### 1.2 Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `justinsane/portfolio_volatility`
3. Configure the service:

**Basic Settings:**
- **Name**: `portfolio-volatility-backend`
- **Environment**: `Python 3`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: Leave empty (root of repo)

**Build & Deploy Settings:**
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python run.py`
- **Plan**: Free (or choose paid plan)

### 1.3 Environment Variables
Add these environment variables in Render dashboard:

```
FRONTEND_URL=https://your-vercel-url.vercel.app
PORT=8000
```

### 1.4 Deploy
1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Build the application
   - Start the service

### 1.5 Get Your Backend URL
- Render will provide a URL like: `https://portfolio-volatility-backend.onrender.com`
- Copy this URL for the next step

## 🎨 Step 2: Deploy Frontend to Vercel

### 2.1 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import repository: `justinsane/portfolio_volatility`
5. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
6. Click "Deploy"

### 2.2 Set Environment Variable
1. In Vercel dashboard, go to your project
2. Navigate to "Settings" → "Environment Variables"
3. Add variable:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-render-backend-url.onrender.com`
   - **Environment**: Production
4. Click "Save"
5. Go to "Deployments" → "Redeploy" to apply changes

## 🔧 Step 3: Configure CORS (if needed)

If you encounter CORS errors, update the backend:

### 3.1 Update CORS in app.py
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-vercel-url.vercel.app",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3.2 Redeploy Backend
1. Push changes to GitHub
2. Render will automatically redeploy

## 🧪 Step 4: Testing

### 4.1 Test Backend
- Visit: `https://your-backend-url.onrender.com/`
- Should see: API status message
- Visit: `https://your-backend-url.onrender.com/docs`
- Should see: FastAPI documentation

### 4.2 Test Frontend
- Visit your Vercel URL
- Try uploading a sample portfolio CSV
- Check browser console for errors

### 4.3 Test API Connection
- Open browser dev tools (F12)
- Go to Network tab
- Upload a portfolio file
- Verify API calls succeed

## 📊 Sample Data for Testing

Use this sample CSV for testing:

```csv
Ticker,Weight
AAPL,25
VTI,35
TSLA,15
VOO,25
```

## 🔧 Troubleshooting

### Build Failures
**Problem**: Build fails during dependency installation
**Solution**: 
1. Check `requirements.txt` has all dependencies
2. Verify Python version compatibility
3. Check Render build logs for specific errors

### CORS Errors
**Problem**: Browser shows CORS errors
**Solution**:
1. Update CORS origins in `app.py`
2. Redeploy backend
3. Clear browser cache

### API Connection Issues
**Problem**: Frontend can't connect to backend
**Solution**:
1. Verify `NEXT_PUBLIC_API_URL` is set correctly
2. Check backend is running (visit backend URL)
3. Test backend API directly

### File Upload Issues
**Problem**: File uploads fail
**Solution**:
1. Check file size limits
2. Verify CSV format
3. Check backend logs for errors

## 📈 Render-Specific Features

### Auto-Deploy
- Render automatically redeploys when you push to GitHub
- No manual deployment needed

### Health Checks
- Render monitors your service health
- Automatic restarts if service fails

### Logs
- View real-time logs in Render dashboard
- Useful for debugging issues

### Scaling
- Free tier: 750 hours/month
- Paid plans: Unlimited hours, custom domains

## 💰 Cost Breakdown

### Render (Backend)
- **Free Tier**: 750 hours/month
- **Paid Plans**: Starting at $7/month
- **Custom Domains**: Available on paid plans

### Vercel (Frontend)
- **Free Tier**: 100GB bandwidth/month
- **Pro Plan**: $20/month for more bandwidth

## 🎯 Production Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] API endpoints tested
- [ ] File uploads working
- [ ] Error handling verified
- [ ] Performance tested

## 🚀 Final URLs

After deployment, you'll have:

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.onrender.com`
- **API Docs**: `https://your-app.onrender.com/docs`

## 📞 Support

- **Render Support**: [docs.render.com](https://docs.render.com)
- **Vercel Support**: [vercel.com/docs](https://vercel.com/docs)
- **GitHub Issues**: Create issues in your repository

---

**Note**: This deployment uses Render's free tier which has limitations. For production use, consider upgrading to paid plans for better performance and reliability.
