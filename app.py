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
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import our custom modules
from utils.model_predict import predict_volatility
from utils.risk_analysis.risk_analyzer import RiskAnalyzer
from utils.snaptrade_utils import SnapTradeManager, generate_user_id

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

# Initialize SnapTrade manager
try:
    snaptrade_manager = SnapTradeManager()
    print("✅ SnapTrade manager initialized successfully")
except Exception as e:
    print(f"❌ Failed to initialize SnapTrade manager: {e}")
    snaptrade_manager = None

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

# --- Feedback endpoint ---

class FeedbackRequest(BaseModel):
    name: Optional[str] = None
    message: str

@app.post("/api/feedback")
async def submit_feedback(feedback: FeedbackRequest):
    """Submit feedback via email"""
    try:
        # Email configuration - only create if environment variables are set
        mail_username = os.getenv("MAIL_USERNAME")
        mail_password = os.getenv("MAIL_PASSWORD")
        mail_from = os.getenv("MAIL_FROM")
        
        if not all([mail_username, mail_password, mail_from]):
            return JSONResponse(
                status_code=500,
                content={"error": "Email configuration not set up. Please configure MAIL_USERNAME, MAIL_PASSWORD, and MAIL_FROM environment variables."}
            )
        
        email_config = ConnectionConfig(
            MAIL_USERNAME=mail_username,
            MAIL_PASSWORD=mail_password,
            MAIL_FROM=mail_from,
            MAIL_PORT=587,
            MAIL_SERVER="smtp.gmail.com",
            MAIL_STARTTLS=True,
            MAIL_SSL_TLS=False,
            USE_CREDENTIALS=True
        )
        
        fastmail = FastMail(email_config)
        
        # Prepare email content
        subject = "Portfolio Volatility Predictor - New Feedback"
        
        # Build email body
        body = f"""
New feedback received from Portfolio Volatility Predictor:

Name: {feedback.name or 'Anonymous'}
Message: {feedback.message}

---
Sent from Portfolio Volatility Predictor API
        """.strip()
        
        # Create message
        message = MessageSchema(
            subject=subject,
            recipients=[os.getenv("FEEDBACK_EMAIL", "test@gmail.com")],
            body=body,
            subtype="plain"
        )
        
        # Send email
        await fastmail.send_message(message)
        
        return JSONResponse(content={"message": "Feedback submitted successfully"})
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to send feedback: {str(e)}"}
        )

# --- SnapTrade API endpoints ---

class SnapTradeUserRequest(BaseModel):
    user_id: Optional[str] = None

class SnapTradeLoginRequest(BaseModel):
    user_id: str
    user_secret: str

class SnapTradeAccountRequest(BaseModel):
    user_id: str
    user_secret: str

class SnapTradePositionsRequest(BaseModel):
    user_id: str
    user_secret: str
    account_id: str

class SnapTradeConnectionRequest(BaseModel):
    user_id: str
    user_secret: str

class SnapTradeDeleteConnectionRequest(BaseModel):
    user_id: str
    user_secret: str
    authorization_id: str

@app.post("/api/snaptrade/register-user")
async def register_snaptrade_user(request: SnapTradeUserRequest):
    """Register a new user with SnapTrade"""
    try:
        if not snaptrade_manager:
            return JSONResponse(
                status_code=500,
                content={"error": "SnapTrade manager not initialized"}
            )
        
        # Generate user ID if not provided
        user_id = request.user_id or generate_user_id()
        
        # Register user with SnapTrade
        result = snaptrade_manager.register_user(user_id)
        
        if result["success"]:
            return JSONResponse(content={
                "success": True,
                "user_id": result["user_id"],
                "user_secret": result["user_secret"],
                "message": "User registered successfully"
            })
        else:
            return JSONResponse(
                status_code=400,
                content={"error": result["error"]}
            )
            
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to register user: {str(e)}"}
        )

@app.post("/api/snaptrade/login-url")
async def get_snaptrade_login_url(request: SnapTradeLoginRequest):
    """Generate SnapTrade connection portal URL"""
    try:
        if not snaptrade_manager:
            return JSONResponse(
                status_code=500,
                content={"error": "SnapTrade manager not initialized"}
            )
        
        # Generate login URL
        result = snaptrade_manager.get_login_url(
            user_id=request.user_id,
            user_secret=request.user_secret
        )
        
        if result["success"]:
            return JSONResponse(content={
                "success": True,
                "redirect_uri": result["redirect_uri"],
                "message": "Login URL generated successfully"
            })
        else:
            return JSONResponse(
                status_code=400,
                content={"error": result["error"]}
            )
            
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to generate login URL: {str(e)}"}
        )

