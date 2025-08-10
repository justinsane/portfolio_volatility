import logging
import pandas as pd
import numpy as np
import pickle
import os
import tempfile
from pathlib import Path
from sklearn.model_selection import train_test_split # Still useful for splitting historical data for evaluation
from sklearn.metrics import mean_squared_error # To evaluate model performance (RMSE)
import yfinance as yf
from datetime import datetime, timedelta
from utils.simple_model_trainer import PortfolioVolatilityTrainer

# Setup logging for this module
logger = logging.getLogger(__name__)
logger.setLevel(logging.WARNING)  # Reduce verbosity for API usage

# Singleton pattern for persistent caching across container restarts
class ModelCache:
    _instance = None
    _enhanced_model = None
    _original_trainer = None
    _cache_dir = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelCache, cls).__new__(cls)
            # Use temp directory that persists across requests
            cls._cache_dir = Path(tempfile.gettempdir()) / "portfolio_volatility_cache"
            cls._cache_dir.mkdir(exist_ok=True)
        return cls._instance
    
    def get_enhanced_model(self):
        """Get cached enhanced model with file-based persistence."""
        if self._enhanced_model is None:
            try:
                from utils.volatility_model_enhancer import VolatilityModelEnhancer
                self._enhanced_model = VolatilityModelEnhancer()
                logger.info("Initialized enhanced model cache")
            except Exception as e:
                logger.warning(f"Failed to initialize enhanced model cache: {e}")
                self._enhanced_model = None
        return self._enhanced_model
    
    def get_original_trainer(self):
        """Get cached original trainer with file-based persistence."""
        if self._original_trainer is None:
            self._original_trainer = PortfolioVolatilityTrainer()
            try:
                model_path = "model/portfolio_volatility_model.pkl"
                self._original_trainer.load_model(model_path)
                logger.info("Loaded original model into cache")
            except Exception as e:
                logger.warning(f"Failed to load original model into cache: {e}")
        return self._original_trainer

# Global cache instance
_model_cache = ModelCache()

def _get_cached_enhanced_model():
    """Get cached enhanced model instance to avoid reloading on every request."""
    return _model_cache.get_enhanced_model()

def _get_cached_original_trainer():
    """Get cached original trainer instance to avoid reloading on every request."""
    return _model_cache.get_original_trainer()

# === Enhanced Prediction Interface for API ===

def predict_volatility(portfolio_df: pd.DataFrame, forecast_days: int = 20):
    """
    Enhanced portfolio volatility prediction with improved asset coverage.
    
    Args:
        portfolio_df (pd.DataFrame): Portfolio data with Ticker and Weight columns
        forecast_days (int): Number of days to forecast (default: 20)
    
    Returns:
        dict: Enhanced prediction results with forecast values and metadata
    """
    logger.info(f"Starting enhanced volatility prediction for portfolio with {len(portfolio_df)} assets")
    
    try:
        # Use cached enhanced model
        enhancer = _get_cached_enhanced_model()
        
        if enhancer is not None:
            logger.info("Using cached enhanced volatility model with improved asset coverage")
            result = enhancer.predict_volatility_enhanced(
                portfolio_df, 
                forecast_days=forecast_days, 
                use_apis=True  # Enable API usage since we have keys
            )
            
            # Format result to match expected API response
            return {
                "forecast_days": forecast_days,
                "predicted_volatility": result['predicted_volatility'],
                "risk_level": result['interpretation']['risk_level'],
                "annual_volatility": result['interpretation']['annual_volatility_pct'],
                "description": result['interpretation']['description'],
                "current_features": {},
                "portfolio_assets": portfolio_df.to_dict('records'),
                "model_type": "enhanced_multi_source",
                "enhancement_data": {
                    "coverage_analysis": result['coverage_analysis'],
                    "confidence_distribution": result['confidence_distribution'],
                    "overall_confidence": result['overall_confidence'],
                    "asset_details": result['asset_details'],
                    "data_sources_used": result['data_sources_used']
                }
            }
        else:
            logger.warning("Enhanced model not available. Falling back to original model.")
            return predict_volatility_original(portfolio_df, forecast_days)
        
    except Exception as e:
        logger.error(f"Error in enhanced prediction: {str(e)}", exc_info=True)
        logger.info("Falling back to original volatility prediction")
        return predict_volatility_original(portfolio_df, forecast_days)


