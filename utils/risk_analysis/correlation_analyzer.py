"""
Correlation Analysis Module
Calculates correlations between portfolio assets and identifies concentration risks.
"""

import pandas as pd
import numpy as np
import yfinance as yf
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class CorrelationAnalyzer:
    """
    Analyzes correlations between portfolio assets and identifies concentration risks.
    """
    
    def __init__(self, lookback_days: int = 252):
        """
        Initialize the correlation analyzer.
        
        Args:
            lookback_days: Number of trading days to use for correlation calculation
        """
        self.lookback_days = lookback_days
        
    def analyze_portfolio_correlations(self, portfolio_df: pd.DataFrame) -> Dict:
        """
        Analyze correlations between all portfolio assets.
        
        Args:
            portfolio_df: Portfolio DataFrame with Ticker and Weight columns
            
        Returns:
            Dict containing correlation analysis results
        """
        try:
            # Get price data for all assets
            price_data = self._fetch_price_data(portfolio_df['Ticker'].tolist())
            
            if price_data.empty:
                return self._create_fallback_result(portfolio_df)
            
            # Calculate correlation matrix
            try:
                correlation_matrix = price_data.corr()
                
                # Check if correlation matrix is valid
                if correlation_matrix.empty or correlation_matrix.isna().all().all():
                    logger.warning("Correlation matrix is empty or all NaN")
                    return self._create_fallback_result(portfolio_df)
                
                # Find most correlated pair
                most_correlated = self._find_most_correlated_pair(correlation_matrix)
                
                # Calculate average correlation
                avg_correlation = self._calculate_average_correlation(correlation_matrix)
                
            except Exception as e:
                logger.error(f"Error calculating correlations: {str(e)}")
                return self._create_fallback_result(portfolio_df)
            
            # Calculate portfolio concentration metrics
            concentration_metrics = self._calculate_concentration_metrics(portfolio_df)
            
            return {
                'most_correlated_pair': most_correlated,
                'average_correlation': avg_correlation,
                'correlation_matrix': correlation_matrix.to_dict(),
                'concentration_metrics': concentration_metrics,
                'total_assets': len(portfolio_df),
                'analysis_period_days': self.lookback_days,
                'success': True
            }
            
        except Exception as e:
            logger.error(f"Error in correlation analysis: {str(e)}")
            return self._create_fallback_result(portfolio_df)
    
    def _fetch_price_data(self, tickers: List[str]) -> pd.DataFrame:
        """
        Fetch price data for portfolio assets.
        
        Args:
            tickers: List of ticker symbols
            
        Returns:
            DataFrame with price data for all assets
        """
        end_date = datetime.now()
        start_date = end_date - timedelta(days=self.lookback_days + 50)  # Extra days for weekends
        
        price_data = {}
        
        for ticker in tickers:
            try:
                # Fetch data using yfinance
                data = yf.download(ticker, start=start_date, end=end_date, progress=False, auto_adjust=True)
                
                if not data.empty and 'Close' in data.columns:
                    # Handle MultiIndex columns from yfinance
                    if isinstance(data.columns, pd.MultiIndex):
                        # Extract the Close column from MultiIndex
                        close_col = data.columns.get_level_values(1)[0]  # Get first ticker
                        close_data = data[('Close', close_col)]
                    else:
                        close_data = data['Close']
                    
                    # Calculate daily returns
                    returns = close_data.pct_change().dropna()
                    logger.debug(f"Returns for {ticker}: type={type(returns)}, length={len(returns)}")
                    price_data[ticker] = returns
                else:
                    logger.warning(f"No data available for {ticker}")
                    
            except Exception as e:
                logger.warning(f"Failed to fetch data for {ticker}: {str(e)}")
        
        if not price_data:
            return pd.DataFrame()
        
        # Combine all returns into a single DataFrame
        # Ensure we have at least 2 assets for correlation analysis
        if len(price_data) < 2:
            logger.warning("Need at least 2 assets for correlation analysis")
            return pd.DataFrame()
        
        # Create DataFrame with proper index alignment
        try:
            # Convert price_data dict to DataFrame
            # Each value in price_data should be a pandas Series with datetime index
            if not price_data:
                return pd.DataFrame()
            
            # Get the first series to use as index reference
            first_key = list(price_data.keys())[0]
            first_series = price_data[first_key]
            
            # Ensure we have a proper pandas Series with index
            if not isinstance(first_series, pd.Series):
                logger.error("Price data is not in expected pandas Series format")
                return pd.DataFrame()
            
            # Create DataFrame with explicit index
            combined_data = pd.DataFrame(price_data, index=first_series.index)
            
            # Align dates and fill missing values
            combined_data = combined_data.ffill().fillna(0)
            
            # Take only the last lookback_days
            if len(combined_data) > self.lookback_days:
                combined_data = combined_data.tail(self.lookback_days)
            
            # Ensure we have enough data points
            if len(combined_data) < 30:
                logger.warning("Insufficient data points for reliable correlation analysis")
                return pd.DataFrame()
            
            return combined_data
            
        except Exception as e:
            logger.error(f"Error creating correlation DataFrame: {str(e)}")
            return pd.DataFrame()
    
    def _find_most_correlated_pair(self, correlation_matrix: pd.DataFrame) -> Dict:
        """
        Find the most correlated pair of assets.
        
        Args:
            correlation_matrix: Correlation matrix DataFrame
            
        Returns:
            Dict with most correlated pair information
        """
        # Remove diagonal elements (self-correlation = 1.0)
        corr_matrix_no_diag = correlation_matrix.where(
            ~np.eye(correlation_matrix.shape[0], dtype=bool)
        )
        
        # Find maximum correlation (excluding diagonal)
        # Handle the case where we might have NaN values
        if corr_matrix_no_diag.isna().all().all():
            # If all values are NaN, return default values
            return {
                'asset1': 'N/A',
                'asset2': 'N/A',
                'correlation': 0.0,
                'correlation_level': 'Unknown',
                'risk_color': '#6c757d',
                'risk_description': 'Insufficient data for correlation analysis'
            }
        
        # Find the maximum correlation value and its location
        max_corr = corr_matrix_no_diag.max().max()
        
        # Find the indices of the maximum correlation
        max_corr_idx = corr_matrix_no_diag.stack().idxmax()
        
        if isinstance(max_corr_idx, tuple):
            asset1, asset2 = max_corr_idx
        else:
            # Fallback if idxmax doesn't return a tuple
            asset1 = 'N/A'
            asset2 = 'N/A'
        
        # Determine correlation level
        if max_corr >= 0.8:
            correlation_level = "Very High"
            risk_color = "#dc3545"  # Red
        elif max_corr >= 0.6:
            correlation_level = "High"
            risk_color = "#fd7e14"  # Orange
        elif max_corr >= 0.4:
            correlation_level = "Moderate"
            risk_color = "#ffc107"  # Yellow
        elif max_corr >= 0.2:
            correlation_level = "Low"
            risk_color = "#20c997"  # Teal
        else:
            correlation_level = "Very Low"
            risk_color = "#28a745"  # Green
        
        return {
            'asset1': asset1,
            'asset2': asset2,
            'correlation': round(max_corr, 3),
            'correlation_level': correlation_level,
            'risk_color': risk_color,
            'risk_description': self._get_correlation_risk_description(max_corr)
        }
    
    def _calculate_average_correlation(self, correlation_matrix: pd.DataFrame) -> float:
        """
        Calculate average correlation excluding self-correlations.
        
        Args:
            correlation_matrix: Correlation matrix DataFrame
            
        Returns:
            Average correlation value
        """
        # Get upper triangle of correlation matrix (excluding diagonal)
        upper_triangle = correlation_matrix.where(
            np.triu(np.ones(correlation_matrix.shape), k=1).astype(bool)
        )
        
        # Calculate mean of non-null values
        avg_corr = upper_triangle.stack().mean()
        return round(avg_corr, 3) if not pd.isna(avg_corr) else 0.0
    
    def _calculate_concentration_metrics(self, portfolio_df: pd.DataFrame) -> Dict:
        """
        Calculate portfolio concentration metrics.
        
        Args:
            portfolio_df: Portfolio DataFrame with Ticker and Weight columns
            
        Returns:
            Dict with concentration metrics
        """
        # Normalize weights to sum to 1
        weights = portfolio_df['Weight'].values
        normalized_weights = weights / weights.sum()
        
        # Calculate Herfindahl-Hirschman Index (HHI)
        hhi = np.sum(normalized_weights ** 2)
        
        # Determine concentration level
        if hhi >= 0.25:
            concentration_level = "Very High"
            risk_color = "#dc3545"
        elif hhi >= 0.15:
            concentration_level = "High"
            risk_color = "#fd7e14"
        elif hhi >= 0.10:
            concentration_level = "Moderate"
            risk_color = "#ffc107"
        elif hhi >= 0.05:
            concentration_level = "Low"
            risk_color = "#20c997"
        else:
            concentration_level = "Very Low"
            risk_color = "#28a745"
        
        # Find top holdings
        portfolio_with_weights = portfolio_df.copy()
        portfolio_with_weights['NormalizedWeight'] = normalized_weights
        top_holdings = portfolio_with_weights.nlargest(3, 'NormalizedWeight')
        
        # Calculate top 3 concentration
        top_3_concentration = top_holdings['NormalizedWeight'].sum()
        
        # Find largest single holding
        largest_holding = portfolio_with_weights.loc[
            portfolio_with_weights['NormalizedWeight'].idxmax()
        ]
        
        return {
            'hhi': round(hhi, 3),
            'concentration_level': concentration_level,
            'risk_color': risk_color,
            'top_3_concentration': round(top_3_concentration, 3),
            'largest_holding': {
                'ticker': largest_holding['Ticker'],
                'weight': round(largest_holding['NormalizedWeight'], 3),
                'percentage': round(largest_holding['NormalizedWeight'] * 100, 1)
            },
            'top_holdings': [
                {
                    'ticker': row['Ticker'],
                    'weight': round(row['NormalizedWeight'], 3),
                    'percentage': round(row['NormalizedWeight'] * 100, 1)
                }
                for _, row in top_holdings.iterrows()
            ]
        }
    
    def _get_correlation_risk_description(self, correlation: float) -> str:
        """
        Get risk description based on correlation value.
        
        Args:
            correlation: Correlation coefficient
            
        Returns:
            Risk description string
        """
        if correlation >= 0.8:
            return "High concentration risk - consider diversifying"
        elif correlation >= 0.6:
            return "Moderate concentration risk - monitor closely"
        elif correlation >= 0.4:
            return "Some concentration risk - acceptable for most portfolios"
        elif correlation >= 0.2:
            return "Low concentration risk - good diversification"
        else:
            return "Very low concentration risk - excellent diversification"
    
    def _create_fallback_result(self, portfolio_df: pd.DataFrame) -> Dict:
        """
        Create fallback result when correlation analysis fails.
        
        Args:
            portfolio_df: Portfolio DataFrame
            
        Returns:
            Fallback analysis result
        """
        concentration_metrics = self._calculate_concentration_metrics(portfolio_df)
        
        # Check if this is a single asset portfolio
        if len(portfolio_df) == 1:
            error_message = 'Single asset portfolio - correlation analysis not applicable'
            risk_description = 'Single asset portfolio - consider adding more assets for diversification'
        else:
            error_message = 'Unable to fetch price data for correlation analysis'
            risk_description = 'Correlation analysis unavailable'
        
        return {
            'most_correlated_pair': {
                'asset1': 'N/A',
                'asset2': 'N/A',
                'correlation': 0.0,
                'correlation_level': 'Unknown',
                'risk_color': '#6c757d',
                'risk_description': risk_description
            },
            'average_correlation': 0.0,
            'correlation_matrix': {},
            'concentration_metrics': concentration_metrics,
            'total_assets': len(portfolio_df),
            'analysis_period_days': self.lookback_days,
            'success': len(portfolio_df) > 1,  # Success only if multiple assets
            'error_message': error_message,
            'single_asset_portfolio': len(portfolio_df) == 1
        }
