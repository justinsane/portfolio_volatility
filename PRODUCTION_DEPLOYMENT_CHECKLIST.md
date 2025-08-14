# Production Deployment Checklist

## ✅ Completed Steps

### 1. Environment Variables
- [x] `NEXT_PUBLIC_API_URL` set in Vercel to `https://portfolio-volatility-backend.onrender.com`
- [x] `FRONTEND_URL` set in Render to `https://portfolio-volatility.vercel.app`
- [x] SnapTrade credentials configured in Render environment variables

### 2. Backend Deployment (Render)
- [x] Backend deployed at: `https://portfolio-volatility-backend.onrender.com`
- [x] CORS configured for production URLs
- [x] Environment variables configured
- [x] SnapTrade integration added
- [x] Production-ready run.py configuration

### 3. Frontend Deployment (Vercel)
- [x] Frontend deployed at: `https://portfolio-volatility.vercel.app`
- [x] Environment variables configured
- [x] SnapTrade components integrated
- [x] API routing configured

### 4. Code Changes
- [x] All changes committed to GitHub
- [x] Sensitive files excluded from git tracking
- [x] Production optimizations implemented

## 🔍 Testing Checklist

### Backend API Testing
- [ ] Visit `https://portfolio-volatility-backend.onrender.com/` - Should show API status
- [ ] Visit `https://portfolio-volatility-backend.onrender.com/docs` - Should show FastAPI docs
- [ ] Test `/api/predict` endpoint with sample CSV
- [ ] Test SnapTrade endpoints (if credentials are configured)

### Frontend Testing
- [ ] Visit `https://portfolio-volatility.vercel.app` - Should load without errors
- [ ] Test CSV upload functionality
- [ ] Test manual entry functionality
- [ ] Test SnapTrade integration (if configured)
- [ ] Check browser console for any errors
- [ ] Test responsive design on mobile/tablet

### Integration Testing
- [ ] Upload sample portfolio CSV
- [ ] Verify API calls succeed (check Network tab)
- [ ] Verify results display correctly
- [ ] Test error handling with invalid files
- [ ] Test feedback form submission

## 🚨 Common Issues & Solutions

### CORS Errors
**Symptoms**: Browser console shows CORS errors
**Solution**: 
1. Verify `FRONTEND_URL` is set correctly in Render
2. Check CORS origins in `app.py` include your Vercel URL
3. Clear browser cache and try again

### API Connection Issues
**Symptoms**: Frontend can't connect to backend
**Solution**:
1. Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel
2. Check backend is running (visit backend URL)
3. Test backend API directly

### Build Failures
**Symptoms**: Deployment fails during build
**Solution**:
1. Check build logs in Vercel/Render dashboard
2. Verify all dependencies are in requirements.txt/package.json
3. Check for TypeScript/ESLint errors

### SnapTrade Issues
**Symptoms**: SnapTrade integration not working
**Solution**:
1. Verify SnapTrade credentials are set in Render environment variables
2. Check SnapTrade API status
3. Verify user registration and connection flow

## 📊 Performance Monitoring

### Backend Performance
- Monitor Render dashboard for:
  - Response times
  - Error rates
  - Resource usage
  - Cold start times

### Frontend Performance
- Monitor Vercel dashboard for:
  - Build times
  - Deployment success rates
  - Page load times
  - Core Web Vitals

## 🔧 Maintenance Tasks

### Regular Checks
- [ ] Monitor error logs weekly
- [ ] Check API response times
- [ ] Verify SnapTrade API status
- [ ] Update dependencies as needed
- [ ] Monitor Render/Vercel usage limits

### Scaling Considerations
- [ ] Monitor Render free tier usage (750 hours/month)
- [ ] Monitor Vercel bandwidth usage
- [ ] Consider upgrading to paid plans if needed

## 📞 Support Resources

- **Render Support**: [docs.render.com](https://docs.render.com)
- **Vercel Support**: [vercel.com/docs](https://vercel.com/docs)
- **SnapTrade Support**: [snaptrade.com/docs](https://snaptrade.com/docs)
- **GitHub Issues**: Create issues in your repository

## 🎯 Production URLs

- **Frontend**: https://portfolio-volatility.vercel.app
- **Backend**: https://portfolio-volatility-backend.onrender.com
- **API Docs**: https://portfolio-volatility-backend.onrender.com/docs
- **GitHub**: https://github.com/justinsane/portfolio_volatility

---

**Last Updated**: $(date)
**Status**: Ready for Production Testing
