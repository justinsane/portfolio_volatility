#!/usr/bin/env python3
"""
Portfolio Volatility Predictor - FastAPI Backend
"""
import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import io
import json

# Import our custom modules
from utils.model_predict import predict_volatility
from utils.risk_analysis.risk_analyzer import RiskAnalyzer

# Initialize FastAPI app
app = FastAPI(
    title="Portfolio Volatility Predictor API",
    description="ML-powered portfolio volatility prediction with enhanced risk analysis",
    version="1.0.0"
)

# Configure CORS for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "https://portfolio-volatility.vercel.app",  # Vercel frontend
        "https://*.vercel.app",  # Any Vercel subdomain
        os.getenv("FRONTEND_URL", ""),  # Custom frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize risk analyzer
risk_analyzer = RiskAnalyzer()

@app.on_event("startup")
async def startup_event():
    """Startup event for the application."""
    print("🚀 Starting Portfolio Volatility Predictor...")
    print("📊 Models will be loaded on first request for optimal performance")
    print("🎯 API ready to receive requests!")

@app.get("/")
async def root():
    """API status and health check"""
    return {
        "message": "Portfolio Volatility Predictor API",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "predict": "/api/predict",
            "sample": "/sample",
            "docs": "/docs"
        }
    }

@app.get("/sample")
async def download_sample():
    """Download sample portfolio CSV file"""
    sample_path = "data/sample_portfolio.csv"
    if os.path.exists(sample_path):
        return FileResponse(
            path=sample_path,
            filename="sample_portfolio.csv",
            media_type="text/csv"
        )
    else:
        return JSONResponse(
            status_code=404,
            content={"error": "Sample file not found"}
        )

@app.post("/api/predict")
async def predict_api(file: UploadFile = File(...)):
    """API endpoint for volatility prediction - returns JSON only"""
    try:
        # Validate file type
        if not file.filename.endswith('.csv'):
            return JSONResponse(
                status_code=400,
                content={"error": "File must be a CSV file"}
            )
        
        # Read the file content
        content = await file.read()
        
        # Create a StringIO object from the content
        csv_string = io.StringIO(content.decode('utf-8'))
        
        # Read CSV from the StringIO object
        df = pd.read_csv(csv_string)
        
        # Validate required columns
        required_columns = ['Ticker', 'Weight']
        if not all(col in df.columns for col in required_columns):
            return JSONResponse(
                status_code=400,
                content={"error": f"CSV must contain columns: {required_columns}"}
            )
        
        # Get volatility prediction
        volatility_result = predict_volatility(df)
        
        # Get risk analysis
        risk_result = risk_analyzer.analyze_portfolio_risk(df)
        
        # Combine results
        combined_result = {
            **volatility_result,
            'risk_analysis': risk_result
        }
        
        return JSONResponse(content=combined_result)
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Error processing file: {str(e)}"}
        )

# Keep the old endpoint for backward compatibility during transition
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """Legacy endpoint - redirects to API endpoint"""
    return await predict_api(file)


# Initialize risk analyzer
risk_analyzer = RiskAnalyzer()

# --- Batch ticker metadata resolver ---


@app.post("/api/tickers/resolve")
async def resolve_tickers(payload: Dict = Body(...)):
    """Resolve tickers to basic metadata. Uses static mappings for now.
    This avoids repeated client-side lookups and standardizes names/categories.

    Request: { "tickers": ["SPY", "QQQ", ...] }
    Response: { "SPY": { ticker, name, assetClass, category, currency, exchange }, ... }
    """
    try:
        tickers: List[str] = [str(t).upper().strip() for t in payload.get("tickers", []) if t]
        if not tickers:
            return {}

        # Static ETF mapping baseline; extend with bonds, crypto, etc. later
        static_etfs = {
            "SPY": {"name": "SPDR S&P 500 ETF Trust", "category": "Large Cap"},
            "VOO": {"name": "Vanguard S&P 500 ETF", "category": "Large Cap"},
            "VTI": {"name": "Vanguard Total Stock Market ETF", "category": "Large Cap"},
            "QQQ": {"name": "Invesco QQQ Trust", "category": "Technology"},
            "IWM": {"name": "iShares Russell 2000 ETF", "category": "Small Cap"},
            "EFA": {"name": "iShares MSCI EAFE ETF", "category": "International"},
            "EEM": {"name": "iShares MSCI Emerging Markets ETF", "category": "Emerging Markets"},
            "BND": {"name": "Vanguard Total Bond Market ETF", "category": "Bond"},
            "AGG": {"name": "iShares Core U.S. Aggregate Bond ETF", "category": "Bond"},
            "GLD": {"name": "SPDR Gold Shares", "category": "Commodity"},
            "VNQ": {"name": "Vanguard Real Estate ETF", "category": "Real Estate"},
        }

        resolved: Dict[str, Dict] = {}

        for t in tickers:
            if t in static_etfs:
                info = static_etfs[t]
                resolved[t] = {
                    "ticker": t,
                    "name": info["name"],
                    "assetClass": "etf",
                    "category": info["category"],
                    "currency": "USD",
                    "exchange": None,
                }
            else:
                # Unknowns: return minimally useful info; client can enhance
                resolved[t] = {
                    "ticker": t,
                    "name": None,
                    "assetClass": "unknown",
                    "category": None,
                    "currency": "USD",
                    "exchange": None,
                }

        return JSONResponse(content=resolved)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