@app.post("/api/snaptrade/accounts")
async def list_snaptrade_accounts(request: SnapTradeAccountRequest):
    """List connected SnapTrade accounts"""
    try:
        if not snaptrade_manager:
            return JSONResponse(
                status_code=500,
                content={"error": "SnapTrade manager not initialized"}
            )
        
        # List accounts
        result = snaptrade_manager.list_accounts(
            user_id=request.user_id,
            user_secret=request.user_secret
        )
        
        if result["success"]:
            return JSONResponse(content={
                "success": True,
                "accounts": result["accounts"],
                "count": result["count"],
                "message": f"Found {result['count']} accounts"
            })
        else:
            return JSONResponse(
                status_code=400,
                content={"error": result["error"]}
            )
            
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to list accounts: {str(e)}"}
        )

@app.post("/api/snaptrade/refresh-holdings")
async def refresh_snaptrade_holdings(request: SnapTradePositionsRequest):
    """Refresh holdings for a specific SnapTrade account"""
    try:
        if not snaptrade_manager:
            return JSONResponse(
                status_code=500,
                content={"error": "SnapTrade manager not initialized"}
            )
        
        # Refresh holdings
        result = snaptrade_manager.refresh_account_holdings(
            user_id=request.user_id,
            user_secret=request.user_secret,
            account_id=request.account_id
        )
        
        if result["success"]:
            return JSONResponse(content={
                "success": True,
                "message": "Holdings refreshed successfully"
            })
        else:
            return JSONResponse(
                status_code=400,
                content={"error": result["error"]}
            )
            
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to refresh holdings: {str(e)}"}
        )

@app.post("/api/snaptrade/positions")
async def get_snaptrade_positions(request: SnapTradePositionsRequest):
    """Get positions for a specific SnapTrade account"""
    try:
        if not snaptrade_manager:
            return JSONResponse(
                status_code=500,
                content={"error": "SnapTrade manager not initialized"}
            )
        
        # Get positions
        result = snaptrade_manager.get_account_positions(
            user_id=request.user_id,
            user_secret=request.user_secret,
            account_id=request.account_id
        )
        
        if result["success"]:
            # Transform positions to portfolio format
            portfolio_assets = snaptrade_manager.transform_positions_to_portfolio(
                result["positions"]
            )
            
            return JSONResponse(content={
                "success": True,
                "positions": result["positions"],
                "portfolio_assets": portfolio_assets,
                "count": result["count"],
                "message": f"Retrieved {result['count']} positions"
            })
        else:
            return JSONResponse(
                status_code=400,
                content={"error": result["error"]}
            )
            
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to get positions: {str(e)}"}
        )

@app.post("/api/snaptrade/connections")
async def list_snaptrade_connections(request: SnapTradeConnectionRequest):
    """List all brokerage connections for a user"""
    try:
        if not snaptrade_manager:
            return JSONResponse(
                status_code=500,
                content={"error": "SnapTrade manager not initialized"}
            )
        
        # List connections
        result = snaptrade_manager.list_brokerage_authorizations(
            user_id=request.user_id,
            user_secret=request.user_secret
        )
        
        if result["success"]:
            return JSONResponse(content={
                "success": True,
                "authorizations": result["authorizations"],
                "count": result["count"],
                "message": f"Found {result['count']} connections"
            })
        else:
            return JSONResponse(
                status_code=400,
                content={"error": result["error"]}
            )
            
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to list connections: {str(e)}"}
        )

@app.delete("/api/snaptrade/connections")
async def delete_snaptrade_connection(request: SnapTradeDeleteConnectionRequest):
    """Delete a specific brokerage connection"""
    try:
        if not snaptrade_manager:
            return JSONResponse(
                status_code=500,
                content={"error": "SnapTrade manager not initialized"}
            )
        
        # Delete connection
        result = snaptrade_manager.delete_brokerage_authorization(
            user_id=request.user_id,
            user_secret=request.user_secret,
            authorization_id=request.authorization_id
        )
        
        if result["success"]:
            return JSONResponse(content={
                "success": True,
                "message": result["message"]
            })
        else:
            return JSONResponse(
                status_code=400,
                content={"error": result["error"]}
            )
            
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to delete connection: {str(e)}"}
        )
