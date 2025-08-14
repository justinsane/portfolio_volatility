#!/usr/bin/env python3
"""
Simple script to run the Portfolio Volatility Predictor app
"""
import os
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    # Get configuration from environment variables
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("ENVIRONMENT", "development") == "development"
    
    print("🚀 Starting Portfolio Volatility Predictor...")
    print(f"📊 Access the app at: http://{host}:{port}")
    print(f"📁 API docs at: http://{host}:{port}/docs")
    print("⚡ Press CTRL+C to stop")
    
    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=reload,
        reload_dirs=[".", "templates", "utils"] if reload else None
    )