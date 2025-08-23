"""
Crash Test Services - Core functionality for portfolio stress testing
"""
import pandas as pd
import numpy as np
import yfinance as yf
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import json
import os

# Predefined crash test scenarios
CRASH_SCENARIOS = {
    "dot_com": {
        "id": "dot_com",
        "label": "Dot-Com Bust",
        "start": "2000-03-24",
        "end": "2007-10-09"
    },
    "gfc": {
        "id": "gfc", 
        "label": "Global Financial Crisis",
        "start": "2007-10-09",
        "end": "2013-03-28"
    },
    "pandemic": {
        "id": "pandemic",
        "label": "Pandemic Crash",
        "start": "2020-02-19", 
        "end": "2021-08-20"
    },
    "rate_shock_2022": {
        "id": "rate_shock_2022",
        "label": "2022 Rate Shock",
        "start": "2022-01-01",
        "end": "2024-01-01"
    }
}

class PriceService:
    """Service for fetching and managing price data"""
    
    def __init__(self):
        self.cache_dir = "data/price_cache"
        os.makedirs(self.cache_dir, exist_ok=True)
    
    def get_adjusted_prices(self, ticker: str, start_date: str, end_date: str) -> pd.Series:
        """Fetch adjusted close prices for a ticker"""
        try:
            # Try to load from cache first
            cache_file = f"{self.cache_dir}/{ticker}_{start_date}_{end_date}.csv"
            if os.path.exists(cache_file):
                df = pd.read_csv(cache_file, index_col=0, parse_dates=True)
                # Use Close if Adj Close is not available
                if 'Adj Close' in df.columns:
                    return df['Adj Close']
                elif 'Close' in df.columns:
                    return df['Close']
                else:
                    return pd.Series(dtype=float)
            
            # Fetch from Yahoo Finance
            ticker_obj = yf.Ticker(ticker)
            df = ticker_obj.history(start=start_date, end=end_date)
            
            # Ensure timezone-naive dates
            if not df.empty and df.index.tz is not None:
                df.index = df.index.tz_localize(None)
            
            if df.empty:
                return pd.Series(dtype=float)
            
            # Use Close if Adj Close is not available
            if 'Adj Close' in df.columns:
                price_series = df['Adj Close']
            elif 'Close' in df.columns:
                price_series = df['Close']
            else:
                print(f"No price data available for {ticker}")
                return pd.Series(dtype=float)
            
            # Cache the data
            df.to_csv(cache_file)
            
            return price_series
            
        except Exception as e:
            print(f"Error fetching prices for {ticker}: {e}")
            return pd.Series(dtype=float)

