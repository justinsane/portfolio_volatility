"""
Lightweight Volatility Predictor - Optimized for Render Free Tier
Uses simple calculations instead of heavy ML models for better performance.
"""

import pandas as pd
import numpy as np
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

class SimpleVolatilityPredictor:
    """Lightweight volatility predictor optimized for free tier performance."""
    
    def __init__(self):
        # Simple volatility estimates for common assets
        self.volatility_map = {
            # Major ETFs
            'SPY': 0.15, 'VOO': 0.15, 'VTI': 0.16, 'QQQ': 0.20, 'IWM': 0.22,
            'EFA': 0.18, 'EEM': 0.24, 'BND': 0.04, 'AGG': 0.04, 'TLT': 0.12,
            
            # Major Stocks
            'AAPL': 0.25, 'MSFT': 0.22, 'GOOGL': 0.28, 'AMZN': 0.30, 'TSLA': 0.45,
            'META': 0.35, 'NVDA': 0.40, 'NFLX': 0.35, 'CRM': 0.32, 'ADBE': 0.28,
            
            # Financial
            'JPM': 0.28, 'BAC': 0.32, 'WFC': 0.30, 'GS': 0.35, 'V': 0.22, 'MA': 0.24,
            
            # Healthcare
            'JNJ': 0.18, 'PFE': 0.22, 'UNH': 0.20, 'LLY': 0.28, 'ABBV': 0.25,
            
            # Energy
            'XOM': 0.35, 'CVX': 0.32, 'COP': 0.40,
            
            # Utilities (Low Vol)
            'NEE': 0.18, 'DUK': 0.16, 'SO': 0.15, 'D': 0.17,
            
            # Consumer Staples (Low Vol)
            'PG': 0.16, 'KO': 0.18, 'PEP': 0.17, 'WMT': 0.20, 'COST': 0.22,
            
            # Mutual Funds
            'VTSAX': 0.16, 'VTIAX': 0.18, 'VBTLX': 0.04, 'VTSMX': 0.16,
            'SWTSX': 0.16, 'SWISX': 0.18, 'SWAGX': 0.04,
            
            # Crypto
            'BTC': 0.70, 'ETH': 0.75, 'ADA': 0.80, 'DOT': 0.85,
        }
        
        # Asset type patterns for classification
        self.asset_patterns = {
            'bond': ['BND', 'AGG', 'TLT', 'IEF', 'SHY', 'VBTLX', 'SWAGX'],
            'etf': ['SPY', 'VOO', 'VTI', 'QQQ', 'IWM', 'EFA', 'EEM'],
            'mutual_fund': ['VTSAX', 'VTIAX', 'VTSMX', 'SWTSX', 'SWISX'],
            'crypto': ['BTC', 'ETH', 'ADA', 'DOT'],
            'stock': []  # Everything else
        }
    
    def classify_asset(self, ticker: str) -> str:
        """Classify asset type based on ticker."""
        ticker_upper = ticker.upper()
        
        for asset_type, patterns in self.asset_patterns.items():
            if ticker_upper in patterns:
                return asset_type
        
        # Default classification based on patterns
        if ticker_upper.endswith('X') and len(ticker_upper) >= 4:
            return 'mutual_fund'
        elif any(pattern in ticker_upper for pattern in ['BND', 'AGG', 'TLT', 'IEF']):
            return 'bond'
        elif any(pattern in ticker_upper for pattern in ['SPY', 'VOO', 'VTI', 'QQQ']):
            return 'etf'
        else:
            return 'stock'
    
    def estimate_volatility(self, ticker: str) -> float:
        """Estimate volatility for a given ticker."""
        ticker_upper = ticker.upper()
        
        # Check if we have a direct mapping
        if ticker_upper in self.volatility_map:
            return self.volatility_map[ticker_upper]
        
        # Estimate based on asset type
        asset_type = self.classify_asset(ticker_upper)
        
        type_volatilities = {
            'bond': 0.05,
            'etf': 0.18,
            'mutual_fund': 0.16,
            'crypto': 0.75,
            'stock': 0.25
        }
        
        return type_volatilities.get(asset_type, 0.25)
    
    def calculate_portfolio_volatility(self, portfolio_df: pd.DataFrame) -> Dict:
        """Calculate portfolio volatility using simple weighted average."""
        try:
            # Normalize weights to sum to 1
            total_weight = portfolio_df['Weight'].sum()
            if total_weight == 0:
                return self._error_response("Total weight cannot be zero")
            
            portfolio_df = portfolio_df.copy()
            portfolio_df['Weight'] = portfolio_df['Weight'] / total_weight
            
            # Calculate individual asset volatilities
            volatilities = []
            asset_details = []
            
            for _, row in portfolio_df.iterrows():
                ticker = row['Ticker'].upper()
                weight = row['Weight']
                volatility = self.estimate_volatility(ticker)
                
                volatilities.append(volatility)
                asset_details.append({
                    'ticker': ticker,
                    'weight': weight,
                    'volatility': volatility,
                    'asset_type': self.classify_asset(ticker)
                })
            
            # Simple weighted average volatility (no correlation adjustment for speed)
            portfolio_volatility = np.average(volatilities, weights=portfolio_df['Weight'])
            
            # Convert to annual percentage
            annual_volatility_pct = portfolio_volatility * 100
            
            # Determine risk level
            risk_level = self._determine_risk_level(annual_volatility_pct)
            
            # Generate description
            description = self._generate_description(risk_level, annual_volatility_pct)
            
            return {
                'success': True,
                'portfolio_volatility': portfolio_volatility,
                'annual_volatility_pct': f"{annual_volatility_pct:.1f}%",
                'risk_level': risk_level,
                'description': description,
                'asset_details': asset_details,
                'model_type': 'simple_weighted_average',
                'confidence': 'high'
            }
            
        except Exception as e:
            logger.error(f"Error in simple volatility calculation: {e}")
            return self._error_response(f"Calculation error: {str(e)}")
    
    def _determine_risk_level(self, volatility_pct: float) -> str:
        """Determine risk level based on volatility percentage."""
        if volatility_pct < 10:
            return "Very Low"
        elif volatility_pct < 15:
            return "Low"
        elif volatility_pct < 20:
            return "Moderate"
        elif volatility_pct < 30:
            return "High"
        else:
            return "Very High"
    
    def _generate_description(self, risk_level: str, volatility_pct: float) -> str:
        """Generate description based on risk level."""
        descriptions = {
            "Very Low": f"Conservative portfolio with very stable returns ({volatility_pct:.1f}% annual volatility). Suitable for risk-averse investors or those approaching retirement.",
            "Low": f"Low-risk portfolio with stable returns ({volatility_pct:.1f}% annual volatility). Good for conservative investors seeking steady growth.",
            "Moderate": f"Balanced portfolio with moderate risk ({volatility_pct:.1f}% annual volatility). Suitable for investors with medium-term investment horizons.",
            "High": f"Higher-risk portfolio with potential for significant returns ({volatility_pct:.1f}% annual volatility). Suitable for aggressive investors with long-term horizons.",
            "Very High": f"High-risk portfolio with potential for substantial returns ({volatility_pct:.1f}% annual volatility). Only suitable for very aggressive investors who can tolerate significant volatility."
        }
        return descriptions.get(risk_level, "Portfolio analysis completed.")
    
    def _error_response(self, message: str) -> Dict:
        """Generate error response."""
        return {
            'success': False,
            'error': message,
            'portfolio_volatility': 0.0,
            'annual_volatility_pct': "0.0%",
            'risk_level': "Unknown",
            'description': f"Error: {message}",
            'asset_details': [],
            'model_type': 'simple_weighted_average',
            'confidence': 'low'
        }
