#!/usr/bin/env python3
"""
Simple script to run the Portfolio Volatility Predictor app
"""
import uvicorn

if __name__ == "__main__":
    print("🚀 Starting Portfolio Volatility Predictor...")
    print("📊 Access the app at: http://localhost:8000")
    print("📁 API docs at: http://localhost:8000/docs")
    print("⚡ Press CTRL+C to stop")
    
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[".", "templates", "utils"]
    )