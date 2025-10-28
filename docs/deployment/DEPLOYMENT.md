# Deployment Guide

This guide covers deploying the Portfolio Volatility Predictor to production.

## Architecture Overview

- **Frontend**: Next.js app deployed to Vercel
- **Backend**: FastAPI app deployed to Railway/Render/Heroku
- **Communication**: Frontend communicates with backend via API calls

## Frontend Deployment (Vercel)

### 1. Deploy to Vercel

1. **Connect your GitHub repository**:
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your `portfolio_volatility` repository

2. **Configure the project**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

3. **Set Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add: `NEXT_PUBLIC_API_URL` = `https://your-backend-url.com`

4. **Deploy**:
   - Click "Deploy"
   - Vercel will automatically build and deploy your frontend

### 2. Custom Domain (Optional)

- Go to Project Settings → Domains
- Add your custom domain
- Update DNS records as instructed

## Backend Deployment

### Option 1: Railway (Recommended)

1. **Sign up for Railway**:
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub

2. **Deploy the backend**:
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your `portfolio_volatility` repository
   - Railway will detect it's a Python app

3. **Configure environment**:
   - Set `PORT` environment variable (Railway sets this automatically)
   - Add any other required environment variables

4. **Get your backend URL**:
   - Railway will provide a URL like `https://your-app.railway.app`
   - Copy this URL for the frontend environment variable

### Option 2: Render

1. **Sign up for Render**:
   - Go to [render.com](https://render.com)
   - Sign in with GitHub

2. **Create a new Web Service**:
   - Connect your GitHub repository
   - Set build command: `pip install -r requirements.txt`
   - Set start command: `python run.py`
   - Choose the free tier

3. **Configure environment**:
   - Add environment variables as needed
   - Render will provide a URL automatically

### Option 3: Heroku

1. **Install Heroku CLI**:
   ```bash
   # macOS
   brew install heroku/brew/heroku
   
   # Or download from heroku.com
   ```

2. **Deploy**:
   ```bash
   heroku login
   heroku create your-app-name
   git push heroku main
   ```

3. **Set environment variables**:
   ```bash
   heroku config:set FRONTEND_URL=https://your-frontend-url.vercel.app
   ```

## Environment Variables

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

### Backend (Railway/Render/Heroku)
```
FRONTEND_URL=https://your-frontend-url.vercel.app
PORT=8000
```

## Testing the Deployment

1. **Test the backend**:
   - Visit `https://your-backend-url.com/`
   - Should see API status message
   - Visit `https://your-backend-url.com/docs` for API docs

2. **Test the frontend**:
   - Visit your Vercel URL
   - Try uploading a sample portfolio
   - Check that API calls work

3. **Test CORS**:
   - Open browser dev tools
   - Check for CORS errors in the console
   - If errors occur, update CORS settings in `app.py`

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Update `allow_origins` in `app.py` with your frontend URL
   - Redeploy the backend

2. **Build Failures**:
   - Check that all dependencies are in `requirements.txt`
   - Ensure Python version is compatible

3. **API Connection Issues**:
   - Verify `NEXT_PUBLIC_API_URL` is set correctly
   - Check that backend is running and accessible

4. **File Upload Issues**:
   - Ensure backend can handle file uploads
   - Check file size limits

### Debugging

1. **Check Vercel logs**:
   - Go to your project in Vercel dashboard
   - Click on a deployment → "Functions" tab
   - Check for errors

2. **Check backend logs**:
   - Railway: Go to your project → "Deployments" → "View Logs"
   - Render: Go to your service → "Logs" tab
   - Heroku: `heroku logs --tail`

## Production Considerations

### Security
- Update CORS origins to only allow your production domains
- Consider adding API rate limiting
- Use HTTPS for all communications

### Performance
- Enable caching where appropriate
- Consider CDN for static assets
- Monitor API response times

### Monitoring
- Set up error tracking (Sentry, etc.)
- Monitor API usage and performance
- Set up alerts for downtime

## Cost Optimization

### Vercel
- Free tier: 100GB bandwidth/month
- Pro plan: $20/month for more bandwidth

### Railway
- Free tier: $5 credit/month
- Paid plans start at $5/month

### Render
- Free tier: 750 hours/month
- Paid plans start at $7/month

## Next Steps

1. Set up monitoring and alerts
2. Configure custom domain
3. Set up CI/CD for automatic deployments
4. Add SSL certificates
5. Implement caching strategies