class PortfolioService:
    """Service for portfolio calculations and rebalancing"""
    
    def __init__(self, price_service: PriceService):
        self.price_service = price_service
    
    def calculate_portfolio_returns(
        self, 
        portfolio: List[Dict[str, Any]], 
        start_date: str, 
        end_date: str,
        rebalance: str = "none",
        drift_handling: str = "renormDaily"
    ) -> Dict[str, Any]:
        """Calculate portfolio returns with specified rebalancing strategy"""
        
        # Get price data for all tickers
        ticker_data = {}
        coverage_data = {}
        
        for asset in portfolio:
            ticker = asset['ticker']
            prices = self.price_service.get_adjusted_prices(ticker, start_date, end_date)
            
            if not prices.empty:
                # Calculate daily returns
                returns = prices.pct_change().dropna()
                ticker_data[ticker] = returns
                coverage_data[ticker] = len(returns) / len(prices) if len(prices) > 0 else 0
            else:
                coverage_data[ticker] = 0
        
        if not ticker_data:
            # Identify which tickers have no data
            missing_tickers = [asset['ticker'] for asset in portfolio if coverage_data.get(asset['ticker'], 0) == 0]
            return {
                "returns": pd.Series(dtype=float),
                "coverage": coverage_data,
                "error": f"No valid price data found for tickers: {', '.join(missing_tickers)}. These assets may not have been trading during the specified period."
            }
        
        # Align all return series to common dates
        all_dates = set()
        for returns in ticker_data.values():
            all_dates.update(returns.index)
        
        common_dates = sorted(all_dates)
        aligned_returns = {}
        
        for ticker, returns in ticker_data.items():
            aligned_returns[ticker] = returns.reindex(common_dates).fillna(0)
        
        # Calculate portfolio returns
        portfolio_returns = pd.Series(0.0, index=common_dates)
        weights = {asset['ticker']: asset['weight'] for asset in portfolio}
        
        if rebalance == "none":
            # No rebalancing - weights drift
            portfolio_returns = self._calculate_drifting_returns(aligned_returns, weights, common_dates)
        else:
            # Rebalancing - recalculate weights periodically
            portfolio_returns = self._calculate_rebalanced_returns(aligned_returns, weights, common_dates, rebalance)
        
        return {
            "returns": portfolio_returns,
            "coverage": coverage_data,
            "aligned_returns": aligned_returns
        }
    
    def _calculate_drifting_returns(
        self, 
        aligned_returns: Dict[str, pd.Series], 
        initial_weights: Dict[str, float], 
        dates: List[datetime]
    ) -> pd.Series:
        """Calculate returns with drifting weights (no rebalancing)"""
        portfolio_returns = pd.Series(0.0, index=dates)
        current_weights = initial_weights.copy()
        
        for i, date in enumerate(dates):
            # Calculate portfolio return for this day
            daily_return = 0.0
            for ticker, returns in aligned_returns.items():
                if ticker in current_weights:
                    daily_return += current_weights[ticker] * returns[date]
            
            portfolio_returns[date] = daily_return
            
            # Update weights for next day (drift)
            if i < len(dates) - 1:
                for ticker, returns in aligned_returns.items():
                    if ticker in current_weights:
                        # Weight grows by (1 + return)
                        current_weights[ticker] *= (1 + returns[date])
                
                # Renormalize weights to sum to 1
                total_weight = sum(current_weights.values())
                if total_weight > 0:
                    for ticker in current_weights:
                        current_weights[ticker] /= total_weight
        
        return portfolio_returns
    
    def _calculate_rebalanced_returns(
        self, 
        aligned_returns: Dict[str, pd.Series], 
        target_weights: Dict[str, float], 
        dates: List[datetime],
        rebalance_freq: str
    ) -> pd.Series:
        """Calculate returns with periodic rebalancing"""
        portfolio_returns = pd.Series(0.0, index=dates)
        current_weights = target_weights.copy()
        
        # Determine rebalancing dates
        if rebalance_freq == "monthly":
            rebalance_dates = self._get_monthly_dates(dates)
        elif rebalance_freq == "quarterly":
            rebalance_dates = self._get_quarterly_dates(dates)
        else:
            rebalance_dates = set()
        
        for i, date in enumerate(dates):
            # Calculate portfolio return for this day
            daily_return = 0.0
            for ticker, returns in aligned_returns.items():
                if ticker in current_weights:
                    daily_return += current_weights[ticker] * returns[date]
            
            portfolio_returns[date] = daily_return
            
            # Rebalance if this is a rebalancing date
            if date in rebalance_dates:
                current_weights = target_weights.copy()
            else:
                # Update weights for next day (drift)
                if i < len(dates) - 1:
                    for ticker, returns in aligned_returns.items():
                        if ticker in current_weights:
                            current_weights[ticker] *= (1 + returns[date])
                    
                    # Renormalize weights to sum to 1
                    total_weight = sum(current_weights.values())
                    if total_weight > 0:
                        for ticker in current_weights:
                            current_weights[ticker] /= total_weight
        
        return portfolio_returns
    
    def _get_monthly_dates(self, dates: List[datetime]) -> set:
        """Get first trading day of each month"""
        monthly_dates = set()
        current_month = None
        
        for date in dates:
            if current_month != date.month:
                monthly_dates.add(date)
                current_month = date.month
        
        return monthly_dates
    
    def _get_quarterly_dates(self, dates: List[datetime]) -> set:
        """Get first trading day of each quarter"""
        quarterly_dates = set()
        current_quarter = None
        
        for date in dates:
            quarter = (date.month - 1) // 3 + 1
            if current_quarter != quarter:
                quarterly_dates.add(date)
                current_quarter = quarter
        
        return quarterly_dates

