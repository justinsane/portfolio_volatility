#!/usr/bin/env python3
"""
Train the portfolio volatility model using historical data
"""

import pandas as pd
import sys
import os
from datetime import datetime

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.simple_model_trainer import PortfolioVolatilityTrainer

def train_portfolio_model():
    """Train the portfolio volatility model with sample data"""
    
    print("🤖 TRAINING PORTFOLIO VOLATILITY MODEL")
    print("=" * 50)
    
    # Use sample portfolio for training
    portfolio_csv_path = "data/sample_portfolio.csv"
    
    try:
        # Load portfolio
        portfolio_df = pd.read_csv(portfolio_csv_path)
        print(f"📊 Training Portfolio ({len(portfolio_df)} assets):")
        print(portfolio_df)
        
        # Initialize trainer
        trainer = PortfolioVolatilityTrainer()
        
        # Fetch historical data (last 18 months for good training data)
        print(f"\n1️⃣ Fetching historical data (18 months)...")
        historical_data = trainer.fetch_historical_data(portfolio_df, months_back=18)
        
        if len(historical_data) < 30:
            print(f"⚠️ Warning: Only {len(historical_data)} days of data available")
            print("   Consider using a longer time period or different assets")
        else:
            print(f"✅ Successfully fetched {len(historical_data)} days of historical data")
        
        # Train model
        print(f"\n2️⃣ Training Random Forest model...")
        results = trainer.train_model(historical_data)
        
        print(f"✅ Model training completed!")
        print(f"   - Training RMSE: {results['train_rmse']:.4f}")
        print(f"   - Test RMSE: {results['test_rmse']:.4f}")
        print(f"   - Training samples: {results['train_samples']}")
        print(f"   - Test samples: {results['test_samples']}")
        
        # Show feature importance
        print(f"\n📈 Top 5 Most Important Features:")
        for i, (feature, importance) in enumerate(results['feature_importance'][:5], 1):
            print(f"   {i}. {feature}: {importance:.3f}")
        
        # Save model
        print(f"\n3️⃣ Saving trained model...")
        model_path = "model/portfolio_volatility_model.pkl"
        
        # Ensure model directory exists
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        
        trainer.save_model(model_path)
        print(f"✅ Model saved to: {model_path}")
        
        # Test prediction with the training portfolio
        print(f"\n4️⃣ Testing prediction on training portfolio...")
        prediction = trainer.predict_volatility(portfolio_df)
        
        print(f"🎯 Predicted Volatility: {prediction['interpretation']['annual_volatility_pct']}")
        print(f"🏷️ Risk Level: {prediction['interpretation']['risk_level']}")
        print(f"📝 Description: {prediction['interpretation']['description']}")
        
        # Test with enhanced model
        print(f"\n5️⃣ Testing enhanced model integration...")
        try:
            from utils.model_predict import predict_volatility
            
            enhanced_result = predict_volatility(portfolio_df, forecast_days=20)
            print(f"🚀 Enhanced Model Volatility: {enhanced_result['predicted_volatility'][0]:.1%}")
            print(f"🤖 Model Type: {enhanced_result['model_type']}")
            
            if 'enhancement_data' in enhanced_result:
                coverage = enhanced_result['enhancement_data']['coverage_analysis']['coverage_by_count']
                confidence = enhanced_result['enhancement_data']['overall_confidence']
                print(f"📊 Asset Coverage: {coverage:.1%}")
                print(f"🎯 Overall Confidence: {confidence}")
        
        except Exception as e:
            print(f"⚠️ Enhanced model test failed: {e}")
        
        print(f"\n✅ MODEL TRAINING COMPLETED SUCCESSFULLY!")
        print("=" * 50)
        print("🎯 Next Steps:")
        print("1. Your model is now trained and saved")
        print("2. The API will now use the trained model + enhanced features") 
        print("3. Test with different portfolios to validate performance")
        
        return trainer, results
        
    except FileNotFoundError:
        print(f"❌ Portfolio file not found: {portfolio_csv_path}")
        print("📝 Creating a sample portfolio for training...")
        
        # Create a sample portfolio for training
        sample_portfolio = pd.DataFrame({
            'Ticker': ['AAPL', 'MSFT', 'VTI', 'BND'],
            'Weight': [0.3, 0.25, 0.3, 0.15]
        })
        
        sample_portfolio.to_csv(portfolio_csv_path, index=False)
        print(f"✅ Created sample portfolio: {portfolio_csv_path}")
        print("🔄 Restarting training with sample portfolio...")
        
        return train_portfolio_model()  # Recursive call with new sample
        
    except Exception as e:
        print(f"❌ Training failed: {e}")
        print(f"💡 This might be due to:")
        print(f"   - Network issues (can't fetch historical data)")
        print(f"   - Invalid tickers in portfolio") 
        print(f"   - Insufficient historical data")
        
        # Try with a more robust portfolio
        print(f"\n🔄 Trying with a robust sample portfolio...")
        robust_portfolio = pd.DataFrame({
            'Ticker': ['SPY', 'QQQ', 'BND'],  # Very common, reliable tickers
            'Weight': [0.6, 0.3, 0.1]
        })
        
        try:
            trainer = PortfolioVolatilityTrainer()
            historical_data = trainer.fetch_historical_data(robust_portfolio, months_back=12)
            
            if len(historical_data) > 30:
                results = trainer.train_model(historical_data)
                trainer.save_model("model/portfolio_volatility_model.pkl")
                print(f"✅ Backup training successful with robust portfolio!")
                return trainer, results
            else:
                print(f"❌ Still insufficient data. Check internet connection.")
                return None, None
                
        except Exception as backup_error:
            print(f"❌ Backup training also failed: {backup_error}")
            return None, None

def quick_train():
    """Quick training function for immediate use"""
    print("🚀 Quick Model Training...")
    
    # Simple portfolio with very common tickers
    portfolio = pd.DataFrame({
        'Ticker': ['SPY', 'BND'],  # Market + Bonds
        'Weight': [0.8, 0.2]
    })
    
    trainer = PortfolioVolatilityTrainer()
    
    try:
        # Get 12 months of data (should be sufficient)
        print("Fetching 12 months of historical data...")
        historical_data = trainer.fetch_historical_data(portfolio, months_back=12)
        
        print(f"Training on {len(historical_data)} days of data...")
        results = trainer.train_model(historical_data)
        
        # Ensure model directory exists
        os.makedirs("model", exist_ok=True)
        trainer.save_model("model/portfolio_volatility_model.pkl")
        
        print("✅ Quick training completed!")
        return True
        
    except Exception as e:
        print(f"❌ Quick training failed: {e}")
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Train portfolio volatility model')
    parser.add_argument('--quick', action='store_true', help='Quick training with minimal data')
    args = parser.parse_args()
    
    if args.quick:
        success = quick_train()
        sys.exit(0 if success else 1)
    else:
        trainer, results = train_portfolio_model()
        sys.exit(0 if trainer is not None else 1)