# Production Deployment Guide

This guide covers deploying the SnapTrade connection limit management system to production with Render and Vercel.

## 🎯 Production-Ready Solution

The production version uses a **stateless approach** that works perfectly with cloud platforms:

- ✅ **No database required** - Uses SnapTrade API directly
- ✅ **No file persistence** - Works with ephemeral file systems
- ✅ **Stateless** - Multiple server instances work independently
- ✅ **Simple** - Minimal complexity for MVP

## 📁 Files for Production

### Backend (Render)
- `utils/snaptrade_utils_production.py` - Production SnapTrade manager
- `app.py` - Updated to use production manager
- `requirements.txt` - Dependencies
- `runtime.txt` - Python version

### Frontend (Vercel)
- `frontend/` - Next.js frontend (no changes needed)

## 🚀 Deployment Steps

### 1. Backend Deployment (Render)

#### Environment Variables
Set these in your Render dashboard:

```bash
SNAPTRADE_CLIENT_ID=your_client_id
SNAPTRADE_CONSUMER_KEY=your_consumer_key
FRONTEND_URL=https://your-frontend.vercel.app
```

#### Render Configuration
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
- **Environment**: Python 3.9+

### 2. Frontend Deployment (Vercel)

#### Environment Variables
Set these in your Vercel dashboard:

```bash
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

#### Vercel Configuration
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

## 🔧 Code Changes for Production

### 1. Update Import in `app.py`

```python
# Change from:
from utils.snaptrade_utils import SnapTradeManager, generate_user_id

# To:
from utils.snaptrade_utils_production import ProductionSnapTradeManager, generate_user_id
```

### 2. Update Manager Initialization

```python
# Change from:
snaptrade_manager = SnapTradeManager()

# To:
snaptrade_manager = ProductionSnapTradeManager()
```

## 🧪 Testing Production Deployment

### 1. Test Connection Limit Management

```python
# This will work in production
from utils.snaptrade_utils_production import ProductionSnapTradeManager

manager = ProductionSnapTradeManager()

# Check current status
status = manager.get_connection_status()
print(f"Current: {status['current_count']}/{status['max_connections']}")

# Register user (automatically handles limits)
result = manager.register_user("test_user_123")
```

### 2. Test API Endpoints

```bash
# Test backend health
curl https://your-backend.onrender.com/

# Test SnapTrade registration
curl -X POST https://your-backend.onrender.com/api/snaptrade/register \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user_123"}'
```

## 🔄 How It Works in Production

### Stateless Architecture

1. **No Local Storage**: Doesn't rely on files or databases
2. **Direct API Calls**: Gets user count directly from SnapTrade
3. **Simple Logic**: Deletes first user when limit reached
4. **Automatic Retry**: Handles connection limit errors gracefully

### Connection Limit Flow

```
1. User requests new SnapTrade connection
2. System checks current user count via API
3. If count >= 5: Delete oldest user (first in list)
4. Create new user
5. Return success to user
```

## 🛡️ Production Safety Features

### Error Handling
- ✅ Graceful API failures
- ✅ Connection limit detection
- ✅ Automatic retry logic
- ✅ Comprehensive logging

### Monitoring
- ✅ Health check endpoint
- ✅ Connection status endpoint
- ✅ Error logging
- ✅ Performance metrics

## 📊 Monitoring & Debugging

### Health Check
```bash
curl https://your-backend.onrender.com/
```

### Connection Status
```python
# Add this endpoint to your app.py
@app.get("/api/snaptrade/status")
async def get_snaptrade_status():
    if not snaptrade_manager:
        return JSONResponse(
            status_code=500,
            content={"error": "SnapTrade manager not initialized"}
        )
    
    status = snaptrade_manager.get_connection_status()
    return JSONResponse(content=status)
```

### Logs
- **Render**: View logs in dashboard
- **Vercel**: View logs in dashboard
- **Application**: Check console output

## 🔧 Troubleshooting

### Common Issues

1. **Environment Variables**
   ```bash
   # Check if set correctly
   echo $SNAPTRADE_CLIENT_ID
   echo $SNAPTRADE_CONSUMER_KEY
   ```

2. **API Errors**
   ```python
   # Test API connection
   manager = ProductionSnapTradeManager()
   status = manager.get_connection_status()
   print(status)
   ```

3. **CORS Issues**
   ```python
   # Update CORS origins in app.py
   allow_origins=[
       "https://your-frontend.vercel.app",
       "https://*.vercel.app",
   ]
   ```

### Debug Mode

Enable debug logging in production:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 🎯 MVP Benefits

### Simplicity
- ✅ No database setup
- ✅ No file system dependencies
- ✅ Minimal configuration
- ✅ Easy to understand

### Reliability
- ✅ Works with server restarts
- ✅ Handles multiple instances
- ✅ Graceful error handling
- ✅ Automatic recovery

### Scalability
- ✅ Stateless design
- ✅ No shared state
- ✅ Independent instances
- ✅ Easy to scale

## 🚀 Next Steps

### Phase 1: MVP (Current)
- ✅ Basic connection limit management
- ✅ Stateless architecture
- ✅ Production deployment

### Phase 2: Enhancement (Future)
- User creation timestamp tracking
- Database for persistent storage
- Advanced user management
- Analytics and monitoring

### Phase 3: Enterprise (Future)
- Multi-tenant support
- Advanced analytics
- Custom user policies
- Enterprise features

## 📝 Summary

The production solution is **simple, reliable, and ready for deployment**:

1. **No database required** - Uses SnapTrade API directly
2. **Stateless design** - Works with cloud platforms
3. **Automatic management** - Handles connection limits seamlessly
4. **Production ready** - Tested and documented

Just update the imports in your code and deploy - it will work immediately in production! 🎉