class MetricsService:
    """Service for calculating portfolio metrics"""
    
    @staticmethod
    def calculate_metrics(returns: pd.Series) -> Dict[str, Any]:
        """Calculate comprehensive portfolio metrics"""
        if returns.empty:
            return {
                "cumReturnPct": 0.0,
                "maxDrawdownPct": 0.0,
                "timeToRecoveryDays": None,
                "worstDayPct": 0.0,
                "worstMonthPct": 0.0,
                "annVolPct": 0.0,
                "sharpeLite": 0.0
            }
        
        # Calculate equity curve
        equity_curve = (1 + returns.fillna(0)).cumprod()
        
        # Cumulative return
        cum_return_pct = (equity_curve.iloc[-1] - 1) * 100
        
        # Max drawdown and recovery
        max_dd, recovery_days, drawdown_series = MetricsService._calculate_max_drawdown(equity_curve)
        
        # Worst periods
        worst_day_pct = returns.min() * 100
        worst_month_pct = MetricsService._calculate_worst_month(returns) * 100
        
        # Annualized volatility
        ann_vol_pct = returns.std() * np.sqrt(252) * 100
        
        # Sharpe ratio (assuming 0% risk-free rate)
        ann_return = returns.mean() * 252
        sharpe_lite = ann_return / (returns.std() * np.sqrt(252)) if returns.std() > 0 else 0
        
        return {
            "cumReturnPct": float(round(cum_return_pct, 1)),
            "maxDrawdownPct": float(round(max_dd * 100, 1)),
            "timeToRecoveryDays": recovery_days,
            "worstDayPct": float(round(worst_day_pct, 1)),
            "worstMonthPct": float(round(worst_month_pct, 1)),
            "annVolPct": float(round(ann_vol_pct, 1)),
            "sharpeLite": float(round(sharpe_lite, 2))
        }
    
    @staticmethod
    def _calculate_max_drawdown(equity_curve: pd.Series) -> Tuple[float, Optional[int], pd.Series]:
        """Calculate maximum drawdown and time to recovery from peak to recovery"""
        peaks = equity_curve.cummax()
        drawdown = equity_curve / peaks - 1.0
        
        # Find maximum drawdown
        max_dd = drawdown.min()
        trough_date = drawdown.idxmin()
        
        # Find peak before trough (this is the peak we need to recover to)
        peak_before = peaks.loc[:trough_date].idxmax()
        peak_value = peaks.loc[peak_before]
        
        # Calculate time to recovery FROM PEAK (not from trough)
        recovery_days = None
        if peak_before < equity_curve.index[-1]:
            # Look for the first time equity recovers to peak value AFTER falling below it
            # We need to find where equity first goes below peak, then recovers
            equity_after_peak = equity_curve.loc[peak_before:]
            
            # Find the first time equity goes below peak value
            below_peak_mask = equity_after_peak < peak_value
            if below_peak_mask.any():
                first_below_peak = below_peak_mask[below_peak_mask].index[0]
                
                # Now look for recovery after that point
                recovery_mask = equity_curve.loc[first_below_peak:] >= peak_value
                if recovery_mask.any():
                    # Find the first True value (actual recovery point)
                    recovery_indices = recovery_mask[recovery_mask].index
                    if len(recovery_indices) > 0:
                        recovery_date = recovery_indices[0]
                        # Calculate business days from peak to recovery (exclusive of peak date)
                        # Ensure we're working with pandas Timestamps and timezone-naive
                        start_date = pd.Timestamp(peak_before)
                        if start_date.tz is not None:
                            start_date = start_date.tz_localize(None)
                        start_date = start_date + pd.Timedelta(days=1)
                        
                        end_date = pd.Timestamp(recovery_date)
                        if end_date.tz is not None:
                            end_date = end_date.tz_localize(None)
                            
                        business_days = len(pd.date_range(start_date, end_date, freq='B'))
                        recovery_days = business_days
        
        return float(max_dd), recovery_days, drawdown
        
        return float(max_dd), recovery_days, drawdown
    
    @staticmethod
    def _calculate_worst_month(returns: pd.Series) -> float:
        """Calculate worst monthly return"""
        try:
            monthly_returns = returns.resample('ME').apply(lambda x: (1 + x).prod() - 1)
            return monthly_returns.min()
        except:
            return 0.0
    
    @staticmethod
    def generate_series_data(returns: pd.Series) -> Dict[str, List]:
        """Generate time series data for charts"""
        if returns.empty:
            return {
                "dates": [],
                "equity": [],
                "drawdown": []
            }
        
        # Calculate equity curve
        equity_curve = (1 + returns.fillna(0)).cumprod()
        
        # Calculate drawdown series
        peaks = equity_curve.cummax()
        drawdown_series = (equity_curve / peaks - 1.0) * 100
        
        return {
            "dates": [d.strftime('%Y-%m-%d') for d in returns.index],
            "equity": [float(round(v, 4)) for v in equity_curve.values],
            "drawdown": [float(round(v, 2)) for v in drawdown_series.values]
        }



