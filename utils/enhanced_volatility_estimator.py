import os
import pandas as pd
import numpy as np
import yfinance as yf
import requests
from datetime import datetime, timedelta
import warnings
import time
from typing import Dict, Optional, Tuple
from dotenv import load_dotenv
from .risk_analysis.correlation_analyzer import CorrelationAnalyzer

warnings.filterwarnings('ignore')

# Load environment variables from .env file
load_dotenv()

class EnhancedVolatilityEstimator:
    def __init__(self, alpha_vantage_key=None, fmp_key=None):
        """
        Enhanced volatility estimator using multiple data sources and ML-based classification.
        
        Args:
            alpha_vantage_key: Alpha Vantage API key (free tier: 25 calls/day)
            fmp_key: Financial Modeling Prep API key (free tier: 250 calls/day)
        """
        # Load API keys from environment variables if not provided
        self.alpha_vantage_key = alpha_vantage_key or os.getenv('ALPHA_VANTAGE_KEY') or os.getenv('ALPHA_VANTAGE_API_KEY')
        self.fmp_key = fmp_key or os.getenv('FMP_KEY') or os.getenv('FMP_API_KEY')
        
        # Initialize correlation analyzer for real correlation data
        self.correlation_analyzer = CorrelationAnalyzer()
        
        # Enhanced volatility database with more comprehensive coverage
        self.enhanced_volatility_map = self._build_enhanced_volatility_map()
        
        # Asset type classifiers
        self.asset_type_patterns = self._build_asset_classifiers()
        
        # Sector-based volatility averages
        self.sector_volatilities = self._build_sector_volatilities()
        
        # Simple in-memory cache for API calls
        self._api_cache = {}
        self._cache_ttl = 3600  # 1 hour cache TTL
        
    def _get_cached_data(self, key: str) -> Optional[Dict]:
        """Get data from cache if not expired."""
        if key in self._api_cache:
            timestamp, data = self._api_cache[key]
            if time.time() - timestamp < self._cache_ttl:
                return data
            else:
                del self._api_cache[key]
        return None
    
    def _set_cached_data(self, key: str, data: Dict):
        """Store data in cache with timestamp."""
        self._api_cache[key] = (time.time(), data)
        
    def _build_enhanced_volatility_map(self) -> Dict[str, float]:
        """Build comprehensive volatility map covering more asset classes"""
        return {
            # Major US Stocks
            'AAPL': 0.25, 'MSFT': 0.22, 'GOOGL': 0.28, 'GOOG': 0.28, 'AMZN': 0.30,
            'TSLA': 0.45, 'META': 0.35, 'NVDA': 0.40, 'AMD': 0.38, 'NFLX': 0.35,
            'CRM': 0.32, 'ADBE': 0.28, 'PYPL': 0.38, 'INTC': 0.30, 'CSCO': 0.25,
            'ORCL': 0.24, 'IBM': 0.22, 'HPE': 0.28, 'DELL': 0.30, 'VMW': 0.26,
            
            # Financial Sector
            'JPM': 0.28, 'BAC': 0.32, 'WFC': 0.30, 'GS': 0.35, 'MS': 0.38,
            'C': 0.35, 'USB': 0.28, 'PNC': 0.26, 'TFC': 0.25, 'COF': 0.32,
            'AXP': 0.30, 'V': 0.22, 'MA': 0.24, 'BRK-A': 0.18, 'BRK-B': 0.18,
            
            # Healthcare & Biotech
            'JNJ': 0.18, 'PFE': 0.22, 'ABBV': 0.25, 'MRK': 0.20, 'TMO': 0.22,
            'UNH': 0.20, 'LLY': 0.28, 'AMGN': 0.26, 'GILD': 0.28, 'BIIB': 0.35,
            'MRNA': 0.65, 'BNTX': 0.70, 'REGN': 0.32, 'VRTX': 0.30,
            
            # Energy Sector
            'XOM': 0.35, 'CVX': 0.32, 'COP': 0.40, 'EOG': 0.45, 'SLB': 0.42,
            'KMI': 0.28, 'WMB': 0.30, 'OKE': 0.32, 'PSX': 0.38,
            
            # Utilities (Low Volatility)
            'NEE': 0.18, 'DUK': 0.16, 'SO': 0.15, 'D': 0.17, 'EXC': 0.20,
            'XEL': 0.16, 'WEC': 0.15, 'ES': 0.18, 'PEG': 0.19,
            
            # Consumer Staples (Low-Moderate Volatility)
            'PG': 0.16, 'KO': 0.18, 'PEP': 0.17, 'WMT': 0.20, 'COST': 0.22,
            'CL': 0.18, 'KHC': 0.25, 'GIS': 0.19, 'K': 0.21,
            
            # REITs (Moderate Volatility)
            'AMT': 0.22, 'CCI': 0.24, 'EQIX': 0.26, 'PLD': 0.23, 'WELL': 0.25,
            'PSA': 0.21, 'EXR': 0.23, 'AVB': 0.24, 'EQR': 0.26,
            
            # Broad Market ETFs
            'SPY': 0.15, 'VOO': 0.15, 'IVV': 0.15, 'VTI': 0.16, 'ITOT': 0.16,
            'SWTSX': 0.16, 'FXAIX': 0.15, 'VFIAX': 0.15,
            
            # International ETFs
            'VEA': 0.18, 'VWO': 0.24, 'IEFA': 0.18, 'IEMG': 0.24, 'EFA': 0.18,
            'EEM': 0.24, 'ACWI': 0.17, 'VXUS': 0.18, 'FTIHX': 0.18,
            
            # Sector ETFs
            'XLK': 0.20, 'XLF': 0.25, 'XLE': 0.35, 'XLV': 0.18, 'XLI': 0.20,
            'XLP': 0.15, 'XLU': 0.16, 'XLB': 0.22, 'XLRE': 0.22, 'XLY': 0.22,
            'QQQ': 0.20, 'IWM': 0.22, 'MDY': 0.18,
            
            # Bond ETFs (Low Volatility)
            'AGG': 0.04, 'BND': 0.04, 'VGIT': 0.06, 'VGLT': 0.12, 'TLT': 0.12,
            'IEF': 0.06, 'IEI': 0.04, 'SHY': 0.02, 'VGSH': 0.02, 'VCSH': 0.03,
            'VCIT': 0.05, 'VCLT': 0.08, 'LQD': 0.06, 'HYG': 0.08, 'JNK': 0.08,
            'TIP': 0.05, 'VTEB': 0.04, 'MUB': 0.04, 'SCHZ': 0.04,
            
            # Treasury ETFs
            'GOVT': 0.05, 'FXNAX': 0.04, 'FTRB': 0.03, 'SCHO': 0.02, 'SCHR': 0.04,
            'SCHH': 0.06, 'VMBS': 0.03, 'MBB': 0.03,
            
            # International Bond ETFs
            'BNDX': 0.05, 'VWOB': 0.08, 'EMB': 0.09, 'PCY': 0.08, 'HYEM': 0.12,
            
            # Commodity ETFs
            'GLD': 0.18, 'SLV': 0.25, 'IAU': 0.18, 'PDBC': 0.20, 'DJP': 0.22,
            'USO': 0.35, 'UNG': 0.45, 'DBA': 0.18, 'CORN': 0.25, 'WEAT': 0.28,
            
            # Cryptocurrency (High Volatility) - Spot prices
            'BTC': 0.65, 'ETH': 0.75, 'BTC-USD': 0.65, 'ETH-USD': 0.75,
            'ADA': 0.80, 'SOL': 0.85, 'DOGE': 0.90, 'BNB': 0.70, 'XRP': 0.75,
            'MATIC': 0.85, 'AVAX': 0.90, 'DOT': 0.80, 'LINK': 0.75,
            
            # Leveraged ETFs (Very High Volatility)
            'TQQQ': 0.60, 'SOXL': 0.80, 'SPXL': 0.45, 'UPRO': 0.45, 'TECL': 0.65,
            'FAS': 0.70, 'TNA': 0.65, 'CURE': 0.60, 'DFEN': 0.55,
            
            # Inverse ETFs (High Volatility)
            'SQQQ': 0.60, 'SPXS': 0.45, 'SOXS': 0.80, 'FAZ': 0.70, 'TZA': 0.65,
            'UVXY': 1.20, 'VXX': 0.90, 'SVXY': 0.85,
            
            # Emerging Market Individual Stocks
            'TSM': 0.30, 'ASML': 0.32, 'NVO': 0.25, 'TM': 0.22, 'SONY': 0.28,
            'BABA': 0.45, 'JD': 0.50, 'PDD': 0.55, 'NIO': 0.70, 'XPEV': 0.75,
            'LI': 0.75, 'BIDU': 0.40, 'NTES': 0.35,
            
            # Popular Mutual Funds (Vanguard, Fidelity, etc.)
            'VFIAX': 0.15, 'FXAIX': 0.15, 'SWTSX': 0.16, 'VTIAX': 0.18,
            'FTIHX': 0.18, 'VBTLX': 0.04, 'FXNAX': 0.04, 'SWAGX': 0.04,
            'VTWAX': 0.17, 'VTSAX': 0.16, 'FZROX': 0.16, 'FZILX': 0.18,
            
            # Bond Mutual Funds
            'FTRBX': 0.03, 'PTTAX': 0.03, 'VFITX': 0.04, 'FXNAX': 0.04,
            'VTBIX': 0.05, 'FXSTX': 0.02, 'VBTIX': 0.04, 'FXTIX': 0.06,
            
            # Equity Mutual Funds - Large Cap
            'FXAIX': 0.15, 'VFIAX': 0.15, 'SWPPX': 0.15, 'FSKAX': 0.16,
            'VINIX': 0.15, 'FXAIX': 0.15, 'VTSAX': 0.16, 'SWTSX': 0.16,
            
            # Equity Mutual Funds - Mid/Small Cap
            'FSMDX': 0.20, 'VIMAX': 0.20, 'FSCSX': 0.24, 'VSMAX': 0.22,
            'FSKAX': 0.16, 'VTMGX': 0.18, 'FXNAX': 0.04,
            
            # International Mutual Funds
            'FTIHX': 0.18, 'VTIAX': 0.18, 'FXNAX': 0.04, 'VTMGX': 0.18,
            'FZILX': 0.18, 'VGTSX': 0.18, 'FDVV': 0.16, 'FXNAX': 0.04,
            
            # Target Date Funds (Age-based risk)
            'FXIFX': 0.12, 'VTTSX': 0.12, 'FDKLX': 0.14, 'VTTHX': 0.14,
            'FDEEX': 0.16, 'VFIFX': 0.16, 'FDEWX': 0.18, 'VTIVX': 0.18,
            
            # Small-cap and Growth (Higher Volatility)
            'VTWO': 0.24, 'VB': 0.22, 'IJR': 0.22, 'VTEB': 0.04, 'VUG': 0.18,
            'VOOG': 0.18, 'IWF': 0.18, 'VTV': 0.14, 'VOOV': 0.14,
            
            # Popular ARK ETFs (High Volatility Innovation)
            'ARKK': 0.55, 'ARKQ': 0.50, 'ARKW': 0.52, 'ARKG': 0.48, 'ARKF': 0.50,
        }
    
    def _build_asset_classifiers(self) -> Dict[str, Dict]:
        """Build pattern-based asset type classifiers"""
        return {
            'crypto_patterns': [
                'BTC', 'ETH', 'ADA', 'SOL', 'DOGE', 'BNB', 'XRP', 'MATIC', 
                'AVAX', 'DOT', 'LINK', 'CRYPTO', '-USD'
            ],
            'bond_patterns': [
                'AGG', 'BND', 'TLT', 'IEF', 'SHY', 'GOVT', 'BOND', 'TREAS',
                'BILL', 'NOTE', 'FTRB', 'VMBS', 'MBB', 'VTEB', 'MUB', 'HYG',
                'JNK', 'LQD', 'TIP', 'BNDX', 'EMB'
            ],
            'etf_patterns': [
                'SPY', 'VOO', 'VTI', 'QQQ', 'IWM', 'XL', 'VE', 'VW', 'I',
                'MDY', 'DIA', 'GLD', 'SLV', 'USO', 'TQQQ', 'SQQQ'
            ],
            'reit_patterns': [
                'REIT', 'AMT', 'CCI', 'EQIX', 'PLD', 'WELL', 'PSA', 'EXR',
                'AVB', 'EQR', 'VNQ', 'SCHH', 'XLRE'
            ],
            'mutual_fund_patterns': [
                'VFIAX', 'FXAIX', 'SWTSX', 'VTIAX', 'FTIHX', 'VBTLX', 'FXNAX', 
                'SWAGX', 'VTWAX', 'VTSAX', 'FZROX', 'FZILX', 'FTRBX', 'PTTAX',
                'VFITX', 'VTBIX', 'FXSTX', 'VBTIX', 'FXTIX', 'FSMDX', 'VIMAX',
                'FSCSX', 'VSMAX', 'FSKAX', 'VTMGX', 'VGTSX', 'FDVV', 'FXIFX',
                'VTTSX', 'FDKLX', 'VTTHX', 'FDEEX', 'VFIFX', 'FDEWX', 'VTIVX'
            ],
            'leveraged_patterns': [
                'TQQQ', 'SOXL', 'SPXL', 'UPRO', 'TECL', 'FAS', 'TNA', 'CURE',
                'SQQQ', 'SPXS', 'SOXS', 'FAZ', 'TZA', 'UVXY', 'VXX', 'SVXY'
            ]
        }
    
    def _build_sector_volatilities(self) -> Dict[str, float]:
        """Build sector-based average volatilities for unknown stocks"""
        return {
            'Technology': 0.30,
            'Biotechnology': 0.45,
            'Healthcare': 0.25,
            'Financial Services': 0.30,
            'Energy': 0.38,
            'Utilities': 0.17,
            'Consumer Staples': 0.18,
            'Consumer Cyclical': 0.25,
            'Industrial': 0.22,
            'Materials': 0.26,
            'Real Estate': 0.24,
            'Communication Services': 0.28,
            'Aerospace & Defense': 0.20,
            # Mutual Fund Categories
            'Bond Funds': 0.04,
            'Large-Cap Equity': 0.15,
            'Mid-Cap Equity': 0.20,
            'Small-Cap Equity': 0.24,
            'International Equity': 0.18,
            'Target Date Funds': 0.14,
            'Balanced Funds': 0.12
        }
    
    def get_asset_fundamentals(self, symbol: str) -> Optional[Dict]:
        """Get asset fundamentals from Alpha Vantage with caching"""
        # Check cache first
        cache_key = f"fundamentals_{symbol}"
        cached_data = self._get_cached_data(cache_key)
        if cached_data is not None:
            return cached_data
            
        if not self.alpha_vantage_key:
            return None
            
        url = "https://www.alphavantage.co/query"
        params = {
            'function': 'OVERVIEW',
            'symbol': symbol,
            'apikey': self.alpha_vantage_key
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            if 'Symbol' in data:
                result = {
                    'name': data.get('Name'),
                    'asset_type': data.get('AssetType', 'Unknown'),
                    'sector': data.get('Sector', 'Unknown'),
                    'industry': data.get('Industry', 'Unknown'),
                    'market_cap': data.get('MarketCapitalization', '0'),
                    'beta': float(data.get('Beta', '1.0')) if data.get('Beta', '').replace('.','').isdigit() else 1.0,
                    'pe_ratio': data.get('PERatio', 'N/A')
                }
                # Cache the result
                self._set_cached_data(cache_key, result)
                return result
        except Exception as e:
            print(f"Alpha Vantage API error for {symbol}: {e}")
            return None
    
    def get_historical_volatility_fmp(self, symbol: str) -> Optional[float]:
        """Calculate realized volatility using Financial Modeling Prep with caching"""
        # Check cache first
        cache_key = f"volatility_fmp_{symbol}"
        cached_data = self._get_cached_data(cache_key)
        if cached_data is not None:
            return cached_data
            
        if not self.fmp_key:
            return None
            
        url = f"https://financialmodelingprep.com/api/v3/historical-price-full/{symbol}"
        # `serietype=line` returns only closing NAV prices – more reliable for mutual funds
        params = {
            'apikey': self.fmp_key,
            'serietype': 'line',
            'timeseries': 252  # One trading year
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            if 'historical' in data and len(data['historical']) > 30:
                prices = [day['close'] for day in data['historical'][-252:]]  # Last year
                if len(prices) > 30:
                    returns = np.diff(np.log(prices))
                    volatility = np.std(returns) * np.sqrt(252)
                    # Cache the result
                    self._set_cached_data(cache_key, volatility)
                    return volatility
        except Exception as e:
            print(f"FMP API error for {symbol}: {e}")
            return None
    
    def classify_asset_type(self, symbol: str) -> Tuple[str, float]:
        """Classify asset type and estimate base volatility"""
        symbol_upper = symbol.upper()
        
        # Check for crypto
        if any(pattern in symbol_upper for pattern in self.asset_type_patterns['crypto_patterns']):
            return 'Cryptocurrency', 0.70
        
        # Check for leveraged ETFs
        if any(pattern in symbol_upper for pattern in self.asset_type_patterns['leveraged_patterns']):
            return 'Leveraged ETF', 0.60
        
        # Check for mutual funds (before bonds since some mutual funds contain bond patterns)
        if any(pattern in symbol_upper for pattern in self.asset_type_patterns['mutual_fund_patterns']):
            return 'Mutual Fund', 0.15
        
        # Check for mutual fund patterns by suffix/structure
        if (len(symbol_upper) == 5 and symbol_upper.endswith('X')) or \
           (symbol_upper.startswith(('V', 'F', 'SW')) and len(symbol_upper) >= 5):
            return 'Mutual Fund', 0.15
        
        # Check for bonds
        if any(pattern in symbol_upper for pattern in self.asset_type_patterns['bond_patterns']):
            return 'Bond/Treasury', 0.05
        
        # Check for REITs
        if any(pattern in symbol_upper for pattern in self.asset_type_patterns['reit_patterns']):
            return 'REIT', 0.24
        
        # Check for ETFs
        if any(pattern in symbol_upper for pattern in self.asset_type_patterns['etf_patterns']):
            return 'ETF', 0.18
        
        # Default to individual stock
        return 'Stock', 0.25
    
    def estimate_enhanced_volatility(self, symbol: str, use_api: bool = True) -> Dict:
        """
        Enhanced volatility estimation using multiple data sources and ML classification
        
        Args:
            symbol: Asset symbol to analyze
            use_api: Whether to use external APIs for data enrichment
            
        Returns:
            Dict with volatility estimate and metadata
        """
        result = {
            'symbol': symbol,
            'normalized_symbol': self._normalize_crypto_symbol(symbol),  # Add normalized symbol for transparency
            'estimated_volatility': 0.20,  # Default fallback
            'confidence': 'Low',
            'data_source': 'Pattern Matching',
            'asset_type': 'Unknown',
            'sector': 'Unknown',
            'methodology': 'Default',
            'name': None
        }
        
        # 1. Try to get historical volatility from yfinance FIRST (prioritize API data)
        try:
            # Normalize crypto symbols to ensure we get spot prices instead of ETFs
            normalized_symbol = self._normalize_crypto_symbol(symbol)
            
            # Primary fetch via Ticker.history (fast)
            ticker = yf.Ticker(normalized_symbol)
            hist = ticker.history(period="1y")
            
            # Some instruments (especially mutual funds) return an empty DataFrame.
            # Fall back to the slower but more reliable `yf.download` helper in that case.
            if hist is None or len(hist) < 30:
                hist = yf.download(normalized_symbol, period="1y", progress=False)

            if len(hist) > 30:
                price_col = 'Adj Close' if 'Adj Close' in hist.columns else 'Close'
                returns = hist[price_col].pct_change().dropna()
                yf_volatility = returns.std() * np.sqrt(252)

                result.update({
                    'estimated_volatility': float(yf_volatility),
                    'confidence': 'High' if len(hist) > 200 else 'Medium',
                    'data_source': 'Yahoo Finance Historical',
                    'methodology': 'Calculated Realized Volatility'
                })
                
                # Get basic info if available
                try:
                    info = ticker.info
                    # Populate human-readable name for display (funds often expose longName/shortName)
                    result['name'] = info.get('longName') or info.get('shortName') or result.get('name')
                    result['sector'] = info.get('sector', 'Unknown')
                    result['asset_type'] = info.get('quoteType', 'Unknown')
                    
                    # Log the symbol mapping for debugging
                    if normalized_symbol != symbol.upper():
                        print(f"Symbol mapping: {symbol} -> {normalized_symbol} (Name: {result['name']})")
                except:
                    pass
                    
                return result
        except Exception as e:
            print(f"Yahoo Finance error for {symbol}: {e}")
        
        # 2. Try external APIs if enabled
        if use_api:
            # Normalize symbol for API calls
            normalized_symbol = self._normalize_crypto_symbol(symbol)
            
            # Try Financial Modeling Prep for historical volatility
            fmp_vol = self.get_historical_volatility_fmp(normalized_symbol)
            if fmp_vol and 0.01 < fmp_vol < 2.0:  # Sanity check
                result.update({
                    'estimated_volatility': fmp_vol,
                    'confidence': 'High',
                    'data_source': 'Financial Modeling Prep',
                    'methodology': 'API Calculated Volatility'
                })
                return result
            
            # Try Alpha Vantage for fundamentals
            fundamentals = self.get_asset_fundamentals(normalized_symbol)
            if fundamentals:
                # Capture name if provided by Alpha Vantage
                if not result.get('name'):
                    result['name'] = fundamentals.get('name')
                result['sector'] = fundamentals['sector']
                result['asset_type'] = fundamentals['asset_type']
                
                # Use sector-based volatility if we have sector info
                if fundamentals['sector'] in self.sector_volatilities:
                    sector_vol = self.sector_volatilities[fundamentals['sector']]
                    # Adjust based on beta if available
                    beta = fundamentals.get('beta', 1.0)
                    adjusted_vol = sector_vol * beta
                    
                    result.update({
                        'estimated_volatility': adjusted_vol,
                        'confidence': 'Medium',
                        'data_source': 'Alpha Vantage + Sector Model',
                        'methodology': 'Sector-Based + Beta Adjustment'
                    })
                    return result
            
            # Rate limiting for free APIs
            time.sleep(0.1)  # Be respectful to free APIs
        
        # 3. Check enhanced volatility map as fallback (after API attempts)
        # Try both original and normalized symbols
        normalized_symbol = self._normalize_crypto_symbol(symbol)
        symbol_to_check = symbol.upper()
        
        if symbol_to_check in self.enhanced_volatility_map:
            # Get asset type from pattern matching since hardcoded map lacks it
            asset_type, _ = self.classify_asset_type(symbol)
            result.update({
                'estimated_volatility': self.enhanced_volatility_map[symbol_to_check],
                'confidence': 'Medium',  # Lower confidence since no API enrichment
                'data_source': 'Historical Database',
                'asset_type': asset_type,  # Use pattern-matched asset type
                'methodology': 'Known Asset + Pattern Classification'
            })
            return result
        elif normalized_symbol in self.enhanced_volatility_map:
            # Get asset type from pattern matching since hardcoded map lacks it
            asset_type, _ = self.classify_asset_type(symbol)
            result.update({
                'estimated_volatility': self.enhanced_volatility_map[normalized_symbol],
                'confidence': 'Medium',  # Lower confidence since no API enrichment
                'data_source': 'Historical Database',
                'asset_type': asset_type,  # Use pattern-matched asset type
                'methodology': 'Known Asset + Pattern Classification'
            })
            return result
        
        # 4. Use asset type classification as final fallback
        asset_type, base_vol = self.classify_asset_type(symbol)
        result.update({
            'estimated_volatility': base_vol,
            'confidence': 'Low',
            'data_source': 'Pattern Classification',
            'asset_type': asset_type,
            'methodology': 'Asset Type Pattern Matching'
        })
        
        return result
    
    def _get_crypto_symbol_mapping(self) -> Dict[str, str]:
        """Map common crypto symbols to their Yahoo Finance spot price symbols"""
        return {
            'BTC': 'BTC-USD',
            'ETH': 'ETH-USD',
            'ADA': 'ADA-USD',
            'SOL': 'SOL-USD',
            'DOGE': 'DOGE-USD',
            'BNB': 'BNB-USD',
            'XRP': 'XRP-USD',
            'MATIC': 'MATIC-USD',
            'AVAX': 'AVAX-USD',
            'DOT': 'DOT-USD',
            'LINK': 'LINK-USD',
            'LTC': 'LTC-USD',
            'BCH': 'BCH-USD',
            'XLM': 'XLM-USD',
            'VET': 'VET-USD',
            'TRX': 'TRX-USD',
            'ATOM': 'ATOM-USD',
            'NEAR': 'NEAR-USD',
            'FTM': 'FTM-USD',
            'ALGO': 'ALGO-USD',
            'ICP': 'ICP-USD',
            'FIL': 'FIL-USD',
            'THETA': 'THETA-USD',
            'XTZ': 'XTZ-USD',
            'EOS': 'EOS-USD',
            'AAVE': 'AAVE-USD',
            'UNI': 'UNI-USD',
            'SUSHI': 'SUSHI-USD',
            'COMP': 'COMP-USD',
            'MKR': 'MKR-USD',
            'YFI': 'YFI-USD',
            'SNX': 'SNX-USD',
            'CRV': 'CRV-USD',
            'BAL': 'BAL-USD',
            'REN': 'REN-USD',
            'ZRX': 'ZRX-USD',
            'BAT': 'BAT-USD',
            'MANA': 'MANA-USD',
            'SAND': 'SAND-USD',
            'ENJ': 'ENJ-USD',
            'CHZ': 'CHZ-USD',
            'HOT': 'HOT-USD',
            'ANKR': 'ANKR-USD',
            'ONE': 'ONE-USD',
            'HARMONY': 'ONE-USD',
            'IOTA': 'IOTA-USD',
            'NEO': 'NEO-USD',
            'GAS': 'GAS-USD',
            'ONT': 'ONT-USD',
            'QTUM': 'QTUM-USD',
            'ICX': 'ICX-USD',
            'ZIL': 'ZIL-USD',
            'ZEN': 'ZEN-USD',
            'RVN': 'RVN-USD',
            'XMR': 'XMR-USD',
            'DASH': 'DASH-USD',
            'ZEC': 'ZEC-USD',
            'XEM': 'XEM-USD',
            'WAVES': 'WAVES-USD',
            'OMG': 'OMG-USD',
            'KNC': 'KNC-USD',
            'STORJ': 'STORJ-USD',
            'SKL': 'SKL-USD',
            'GRT': 'GRT-USD',
            '1INCH': '1INCH-USD',
            'CAKE': 'CAKE-USD',
            'BAKE': 'BAKE-USD',
            'DODO': 'DODO-USD',
            'ALPHA': 'ALPHA-USD',
            'PERP': 'PERP-USD',
            'RLC': 'RLC-USD',
            'OCEAN': 'OCEAN-USD',
            'BAND': 'BAND-USD',
            'NMR': 'NMR-USD',
            'MLN': 'MLN-USD',
            'REP': 'REP-USD',
            'KEEP': 'KEEP-USD',
            'NU': 'NU-USD',
            'UMA': 'UMA-USD',
            'BADGER': 'BADGER-USD',
            'FARM': 'FARM-USD',
            'PICKLE': 'PICKLE-USD',
            'CREAM': 'CREAM-USD',
            'COVER': 'COVER-USD',
            'HEGIC': 'HEGIC-USD',
            'API3': 'API3-USD',
            'POND': 'POND-USD',
            'ALPHA': 'ALPHA-USD',
            'PERP': 'PERP-USD',
            'RLC': 'RLC-USD',
            'OCEAN': 'OCEAN-USD',
            'BAND': 'BAND-USD',
            'NMR': 'NMR-USD',
            'MLN': 'MLN-USD',
            'REP': 'REP-USD',
            'KEEP': 'KEEP-USD',
            'NU': 'NU-USD',
            'UMA': 'UMA-USD',
            'BADGER': 'BADGER-USD',
            'FARM': 'FARM-USD',
            'PICKLE': 'PICKLE-USD',
            'CREAM': 'CREAM-USD',
            'COVER': 'COVER-USD',
            'HEGIC': 'HEGIC-USD',
            'API3': 'API3-USD',
            'POND': 'POND-USD',
        }
    
    def _normalize_crypto_symbol(self, symbol: str) -> str:
        """Normalize cryptocurrency symbols to ensure we get spot prices instead of ETFs"""
        symbol_upper = symbol.upper()
        crypto_mapping = self._get_crypto_symbol_mapping()
        
        # If it's a known crypto symbol, map to spot price
        if symbol_upper in crypto_mapping:
            return crypto_mapping[symbol_upper]
        
        # If it already has -USD suffix, return as is
        if symbol_upper.endswith('-USD'):
            return symbol_upper
        
        # If it's a 3-4 letter symbol that might be crypto, try adding -USD
        if len(symbol_upper) <= 4 and symbol_upper.isalpha():
            # Check if it's in our crypto patterns
            if any(pattern in symbol_upper for pattern in self.asset_type_patterns['crypto_patterns']):
                return f"{symbol_upper}-USD"
        
        return symbol_upper
    
    def estimate_portfolio_volatility_enhanced(self, portfolio_df: pd.DataFrame, 
                                             use_apis: bool = True) -> Dict:
        """
        Enhanced portfolio volatility estimation with comprehensive asset coverage
        
        Args:
            portfolio_df: DataFrame with Ticker and Weight columns
            use_apis: Whether to use external APIs for unknown assets
            
        Returns:
            Dict with portfolio volatility and detailed asset breakdown
        """
        if 'Ticker' not in portfolio_df.columns or 'Weight' not in portfolio_df.columns:
            raise ValueError("Portfolio DataFrame must have 'Ticker' and 'Weight' columns")
        
        # Normalize weights
        weights = portfolio_df['Weight'].values
        weights = weights / weights.sum()
        
        asset_volatilities = []
        asset_details = []
        
        print(f"Analyzing {len(portfolio_df)} assets with enhanced volatility estimation...")
        
        for i, (_, row) in enumerate(portfolio_df.iterrows()):
            ticker = row['Ticker']
            weight = weights[i]
            
            # Get enhanced volatility estimate
            vol_result = self.estimate_enhanced_volatility(ticker, use_api=use_apis)
            asset_vol = vol_result['estimated_volatility']
            
            asset_volatilities.append(asset_vol)
            asset_details.append({
                'ticker': ticker,
                'weight': weight,
                'volatility': asset_vol,
                'confidence': vol_result['confidence'],
                'data_source': vol_result['data_source'],
                'asset_type': vol_result['asset_type'],
                'sector': vol_result['sector'],
                'methodology': vol_result['methodology'],
                'name': vol_result.get('name')
            })
            
            print(f"  {ticker}: {asset_vol:.1%} ({vol_result['confidence']} confidence, {vol_result['data_source']})")
        
        # Calculate portfolio volatility using real correlations from CorrelationAnalyzer
        asset_volatilities = np.array(asset_volatilities)
        
        # Weighted average approach (conservative)
        weighted_avg_vol = np.sum(weights * asset_volatilities)
        
        # Get real correlation data from CorrelationAnalyzer
        correlation_result = self.correlation_analyzer.analyze_portfolio_correlations(portfolio_df)
        
        if correlation_result['success'] and len(portfolio_df) > 1:
            # Use actual correlation matrix if available
            try:
                correlation_matrix = pd.DataFrame(correlation_result['correlation_matrix'])
                
                # Calculate portfolio volatility using real correlations
                variance_sum = np.sum((weights * asset_volatilities) ** 2)
                covariance_sum = 0
                
                for i in range(len(weights)):
                    for j in range(len(weights)):
                        if i != j:
                            # Get correlation from matrix (handle potential missing values)
                            corr_value = correlation_matrix.iloc[i, j]
                            if pd.isna(corr_value):
                                corr_value = 0.6  # Fallback to assumption if correlation is missing
                            covariance_sum += weights[i] * weights[j] * asset_volatilities[i] * asset_volatilities[j] * corr_value
                
                portfolio_volatility = np.sqrt(variance_sum + covariance_sum)
                correlation_method = "Real Correlation Matrix"
                avg_correlation = correlation_result.get('average_correlation', 0.6)
                
            except Exception as e:
                print(f"Error using real correlation matrix: {e}")
                # Fall back to average correlation approach
                avg_correlation = correlation_result.get('average_correlation', 0.6)
                variance_sum = np.sum((weights * asset_volatilities) ** 2)
                covariance_sum = avg_correlation * np.sum([
                    weights[i] * weights[j] * asset_volatilities[i] * asset_volatilities[j]
                    for i in range(len(weights))
                    for j in range(len(weights))
                    if i != j
                ])
                portfolio_volatility = np.sqrt(variance_sum + covariance_sum)
                correlation_method = "Average Correlation from Analysis"
        else:
            # Fall back to assumption-based approach
            avg_correlation = 0.6
            variance_sum = np.sum((weights * asset_volatilities) ** 2)
            covariance_sum = avg_correlation * np.sum([
                weights[i] * weights[j] * asset_volatilities[i] * asset_volatilities[j]
                for i in range(len(weights))
                for j in range(len(weights))
                if i != j
            ])
            portfolio_volatility = np.sqrt(variance_sum + covariance_sum)
            correlation_method = "Assumption (0.6 correlation)"
        
        return {
            'portfolio_volatility': portfolio_volatility,
            'weighted_average_volatility': weighted_avg_vol,
            'diversification_benefit': weighted_avg_vol - portfolio_volatility,
            'asset_details': asset_details,
            'confidence_distribution': {
                'high': sum(1 for detail in asset_details if detail['confidence'] == 'High'),
                'medium': sum(1 for detail in asset_details if detail['confidence'] == 'Medium'),
                'low': sum(1 for detail in asset_details if detail['confidence'] == 'Low')
            },
            'correlation_analysis': {
                'method_used': correlation_method,
                'average_correlation': avg_correlation,
                'correlation_success': correlation_result.get('success', False),
                'correlation_data': correlation_result
            }
        }

# Example usage and testing
if __name__ == "__main__":
    # Initialize estimator (API keys loaded from .env file)
    estimator = EnhancedVolatilityEstimator()
    
    # Test with sample portfolio
    sample_portfolio = pd.DataFrame({
        'Ticker': ['AAPL', 'UNKNOWN_STOCK', 'CRYPTO_TOKEN', 'FIDELITY_FUND'],
        'Weight': [0.4, 0.3, 0.2, 0.1]
    })
    
    # Get enhanced volatility estimates
    result = estimator.estimate_portfolio_volatility_enhanced(sample_portfolio, use_apis=False)
    
    print(f"\nPortfolio Volatility: {result['portfolio_volatility']:.1%}")
    print(f"Diversification Benefit: {result['diversification_benefit']:.1%}")
    print(f"Confidence: {result['confidence_distribution']}")