import pandas as pd
import numpy as np
import yfinance as yf
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
import joblib
import os
import warnings

# Suppress yfinance warnings
warnings.filterwarnings('ignore', message='.*auto_adjust.*')
warnings.filterwarnings('ignore', message='.*YF.download.*')

class PortfolioVolatilityTrainer:
    def __init__(self):
        self.model = None
        self.feature_names = [
            'portfolio_returns_std_60d',   # 60-day portfolio volatility (3 months)
            'portfolio_returns_std_120d',  # 120-day portfolio volatility (6 months)  
            'vix_level',                   # Current VIX (fear index)
            'vix_change_20d',              # How VIX changed over 20 days
            'market_return_20d',           # How market performed over 20 days
            'portfolio_beta',              # How much portfolio moves with market
            'max_single_weight',           # Concentration risk
            'correlation_avg',             # How correlated holdings are
            'momentum_60d',                # Portfolio momentum over 60 days
            'rsi_30d',                     # 30-day RSI for smoother signals
        ]
    
    def fetch_historical_data(self, portfolio_df, months_back=36):
        """
        Fetch real historical data for portfolio and market.
        
        Args:
            portfolio_df: DataFrame with Ticker and Weight columns
            months_back: How many months of data to fetch
            
        Returns:
            DataFrame with historical features and target volatility
        """
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months_back * 30)
        
        # Get portfolio tickers and weights
        tickers = portfolio_df['Ticker'].tolist()
        weights = portfolio_df['Weight'].values
        weights = weights / weights.sum()  # Normalize weights
        
        print(f"Fetching {months_back} months of data for: {tickers}")
        
        # Fetch individual stock data
        stock_data = {}
        for ticker in tickers:
            try:
                data = yf.download(ticker, start=start_date, end=end_date, progress=False)
                if not data.empty:
                    # Handle multi-level columns from yfinance
                    if isinstance(data.columns, pd.MultiIndex):
                        # For single ticker, columns are like ('Close', 'AAPL')
                        close_col = [col for col in data.columns if col[0] == 'Close']
                        if close_col:
                            close_prices = data[close_col[0]]
                            stock_data[ticker] = close_prices
                            print(f"✓ Got {len(close_prices)} days for {ticker}")
                        else:
                            print(f"✗ No Close column found for {ticker}")
                    elif 'Close' in data.columns:
                        # Standard single-level columns
                        close_prices = data['Close']
                        stock_data[ticker] = close_prices
                        print(f"✓ Got {len(close_prices)} days for {ticker}")
                    else:
                        print(f"✗ No Close column found for {ticker}")
                else:
                    print(f"✗ No data for {ticker}")
            except Exception as e:
                print(f"✗ Error fetching {ticker}: {e}")
        
        # Fetch market data (VTI as proxy for total stock market)
        try:
            vti_df = yf.download('VTI', start=start_date, end=end_date, progress=False)
            if isinstance(vti_df.columns, pd.MultiIndex):
                close_col = [col for col in vti_df.columns if col[0] == 'Close'][0]
                vti_data = vti_df[close_col]
            else:
                vti_data = vti_df['Close']
            print(f"✓ Got {len(vti_data)} days for VTI")
        except Exception as e:
            print(f"✗ Error fetching VTI: {e}")
            vti_data = pd.Series()
        
        # Fetch VIX (fear index)
        try:
            vix_df = yf.download('^VIX', start=start_date, end=end_date, progress=False)
            if isinstance(vix_df.columns, pd.MultiIndex):
                close_col = [col for col in vix_df.columns if col[0] == 'Close'][0]
                vix_data = vix_df[close_col]
            else:
                vix_data = vix_df['Close']
            print(f"✓ Got {len(vix_data)} days for VIX")
        except Exception as e:
            print(f"✗ Error fetching VIX: {e}")
            vix_data = pd.Series()
        
        if len(stock_data) == 0:
            raise ValueError("No stock data fetched!")
        
        # Align all data to common dates
        if not stock_data:
            raise ValueError("No stock data was successfully fetched!")
        
        # Create DataFrame ensuring we have datetime index
        all_data = pd.DataFrame(stock_data)
        all_data = all_data.dropna()  # Remove days where any stock has missing data
        
        if all_data.empty:
            raise ValueError("All stock data is empty after removing NaN values!")
        
        # Calculate portfolio returns
        portfolio_returns = (all_data.pct_change() * weights).sum(axis=1)
        
        # Align market and VIX data
        vti_aligned = vti_data.reindex(all_data.index).ffill() if not vti_data.empty else pd.Series(index=all_data.index)
        vix_aligned = vix_data.reindex(all_data.index).ffill() if not vix_data.empty else pd.Series(index=all_data.index)
        
        print(f"Final dataset: {len(all_data)} trading days")
        
        return self._calculate_features(all_data, portfolio_returns, vti_aligned, vix_aligned, weights)
    
    def _calculate_features(self, price_data, portfolio_returns, vti_returns, vix_data, weights):
        """Calculate retail-friendly features from historical data."""
        
        features_df = pd.DataFrame(index=price_data.index)
        
        # 1. Portfolio volatility features (key predictor)
        features_df['portfolio_returns_std_60d'] = portfolio_returns.rolling(60).std() * np.sqrt(252)
        features_df['portfolio_returns_std_120d'] = portfolio_returns.rolling(120).std() * np.sqrt(252)
        
        # 2. Market sentiment (VIX)
        if not vix_data.empty:
            features_df['vix_level'] = vix_data
            features_df['vix_change_20d'] = vix_data.pct_change(20)
        else:
            # Fallback: estimate VIX from portfolio volatility
            features_df['vix_level'] = features_df['portfolio_returns_std_60d'] * 100
            features_df['vix_change_20d'] = features_df['vix_level'].pct_change(20)
        
        # 3. Market performance
        if not vti_returns.empty:
            vti_returns_calc = vti_returns.pct_change()
            features_df['market_return_20d'] = vti_returns_calc.rolling(20).sum()
        else:
            # Fallback: use average of portfolio stocks as market proxy
            market_proxy = price_data.mean(axis=1).pct_change()
            features_df['market_return_20d'] = market_proxy.rolling(20).sum()
        
        # 4. Portfolio characteristics
        features_df['max_single_weight'] = weights.max()  # Concentration risk
        
        # 5. Portfolio beta (how much it moves with market)
        portfolio_ret_20d = portfolio_returns.rolling(20).sum()
        if not vti_returns.empty:
            market_ret_20d = vti_returns.pct_change().rolling(20).sum()
        else:
            market_ret_20d = price_data.mean(axis=1).pct_change().rolling(20).sum()
        
        # Calculate rolling correlation as beta proxy
        beta_values = []
        for i in range(len(portfolio_ret_20d)):
            if i < 120:  # Need 120 days for stable correlation
                beta_values.append(1.0)  # Default beta
            else:
                try:
                    port_window = portfolio_ret_20d.iloc[i-120:i]
                    market_window = market_ret_20d.iloc[i-120:i]
                    correlation = port_window.corr(market_window)
                    beta_values.append(correlation if not np.isnan(correlation) else 1.0)
                except:
                    beta_values.append(1.0)
        
        features_df['portfolio_beta'] = beta_values
        
        # 6. Average correlation between holdings
        returns_matrix = price_data.pct_change()
        avg_corrs = []
        
        for i in range(len(features_df)):
            if i < 120:  # Need 120 days for stable correlation
                avg_corrs.append(0.5)
            else:
                try:
                    window_returns = returns_matrix.iloc[i-120:i]
                    corr_matrix = window_returns.corr()
                    # Get upper triangle correlations (excluding diagonal)
                    mask = np.triu(np.ones_like(corr_matrix, dtype=bool), k=1)
                    avg_corr = corr_matrix.values[mask].mean()
                    avg_corrs.append(avg_corr if not np.isnan(avg_corr) else 0.5)
                except:
                    avg_corrs.append(0.5)
        
        features_df['correlation_avg'] = avg_corrs
        
        # 7. Momentum
        features_df['momentum_60d'] = portfolio_returns.rolling(60).sum()
        
        # 8. RSI (Relative Strength Index) - 30-day for smoother signals
        delta = portfolio_returns
        gain = delta.where(delta > 0, 0).rolling(30).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(30).mean()
        rs = gain / loss
        features_df['rsi_30d'] = 100 - (100 / (1 + rs))
        
        # Target variable: Future volatility (what we want to predict)
        # Use next 20 days' volatility as target for long-term investors
        future_vol = portfolio_returns.rolling(20).std().shift(-20) * np.sqrt(252)
        features_df['target_volatility'] = future_vol
        
        # Clean data
        features_df = features_df.ffill().bfill()
        features_df = features_df.dropna()
        
        print(f"Features calculated for {len(features_df)} days")
        print(f"Feature columns: {list(features_df.columns)}")
        
        return features_df
    
    def train_model(self, historical_data):
        """
        Train the volatility prediction model.
        
        Args:
            historical_data: DataFrame with features and target_volatility
            
        Returns:
            dict: Training results with metrics
        """
        # Separate features and target
        X = historical_data[self.feature_names]
        y = historical_data['target_volatility']
        
        print(f"Training on {len(X)} samples with {len(self.feature_names)} features")
        
        # Split into train/test (80/20)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, shuffle=False  # Don't shuffle for time series
        )
        
        # Train Random Forest (good for retail use - interpretable)
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        
        self.model.fit(X_train, y_train)
        
        # Evaluate
        train_pred = self.model.predict(X_train)
        test_pred = self.model.predict(X_test)
        
        train_rmse = np.sqrt(mean_squared_error(y_train, train_pred))
        test_rmse = np.sqrt(mean_squared_error(y_test, test_pred))
        
        # Feature importance (what matters most)
        importance = list(zip(self.feature_names, self.model.feature_importances_))
        importance.sort(key=lambda x: x[1], reverse=True)
        
        results = {
            'train_rmse': train_rmse,
            'test_rmse': test_rmse,
            'feature_importance': importance,
            'train_samples': len(X_train),
            'test_samples': len(X_test)
        }
        
        print(f"Training RMSE: {train_rmse:.4f}")
        print(f"Test RMSE: {test_rmse:.4f}")
        print("\nMost important features:")
        for name, imp in importance[:5]:
            print(f"  {name}: {imp:.3f}")
        
        return results
    
    def predict_volatility(self, portfolio_df, days_ahead=20):
        """
        Predict portfolio volatility for the next few weeks (long-term focus).
        
        Args:
            portfolio_df: Current portfolio with Ticker and Weight
            days_ahead: How many days to predict (default: 20 for long-term investors)
            
        Returns:
            dict: Prediction results
        """
        if self.model is None:
            raise ValueError("Model not trained! Call train_model() first.")
        
        # Get current market features
        current_features = self._get_current_features(portfolio_df)
        
        # Calculate asset-based volatility estimate
        weights = portfolio_df['Weight'].values / portfolio_df['Weight'].values.sum()
        asset_based_vol = self._calculate_asset_volatility(portfolio_df, weights)
        
        # Use model prediction for standard portfolios, asset-based for edge cases
        if abs(current_features[0] - asset_based_vol) < 0.01 or asset_based_vol > 0.30 or asset_based_vol < 0.10:
            predicted_vol = asset_based_vol
            # Use standardized 1-year realized volatility wording to avoid confusion
            print(f"Using asset-based realized volatility (1y): {predicted_vol:.1%}")
        else:
            # Use model prediction for standard equity portfolios
            import pandas as pd
            features_df = pd.DataFrame([current_features], columns=self.feature_names)
            predicted_vol = self.model.predict(features_df)[0]
            print(f"Using model prediction: {predicted_vol:.1%}")
        
        # Create forecast array (simple approach: same volatility for all days)
        forecast = [predicted_vol] * days_ahead
        
        return {
            'forecast_days': days_ahead,
            'predicted_volatility': forecast,
            'current_features': dict(zip(self.feature_names, current_features)),
            'interpretation': self._interpret_prediction(predicted_vol)
        }
    
    def _get_current_features(self, portfolio_df):
        """Get current feature values for prediction."""
        try:
            # Fetch recent data (last 300 days) to ensure sufficient data for 120-day rolling windows
            # Plus buffer for weekends/holidays - critical for accurate volatility calculations
            end_date = datetime.now()
            start_date = end_date - timedelta(days=300)
            
            tickers = portfolio_df['Ticker'].tolist()
            weights = portfolio_df['Weight'].values
            weights = weights / weights.sum()
            
            # Get recent stock data with proper column handling
            stock_data = {}
            for ticker in tickers:
                try:
                    data = yf.download(ticker, start=start_date, end=end_date, progress=False)
                    if not data.empty:
                        # Handle multi-level columns from yfinance
                        if isinstance(data.columns, pd.MultiIndex):
                            close_col = [col for col in data.columns if col[0] == 'Close']
                            if close_col:
                                stock_data[ticker] = data[close_col[0]]
                        elif 'Close' in data.columns:
                            stock_data[ticker] = data['Close']
                except:
                    pass
            
            if not stock_data:
                # Calculate portfolio-specific defaults based on asset types for retail investors
                return self._calculate_default_features(portfolio_df, weights)
            
            # Calculate current features
            price_df = pd.DataFrame(stock_data).dropna()
            if price_df.empty:
                # Return portfolio-specific defaults if no price data available
                return self._calculate_default_features(portfolio_df, weights)
            
            portfolio_returns = (price_df.pct_change() * weights).sum(axis=1)
            
            # For retail investors: ensure we have enough data points for stable volatility estimates
            if len(portfolio_returns) < 150:
                print(f"Warning: Only {len(portfolio_returns)} days of data available. Using asset-based volatility estimates.")
                return self._calculate_default_features(portfolio_df, weights)
            
            # Get VIX data with proper column handling
            try:
                vix_df = yf.download('^VIX', start=start_date, end=end_date, progress=False)
                if isinstance(vix_df.columns, pd.MultiIndex):
                    close_col = [col for col in vix_df.columns if col[0] == 'Close'][0]
                    vix_data = vix_df[close_col]
                else:
                    vix_data = vix_df['Close']
                vix_current = vix_data.iloc[-1] if not vix_data.empty else 20.0
                vix_change = vix_data.pct_change(20).iloc[-1] if len(vix_data) > 20 else 0.0
            except:
                vix_current = 20.0
                vix_change = 0.0
            
            # Get VTI data with proper column handling
            try:
                vti_df = yf.download('VTI', start=start_date, end=end_date, progress=False)
                if isinstance(vti_df.columns, pd.MultiIndex):
                    close_col = [col for col in vti_df.columns if col[0] == 'Close'][0]
                    vti_data = vti_df[close_col]
                else:
                    vti_data = vti_df['Close']
                vti_return_20d = vti_data.pct_change().rolling(20).sum().iloc[-1] if not vti_data.empty else 0.0
            except:
                vti_return_20d = 0.0
            
            # Calculate features with robust fallbacks for retail portfolios
            # Use shorter windows if insufficient data, but prefer actual calculations
            vol_60d = portfolio_returns.rolling(60).std().iloc[-1] * np.sqrt(252) if len(portfolio_returns) > 60 else (
                portfolio_returns.rolling(min(30, len(portfolio_returns)//2)).std().iloc[-1] * np.sqrt(252) if len(portfolio_returns) > 20 else 
                self._calculate_asset_volatility(portfolio_df, weights)
            )
            
            vol_120d = portfolio_returns.rolling(120).std().iloc[-1] * np.sqrt(252) if len(portfolio_returns) > 120 else (
                portfolio_returns.rolling(min(60, len(portfolio_returns)//2)).std().iloc[-1] * np.sqrt(252) if len(portfolio_returns) > 40 else
                self._calculate_asset_volatility(portfolio_df, weights) * 0.85  # Longer term typically lower
            )
            
            current_features = [
                vol_60d,
                vol_120d, 
                vix_current,
                vix_change,
                vti_return_20d,
                1.0,  # Default beta - will be improved in future versions
                weights.max(),  # Concentration risk - important for retail portfolios
                0.6,  # Default correlation - will be improved in future versions
                portfolio_returns.rolling(min(60, len(portfolio_returns)//2)).sum().iloc[-1] if len(portfolio_returns) > 20 else 0.0,
                50.0  # Default RSI
            ]
            
            # Handle NaN values
            current_features = [x if not np.isnan(x) else 0.0 for x in current_features]
            
            return current_features
            
        except Exception as e:
            print(f"Error calculating current features: {e}")
            # Return portfolio-specific defaults instead of generic ones
            weights = portfolio_df['Weight'].values / portfolio_df['Weight'].values.sum()
            return self._calculate_default_features(portfolio_df, weights)
    
    def _calculate_asset_volatility(self, portfolio_df, weights):
        """
        Calculate portfolio volatility based on actual historical data when available,
        or use a simple weighted average approach.
        """
        # Try to get actual volatility from recent data first
        try:
            end_date = datetime.now()
            # Align asset-based realized window to ~1 trading year for consistency with enhanced pipeline
            start_date = end_date - timedelta(days=252)
            
            tickers = portfolio_df['Ticker'].tolist()
            stock_data = {}
            
            for ticker in tickers:
                try:
                    data = yf.download(ticker, start=start_date, end=end_date, progress=False)
                    if not data.empty:
                        if isinstance(data.columns, pd.MultiIndex):
                            close_col = [col for col in data.columns if col[0] == 'Close']
                            if close_col:
                                stock_data[ticker] = data[close_col[0]]
                        elif 'Close' in data.columns:
                            stock_data[ticker] = data['Close']
                except:
                    pass
            
            if stock_data:
                price_df = pd.DataFrame(stock_data).dropna()
                if not price_df.empty:
                    returns = price_df.pct_change().dropna()
                    # Calculate weighted average volatility
                    weighted_vol = 0
                    for i, ticker in enumerate(portfolio_df['Ticker']):
                        if ticker in returns.columns:
                            ticker_vol = returns[ticker].std() * np.sqrt(252)
                            weighted_vol += weights[i] * ticker_vol
                    
                    if weighted_vol > 0:
                        return weighted_vol
        except:
            pass
        
        # Fallback: simple weighted average with conservative estimates
        # Use a more conservative default volatility for unknown assets
        default_vol = 0.20  # 20% annual volatility as default
        return default_vol
    
    def _calculate_default_features(self, portfolio_df, weights):
        """
        Calculate realistic default features based on actual portfolio composition.
        """
        # Get portfolio-specific volatility estimate
        portfolio_vol = self._calculate_asset_volatility(portfolio_df, weights)
        
        # Slightly lower volatility for longer-term measures (common pattern)
        vol_60d = portfolio_vol
        vol_120d = portfolio_vol * 0.90
        
        # Conservative VIX assumptions for retail planning
        vix_current = 20.0
        vix_change = 0.0
        vti_return = 0.01  # Modest market return assumption
        
        # Concentration risk (higher weight = higher risk)
        max_weight = weights.max()
        
        # Default momentum based on portfolio volatility
        momentum = 0.02 if portfolio_vol < 0.25 else 0.01
        
        return [
            vol_60d,           # portfolio_returns_std_60d
            vol_120d,          # portfolio_returns_std_120d  
            vix_current,       # vix_level
            vix_change,        # vix_change_20d
            vti_return,        # market_return_20d
            1.0,               # portfolio_beta
            max_weight,        # max_single_weight (concentration risk)
            0.6,               # correlation_avg
            momentum,          # momentum_60d
            50.0               # rsi_30d
        ]
    
    def _interpret_prediction(self, volatility):
        """Provide human-readable interpretation tailored for retail investors and financial advisors."""
        if volatility < 0.12:
            risk_level = "Very Low"
            description = "Conservative portfolio with relatively stable returns. Suitable for risk-averse investors approaching retirement."
        elif volatility < 0.18:
            risk_level = "Low" 
            description = "Balanced portfolio with modest volatility. Good for long-term wealth building with lower risk tolerance."
        elif volatility < 0.25:
            risk_level = "Moderate"
            description = "Standard diversified portfolio volatility. Appropriate for most long-term investors with moderate risk tolerance."
        elif volatility < 0.35:
            risk_level = "High"
            description = "Higher volatility portfolio with growth potential. Suitable for younger investors with longer time horizons."
        elif volatility < 0.50:
            risk_level = "Very High"
            description = "High-risk portfolio with significant volatility. Consider if you have high risk tolerance and long investment timeline."
        else:
            risk_level = "Very High"
            description = "Extremely volatile portfolio (likely contains crypto/speculative assets). Only suitable for very aggressive investors."
        
        return {
            'risk_level': risk_level,
            'description': description,
            'annual_volatility_pct': f"{volatility * 100:.1f}%"
        }
    
    def save_model(self, filepath):
        """Save trained model to disk."""
        if self.model is None:
            raise ValueError("No model to save!")
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        joblib.dump(self.model, filepath)
        print(f"Model saved to {filepath}")
    
    def load_model(self, filepath):
        """Load trained model from disk."""
        self.model = joblib.load(filepath)
        print(f"Model loaded from {filepath}")

# Example usage function
def train_portfolio_model(portfolio_csv_path="data/sample_portfolio.csv"):
    """
    Complete example of training a model on historical data.
    """
    # Load portfolio
    portfolio_df = pd.read_csv(portfolio_csv_path)
    print(f"Portfolio: {len(portfolio_df)} assets")
    print(portfolio_df)
    
    # Initialize trainer
    trainer = PortfolioVolatilityTrainer()
    
    # Fetch historical data (last 18 months)
    print("\n1. Fetching historical data...")
    historical_data = trainer.fetch_historical_data(portfolio_df, months_back=18)
    
    # Train model
    print("\n2. Training model...")
    results = trainer.train_model(historical_data)
    
    # Save model
    print("\n3. Saving model...")
    trainer.save_model("model/portfolio_volatility_model.pkl")
    
    # Make prediction
    print("\n4. Making prediction...")
    prediction = trainer.predict_volatility(portfolio_df)
    
    print(f"\nPredicted Volatility: {prediction['interpretation']['annual_volatility_pct']}")
    print(f"Risk Level: {prediction['interpretation']['risk_level']}")
    print(f"Description: {prediction['interpretation']['description']}")
    
    return trainer, results

if __name__ == "__main__":
    # Run training when script is called directly
    trainer, results = train_portfolio_model()