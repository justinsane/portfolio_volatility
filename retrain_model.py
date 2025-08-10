#!/usr/bin/env python3
"""
Convenient script to retrain the portfolio volatility model
"""

import pandas as pd
import sys
import os
from datetime import datetime

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.simple_model_trainer import PortfolioVolatilityTrainer

def retrain_model(portfolio_csv=None, months_back=18):
    """
    Retrain the portfolio volatility model with fresh data
    
    Args:
        portfolio_csv: Path to portfolio CSV (defaults to sample_portfolio.csv)
        months_back: How many months of historical data to use
    """
    
    print("🔄 RETRAINING PORTFOLIO VOLATILITY MODEL")
    print("=" * 50)
    
    # Use provided portfolio or default
    if portfolio_csv is None:
        portfolio_csv = "data/sample_portfolio.csv"
    
    # Check if we should use a more diverse training portfolio
    if not os.path.exists(portfolio_csv):
        print(f"📝 Creating comprehensive training portfolio...")
        
        # Create a diverse portfolio for better training
        training_portfolio = pd.DataFrame({
            'Ticker': [
                'SPY',   # S&P 500 (large cap)
                'QQQ',   # NASDAQ (tech heavy)
                'IWM',   # Russell 2000 (small cap)
                'VEA',   # International developed
                'VWO',   # Emerging markets
                'BND',   # Total bond market
                'GLD',   # Gold
                'VNQ'    # REITs
            ],
            'Weight': [0.25, 0.15, 0.10, 0.15, 0.10, 0.15, 0.05, 0.05]
        })
        
        os.makedirs(os.path.dirname(portfolio_csv), exist_ok=True)
        training_portfolio.to_csv(portfolio_csv, index=False)
        print(f"✅ Created diverse training portfolio: {portfolio_csv}")
    
    # Load portfolio
    portfolio_df = pd.read_csv(portfolio_csv)
    print(f"📊 Training Portfolio ({len(portfolio_df)} assets):")
    for _, row in portfolio_df.iterrows():
        print(f"   {row['Ticker']}: {row['Weight']:.1%}")
    
    # Initialize trainer
    trainer = PortfolioVolatilityTrainer()
    
    try:
        # Fetch historical data
        print(f"\n📈 Fetching {months_back} months of historical data...")
        start_time = datetime.now()
        
        historical_data = trainer.fetch_historical_data(portfolio_df, months_back=months_back)
        
        fetch_time = (datetime.now() - start_time).total_seconds()
        print(f"✅ Fetched {len(historical_data)} days of data in {fetch_time:.1f} seconds")
        
        if len(historical_data) < 60:
            print(f"⚠️ Warning: Only {len(historical_data)} days available")
            print(f"   Consider using more months or different assets")
            
            # Try with more reliable assets
            reliable_portfolio = pd.DataFrame({
                'Ticker': ['SPY', 'BND', 'GLD'],
                'Weight': [0.7, 0.25, 0.05]
            })
            
            print(f"🔄 Trying with reliable assets...")
            historical_data = trainer.fetch_historical_data(reliable_portfolio, months_back=months_back)
            
            if len(historical_data) < 60:
                print(f"❌ Still insufficient data. Check network connection.")
                return False
        
        # Train model
        print(f"\n🤖 Training Random Forest model...")
        train_start = datetime.now()
        
        results = trainer.train_model(historical_data)
        
        train_time = (datetime.now() - train_start).total_seconds()
        print(f"✅ Training completed in {train_time:.1f} seconds")
        
        # Display results
        print(f"\n📊 Training Results:")
        print(f"   Training RMSE: {results['train_rmse']:.4f}")
        print(f"   Test RMSE: {results['test_rmse']:.4f}")
        print(f"   Training samples: {results['train_samples']}")
        print(f"   Test samples: {results['test_samples']}")
        
        # Feature importance
        print(f"\n🎯 Top 5 Most Important Features:")
        for i, (feature, importance) in enumerate(results['feature_importance'][:5], 1):
            print(f"   {i}. {feature}: {importance:.3f}")
        
        # Save model with timestamp backup
        model_path = "model/portfolio_volatility_model.pkl"
        backup_path = f"model/portfolio_volatility_model_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pkl"
        
        # Backup existing model if it exists
        if os.path.exists(model_path):
            os.makedirs(os.path.dirname(backup_path), exist_ok=True)
            import shutil
            shutil.copy2(model_path, backup_path)
            print(f"💾 Backed up previous model to: {backup_path}")
        
        # Save new model
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        trainer.save_model(model_path)
        print(f"✅ New model saved to: {model_path}")
        
        # Test the new model
        print(f"\n🧪 Testing new model...")
        prediction = trainer.predict_volatility(portfolio_df)
        
        print(f"🎯 Test Prediction:")
        print(f"   Volatility: {prediction['interpretation']['annual_volatility_pct']}")
        print(f"   Risk Level: {prediction['interpretation']['risk_level']}")
        
        # Test integration with enhanced model
        print(f"\n🚀 Testing enhanced model integration...")
        try:
            from utils.model_predict import predict_volatility
            
            enhanced_result = predict_volatility(portfolio_df, forecast_days=20)
            print(f"✅ Enhanced integration working:")
            print(f"   Enhanced Volatility: {enhanced_result['predicted_volatility'][0]:.1%}")
            print(f"   Model Type: {enhanced_result['model_type']}")
            
            if 'enhancement_data' in enhanced_result:
                coverage = enhanced_result['enhancement_data']['coverage_analysis']['coverage_by_count']
                confidence = enhanced_result['enhancement_data']['overall_confidence']
                print(f"   Asset Coverage: {coverage:.1%}")
                print(f"   Confidence: {confidence}")
        
        except Exception as e:
            print(f"⚠️ Enhanced model integration issue: {e}")
        
        print(f"\n✅ MODEL RETRAINING COMPLETED!")
        print("=" * 50)
        print("🎯 Your model is now updated with the latest data")
        print("🔄 Restart your API server to use the new model")
        
        return True
        
    except Exception as e:
        print(f"❌ Retraining failed: {e}")
        print(f"💡 Possible solutions:")
        print(f"   - Check internet connection")
        print(f"   - Verify ticker symbols in portfolio")
        print(f"   - Try with fewer months of data")
        
        return False

def quick_retrain():
    """Quick retrain with minimal data"""
    print("🚀 Quick Model Retrain (6 months data)...")
    
    # Very reliable portfolio
    quick_portfolio = pd.DataFrame({
        'Ticker': ['SPY', 'BND'],
        'Weight': [0.8, 0.2]
    })
    
    quick_portfolio.to_csv("data/quick_portfolio.csv", index=False)
    return retrain_model("data/quick_portfolio.csv", months_back=6)

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Retrain portfolio volatility model')
    parser.add_argument('--portfolio', help='Path to portfolio CSV file')
    parser.add_argument('--months', type=int, default=18, help='Months of historical data to use')
    parser.add_argument('--quick', action='store_true', help='Quick retrain with minimal data')
    
    args = parser.parse_args()
    
    if args.quick:
        success = quick_retrain()
    else:
        success = retrain_model(args.portfolio, args.months)
    
    sys.exit(0 if success else 1)