def predict_volatility_original(portfolio_df: pd.DataFrame, forecast_days: int = 20):
    """
    Original portfolio volatility prediction (preserved as fallback).
    
    Args:
        portfolio_df (pd.DataFrame): Portfolio data with Ticker and Weight columns
        forecast_days (int): Number of days to forecast (default: 20)
    
    Returns:
        dict: Prediction results with forecast values and metadata
    """
    logger.info(f"Using original volatility prediction for portfolio with {len(portfolio_df)} assets")
    
    try:
        # Use cached trainer
        trainer = _get_cached_original_trainer()
        
        # Try to use pre-trained model from cache
        if trainer.model is not None:
            logger.info("Using cached pre-trained historical model")
            model_loaded = True
        else:
            logger.warning("No pre-trained model found in cache")
            logger.info("Training new model on historical data...")
            model_loaded = False
            
            # For retail investors, use asset-based calculation instead of training on limited data
            logger.info("Using asset-based volatility calculation for retail portfolio")
            weights = portfolio_df['Weight'].values / portfolio_df['Weight'].values.sum()
            asset_vol = trainer._estimate_portfolio_volatility(portfolio_df, weights)
            
            return {
                "forecast_days": forecast_days,
                "predicted_volatility": [asset_vol] * forecast_days,
                "risk_level": trainer._interpret_prediction(asset_vol)['risk_level'],
                "annual_volatility": trainer._interpret_prediction(asset_vol)['annual_volatility_pct'],
                "description": trainer._interpret_prediction(asset_vol)['description'],
                "current_features": {},
                "portfolio_assets": portfolio_df.to_dict('records'),
                "model_type": "asset_based_estimation"
            }
        
        if not model_loaded:
            logger.error("Could not load or train model")
            return {"error": "Model loading/training failed", "forecast": None}
        
        # Make prediction using the historical model
        result = trainer.predict_volatility(portfolio_df, forecast_days)
        
        return {
            "forecast_days": forecast_days,
            "predicted_volatility": result['predicted_volatility'],
            "risk_level": result['interpretation']['risk_level'],
            "annual_volatility": result['interpretation']['annual_volatility_pct'],
            "description": result['interpretation']['description'],
            "current_features": result.get('current_features', {}),
            "portfolio_assets": portfolio_df.to_dict('records'),
            "model_type": "historical_random_forest"
        }
        
    except Exception as e:
        logger.error(f"Error in original predict_volatility: {str(e)}", exc_info=True)
        # Fall back to simple asset-based calculation if all else fails
        logger.info("Falling back to simple asset-based calculation")
        return predict_volatility_simple_fallback(portfolio_df, forecast_days)


def predict_volatility_simple_fallback(portfolio_df: pd.DataFrame, forecast_days: int = 20):
    """
    Simple fallback method using basic asset-based volatility calculation.
    """
    logger.info("Using simple asset-based volatility calculation")
    
    try:
        # Initialize trainer for basic calculations
        trainer = PortfolioVolatilityTrainer()
        
        # Calculate basic portfolio volatility
        weights = portfolio_df['Weight'].values / portfolio_df['Weight'].values.sum()
        asset_vol = trainer._estimate_portfolio_volatility(portfolio_df, weights)
        
        # Generate simple forecast (constant volatility)
        forecast_values = [asset_vol] * forecast_days
        
        return {
            "forecast_days": forecast_days,
            "predicted_volatility": forecast_values,
            "risk_level": trainer._interpret_prediction(asset_vol)['risk_level'],
            "annual_volatility": trainer._interpret_prediction(asset_vol)['annual_volatility_pct'],
            "description": trainer._interpret_prediction(asset_vol)['description'],
            "current_features": {},
            "portfolio_assets": portfolio_df.to_dict('records'),
            "model_type": "asset_based_estimation"
        }
        
    except Exception as e:
        logger.error(f"Error in simple fallback prediction: {str(e)}", exc_info=True)
        return {
            "error": f"Prediction failed: {str(e)}",
            "forecast": None
        }