class CrashTestService:
    """Main service for orchestrating crash tests"""
    
    def __init__(self):
        self.price_service = PriceService()
        self.portfolio_service = PortfolioService(self.price_service)
        self.metrics_service = MetricsService()
    
    def run_crash_test(
        self,
        portfolio: List[Dict[str, Any]],
        scenarios: List[Dict[str, Any]],
        options: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Run crash test analysis for specified scenarios"""
        
        results = {
            "portfolioCoverage": {},
            "scenarios": [],
            "benchmarks": {}
        }
        
        # Calculate overall portfolio coverage
        all_tickers = [asset['ticker'] for asset in portfolio]
        coverage_summary = self._calculate_portfolio_coverage(all_tickers, scenarios)
        results["portfolioCoverage"] = coverage_summary
        
        # Run analysis for each scenario
        for scenario in scenarios:
            scenario_result = self._analyze_scenario(portfolio, scenario, options)
            results["scenarios"].append(scenario_result)
        
        # Add benchmark comparisons if requested
        if options.get("benchmarks"):
            benchmark_results = self._calculate_benchmarks(scenarios, options)
            results["benchmarks"] = benchmark_results
        
        return results
    
    def _calculate_portfolio_coverage(self, tickers: List[str], scenarios: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate data coverage for portfolio across all scenarios"""
        coverage_by_ticker = {}
        
        for ticker in tickers:
            ticker_coverage = []
            for scenario in scenarios:
                prices = self.price_service.get_adjusted_prices(
                    ticker, scenario['start'], scenario['end']
                )
                if not prices.empty:
                    # Calculate coverage as percentage of expected trading days
                    # Ensure timezone-naive dates for date_range
                    start_date = pd.to_datetime(scenario['start']).tz_localize(None) if pd.to_datetime(scenario['start']).tz is not None else pd.to_datetime(scenario['start'])
                    end_date = pd.to_datetime(scenario['end']).tz_localize(None) if pd.to_datetime(scenario['end']).tz is not None else pd.to_datetime(scenario['end'])
                    expected_days = len(pd.date_range(start_date, end_date, freq='B'))
                    actual_days = len(prices)
                    coverage = min(actual_days / expected_days, 1.0) if expected_days > 0 else 0.0
                    ticker_coverage.append(coverage)
                else:
                    ticker_coverage.append(0.0)
            
            # Average coverage across scenarios
            avg_coverage = sum(ticker_coverage) / len(ticker_coverage) if ticker_coverage else 0.0
            coverage_by_ticker[ticker] = round(avg_coverage, 3)
        
        # Overall coverage
        overall_coverage = sum(coverage_by_ticker.values()) / len(coverage_by_ticker) if coverage_by_ticker else 0.0
        
        return {
            "overall": round(overall_coverage, 3),
            "byTicker": coverage_by_ticker
        }
    
    def _analyze_scenario(
        self, 
        portfolio: List[Dict[str, Any]], 
        scenario: Dict[str, Any], 
        options: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze a single crash scenario"""
        
        try:
            # Calculate portfolio returns
            portfolio_result = self.portfolio_service.calculate_portfolio_returns(
                portfolio=portfolio,
                start_date=scenario['start'],
                end_date=scenario['end'],
                rebalance=options.get('rebalance', 'none'),
                drift_handling=options.get('driftHandling', 'renormDaily')
            )
            
            if "error" in portfolio_result:
                return {
                    "id": scenario['id'],
                    "error": portfolio_result["error"],
                    "coveragePct": 0.0
                }
            
            # Check if we have sufficient data
            if portfolio_result["returns"].empty or len(portfolio_result["returns"]) < 10:
                return {
                    "id": scenario['id'],
                    "error": f"Insufficient price data for {scenario['id']} scenario. Need at least 10 trading days.",
                    "coveragePct": 0.0
                }
            
            # Calculate metrics
            metrics = self.metrics_service.calculate_metrics(portfolio_result["returns"])
            
            # Generate series data
            series_data = self.metrics_service.generate_series_data(portfolio_result["returns"])
            
            # Calculate scenario coverage
            scenario_coverage = self._calculate_scenario_coverage(portfolio_result["coverage"])
            
            return {
                "id": scenario['id'],
                "metrics": metrics,
                "series": series_data,
                "coveragePct": scenario_coverage
            }
            
        except Exception as e:
            return {
                "id": scenario['id'],
                "error": f"Error analyzing {scenario['id']} scenario: {str(e)}",
                "coveragePct": 0.0
            }
    
    def _calculate_scenario_coverage(self, coverage_data: Dict[str, float]) -> float:
        """Calculate overall coverage for a scenario"""
        if not coverage_data:
            return 0.0
        
        total_coverage = sum(coverage_data.values())
        avg_coverage = total_coverage / len(coverage_data)
        return round(avg_coverage, 3)
    
    def _calculate_benchmarks(
        self, 
        scenarios: List[Dict[str, Any]], 
        options: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate benchmark performance for comparison"""
        benchmarks = {}
        benchmark_tickers = options.get("benchmarks", [])
        
        for benchmark in benchmark_tickers:
            if benchmark == "60_40":
                # Create 60/40 portfolio
                benchmark_portfolio = [
                    {"ticker": "SPY", "weight": 0.6},
                    {"ticker": "AGG", "weight": 0.4}
                ]
            else:
                # Single ticker benchmark
                benchmark_portfolio = [{"ticker": benchmark, "weight": 1.0}]
            
            benchmark_results = []
            for scenario in scenarios:
                scenario_result = self._analyze_scenario(
                    benchmark_portfolio, scenario, options
                )
                benchmark_results.append(scenario_result)
            
            benchmarks[benchmark] = benchmark_results
        
        return benchmarks
