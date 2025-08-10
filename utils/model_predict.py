import logging
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split # Still useful for splitting historical data for evaluation
from sklearn.metrics import mean_squared_error # To evaluate model performance (RMSE)
import yfinance as yf
from datetime import datetime, timedelta
from utils.simple_model_trainer import PortfolioVolatilityTrainer

# Setup logging for this module
logger = logging.getLogger(__name__)
logger.setLevel(logging.WARNING)  # Reduce verbosity for API usage

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
        # Try enhanced model first
        from utils.volatility_model_enhancer import VolatilityModelEnhancer
        
        # Initialize enhanced model (API keys optional - will work without them)
        enhancer = VolatilityModelEnhancer()
        
        logger.info("Using enhanced volatility model with improved asset coverage")
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
        
    except ImportError as e:
        logger.warning(f"Enhanced model not available: {e}. Falling back to original model.")
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
        # Initialize the new trainer
        trainer = PortfolioVolatilityTrainer()
        
        # Try to load pre-trained model
        model_path = "model/portfolio_volatility_model.pkl"
        model_loaded = False
        
        try:
            trainer.load_model(model_path)
            model_loaded = True
            logger.info("Using pre-trained historical model")
        except Exception as e:
            logger.warning(f"No pre-trained model found at {model_path}: {e}")
            logger.info("Training new model on historical data...")
            
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