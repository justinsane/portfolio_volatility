#!/usr/bin/env python3
"""
Check the status of the portfolio volatility model
"""

import os
import sys
from datetime import datetime
import pandas as pd

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def check_model_status():
    """Check the current status of the volatility models"""
    
    print("🔍 MODEL STATUS CHECK")
    print("=" * 40)
    
    # Check if trained model exists
    model_path = "model/portfolio_volatility_model.pkl"
    
    if os.path.exists(model_path):
        # Get model file info
        stat_info = os.stat(model_path)
        file_size = stat_info.st_size / 1024  # KB
        mod_time = datetime.fromtimestamp(stat_info.st_mtime)
        
        print(f"✅ Trained Model: FOUND")
        print(f"   📁 Path: {model_path}")
        print(f"   📏 Size: {file_size:.1f} KB")
        print(f"   🕒 Last Modified: {mod_time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Test loading the model
        try:
            from utils.simple_model_trainer import PortfolioVolatilityTrainer
            trainer = PortfolioVolatilityTrainer()
            trainer.load_model(model_path)
            print(f"   ✅ Model loads successfully")
            
            # Test prediction
            test_portfolio = pd.DataFrame({
                'Ticker': ['SPY'], 
                'Weight': [1.0]
            })
            
            prediction = trainer.predict_volatility(test_portfolio)
            print(f"   🎯 Test Prediction: {prediction['interpretation']['annual_volatility_pct']}")
            
        except Exception as e:
            print(f"   ❌ Model loading failed: {e}")
    
    else:
        print(f"❌ Trained Model: NOT FOUND")
        print(f"   📁 Expected Path: {model_path}")
        print(f"   💡 Run: python train_model.py")
    
    print()
    
    # Check enhanced model components
    print(f"🚀 Enhanced Model Components:")
    
    enhanced_files = [
        "utils/enhanced_volatility_estimator.py",
        "utils/volatility_model_enhancer.py"
    ]
    
    for file_path in enhanced_files:
        if os.path.exists(file_path):
            print(f"   ✅ {os.path.basename(file_path)}")
        else:
            print(f"   ❌ {os.path.basename(file_path)} - MISSING")
    
    # Test enhanced model
    try:
        from utils.volatility_model_enhancer import VolatilityModelEnhancer
        enhancer = VolatilityModelEnhancer()
        print(f"   ✅ Enhanced model initializes successfully")
        
        # Test with known asset
        test_result = enhancer.get_enhanced_asset_volatility("AAPL", use_apis=False)
        print(f"   🎯 Test Asset (AAPL): {test_result['volatility']:.1%} ({test_result['confidence']} confidence)")
        
    except Exception as e:
        print(f"   ❌ Enhanced model failed: {e}")
    
    print()
    
    # Check API integration
    print(f"🔌 API Integration:")
    
    try:
        from utils.model_predict import predict_volatility
        
        test_portfolio = pd.DataFrame({
            'Ticker': ['AAPL', 'VTI'], 
            'Weight': [0.6, 0.4]
        })
        
        result = predict_volatility(test_portfolio, forecast_days=20)
        
        print(f"   ✅ Main API working")
        print(f"   🎯 Test Portfolio Volatility: {result['predicted_volatility'][0]:.1%}")
        print(f"   🤖 Model Type: {result['model_type']}")
        
        if 'enhancement_data' in result:
            coverage = result['enhancement_data']['coverage_analysis']['coverage_by_count']
            confidence = result['enhancement_data']['overall_confidence']
            print(f"   📊 Asset Coverage: {coverage:.1%}")
            print(f"   🎯 Confidence: {confidence}")
        
    except Exception as e:
        print(f"   ❌ API integration failed: {e}")
    
    print()
    
    # Check data files
    print(f"📊 Sample Data Files:")
    
    data_files = [
        "data/sample_portfolio.csv",
        "data/sample_bonds.csv",
        "data/sample_portfolio_btc_1.csv"
    ]
    
    for file_path in data_files:
        if os.path.exists(file_path):
            try:
                df = pd.read_csv(file_path)
                print(f"   ✅ {os.path.basename(file_path)} ({len(df)} rows)")
            except:
                print(f"   ⚠️ {os.path.basename(file_path)} (corrupted)")
        else:
            print(f"   ❌ {os.path.basename(file_path)} - MISSING")
    
    print()
    
    # Recommendations
    print(f"🎯 RECOMMENDATIONS:")
    
    if not os.path.exists(model_path):
        print(f"   1. Train the base model: python train_model.py")
    else:
        mod_time = datetime.fromtimestamp(os.stat(model_path).st_mtime)
        days_old = (datetime.now() - mod_time).days
        
        if days_old > 30:
            print(f"   1. Consider retraining (model is {days_old} days old): python retrain_model.py")
        else:
            print(f"   1. ✅ Model is recent ({days_old} days old)")
    
    print(f"   2. Test with your portfolios using the enhanced API")
    print(f"   3. Consider adding API keys for better unknown asset coverage")
    
    # API key status
    try:
        from utils.enhanced_volatility_estimator import EnhancedVolatilityEstimator
        estimator = EnhancedVolatilityEstimator()
        
        if estimator.alpha_vantage_key:
            print(f"   4. ✅ Alpha Vantage API key configured")
        else:
            print(f"   4. 🔑 Add Alpha Vantage API key for enhanced accuracy")
        
        if estimator.fmp_key:
            print(f"   5. ✅ Financial Modeling Prep API key configured")
        else:
            print(f"   5. 🔑 Add Financial Modeling Prep API key for enhanced accuracy")
    
    except:
        pass

if __name__ == "__main__":
    check_model_status()