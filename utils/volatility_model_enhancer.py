"""
Volatility Model Enhancer - Integration layer for the existing portfolio volatility system
"""

import os
import pandas as pd
import numpy as np
from typing import Dict, List, Optional
from dotenv import load_dotenv
from utils.enhanced_volatility_estimator import EnhancedVolatilityEstimator
from utils.simple_model_trainer import PortfolioVolatilityTrainer

# Load environment variables
load_dotenv()

class VolatilityModelEnhancer:
    """
    Enhances the existing portfolio volatility model with improved asset coverage
    and multiple data sources for unseen assets.
    """
    
    def __init__(self, alpha_vantage_key: Optional[str] = None, fmp_key: Optional[str] = None):
        """
        Initialize the volatility model enhancer.
        
        Args:
            alpha_vantage_key: Optional Alpha Vantage API key for enhanced data (defaults to env var)
            fmp_key: Optional Financial Modeling Prep API key for enhanced data (defaults to env var)
        """
        # Use environment variables as defaults if not provided
        if alpha_vantage_key is None:
            alpha_vantage_key = os.getenv('ALPHA_VANTAGE_KEY') or os.getenv('ALPHA_VANTAGE_API_KEY')
        if fmp_key is None:
            fmp_key = os.getenv('FMP_KEY') or os.getenv('FMP_API_KEY')
        self.original_trainer = PortfolioVolatilityTrainer()
        
        # Try to load the trained model if it exists
        try:
            self.original_trainer.load_model("model/portfolio_volatility_model.pkl")
            print("✅ Loaded trained portfolio volatility model")
        except Exception as e:
            print(f"ℹ️ No trained model found (will use enhanced estimation only): {e}")
        
        self.enhanced_estimator = EnhancedVolatilityEstimator(
            alpha_vantage_key=alpha_vantage_key,
            fmp_key=fmp_key
        )
        
        # Track which assets were unknown to original model
        self.unknown_assets = set()
        self.enhancement_stats = {
            'total_assets_analyzed': 0,
            'assets_found_in_original': 0,
            'assets_enhanced_via_api': 0,
            'assets_classified_by_pattern': 0,
            'confidence_improvements': 0
        }
    
    def analyze_portfolio_coverage(self, portfolio_df: pd.DataFrame, use_apis: bool = True) -> Dict:
        """
        Analyze what percentage of portfolio assets can be successfully analyzed by the enhanced model.
        
        Args:
            portfolio_df: Portfolio with Ticker and Weight columns
            use_apis: Whether APIs are being used for enhanced coverage
            
        Returns:
            Dict with coverage analysis
        """
        total_assets = len(portfolio_df)
        total_weight = portfolio_df['Weight'].sum()
        
        covered_assets = []
        unknown_assets = []
        covered_weight = 0
        unknown_weight = 0
        high_confidence_assets = []
        
        for _, row in portfolio_df.iterrows():
            ticker = row['Ticker'].upper()
            weight = row['Weight']
            
            # Test if we can get a high-confidence estimate for this asset
            try:
                vol_result = self.enhanced_estimator.estimate_enhanced_volatility(ticker, use_api=use_apis)
                
                # Consider asset "covered" if we get high or medium confidence
                if vol_result['confidence'] in ['High', 'Medium']:
                    covered_assets.append(ticker)
                    covered_weight += weight
                    if vol_result['confidence'] == 'High':
                        high_confidence_assets.append(ticker)
                else:
                    unknown_assets.append(ticker)
                    unknown_weight += weight
                    self.unknown_assets.add(ticker)
                    
            except Exception as e:
                # If estimation fails, consider it unknown
                unknown_assets.append(ticker)
                unknown_weight += weight
                self.unknown_assets.add(ticker)
        
        coverage_by_count = len(covered_assets) / total_assets if total_assets > 0 else 0
        coverage_by_weight = covered_weight / total_weight if total_weight > 0 else 0
        
        return {
            'total_assets': total_assets,
            'covered_assets': len(covered_assets),
            'unknown_assets': len(unknown_assets),
            'coverage_by_count': coverage_by_count,
            'coverage_by_weight': coverage_by_weight,
            'unknown_asset_list': unknown_assets,
            'high_confidence_assets': len(high_confidence_assets),
            'improvement_potential': 1 - coverage_by_weight
        }
    
    def get_enhanced_asset_volatility(self, ticker: str, use_apis: bool = True) -> Dict:
        """
        Get volatility estimate for a single asset using enhanced methods.
        
        Args:
            ticker: Asset ticker symbol
            use_apis: Whether to use external APIs
            
        Returns:
            Dict with volatility estimate and metadata
        """
        # Use enhanced estimator first (prioritizes real API data over hardcoded values)
        enhanced_result = self.enhanced_estimator.estimate_enhanced_volatility(ticker, use_api=use_apis)
        
        self.enhancement_stats['total_assets_analyzed'] += 1
        
        if enhanced_result['confidence'] == 'High':
            self.enhancement_stats['assets_enhanced_via_api'] += 1
        else:
            self.enhancement_stats['assets_classified_by_pattern'] += 1
        
        return {
            'volatility': enhanced_result['estimated_volatility'],
            'source': 'enhanced_estimator',
            'confidence': enhanced_result['confidence'].lower(),
            'method': enhanced_result['methodology'],
            'data_source': enhanced_result['data_source'],
            'asset_type': enhanced_result['asset_type'],
            'sector': enhanced_result['sector'],
            'name': enhanced_result.get('name')
        }
    
    def predict_volatility_enhanced(self, portfolio_df: pd.DataFrame, 
                                  forecast_days: int = 20, 
                                  use_apis: bool = True) -> Dict:
        """
        Enhanced volatility prediction that combines original model with improved coverage.
        
        Args:
            portfolio_df: Portfolio DataFrame with Ticker and Weight columns
            forecast_days: Number of days to forecast
            use_apis: Whether to use external APIs for unknown assets
            
        Returns:
            Enhanced prediction results
        """
        print(f"🔍 Analyzing portfolio with {len(portfolio_df)} assets...")
        
        # Get enhanced volatility estimates for all assets (combines coverage analysis and prediction)
        enhanced_asset_details = []
        asset_volatilities = []
        weights = portfolio_df['Weight'].values / portfolio_df['Weight'].sum()
        
        covered_assets = 0
        covered_weight = 0
        high_confidence_assets = 0
        unknown_assets = []
        
        for i, (_, row) in enumerate(portfolio_df.iterrows()):
            ticker = row['Ticker']
            weight = weights[i]
            
            # Get enhanced estimate
            vol_result = self.get_enhanced_asset_volatility(ticker, use_apis=use_apis)
            asset_vol = vol_result['volatility']
            
            asset_volatilities.append(asset_vol)
            enhanced_asset_details.append({
                'ticker': ticker,
                'weight': weight,
                'volatility': asset_vol,
                'confidence': vol_result['confidence'],
                'source': vol_result['source'],
                'method': vol_result.get('method', 'unknown'),
                'asset_type': vol_result.get('asset_type', 'Unknown'),
                'sector': vol_result.get('sector', 'Unknown'),
                'name': vol_result.get('name')
            })
            
            # Track coverage statistics
            if vol_result['confidence'] in ['high', 'medium', 'High', 'Medium']:
                covered_assets += 1
                covered_weight += weight
                if vol_result['confidence'] in ['high', 'High']:
                    high_confidence_assets += 1
            else:
                unknown_assets.append(ticker)
            
            print(f"  📈 {ticker}: {asset_vol:.1%} ({vol_result['confidence']} confidence)")
        
        # Create coverage analysis from the results
        total_assets = len(portfolio_df)
        total_weight = weights.sum()
        coverage = {
            'total_assets': total_assets,
            'covered_assets': covered_assets,
            'unknown_assets': len(unknown_assets),
            'coverage_by_count': covered_assets / total_assets if total_assets > 0 else 0,
            'coverage_by_weight': covered_weight / total_weight if total_weight > 0 else 0,
            'unknown_asset_list': unknown_assets,
            'high_confidence_assets': high_confidence_assets,
            'improvement_potential': 1 - (covered_weight / total_weight) if total_weight > 0 else 0
        }
        
        print(f"📊 Coverage Analysis:")
        print(f"  • Known assets: {coverage['covered_assets']}/{coverage['total_assets']} ({coverage['coverage_by_count']:.1%})")
        print(f"  • Weight coverage: {coverage['coverage_by_weight']:.1%}")
        print(f"  • Unknown assets: {', '.join(coverage['unknown_asset_list'][:5])}")
        
        # Calculate portfolio volatility using enhanced estimates (1y realized base)
        base_portfolio_vol = self._calculate_portfolio_volatility(weights, asset_volatilities)

        # Try original model for a bounded ML adjustment (forward-looking tilt)
        original_result = None
        try:
            original_result = self.original_trainer.predict_volatility(portfolio_df, forecast_days)
            original_vol = original_result['predicted_volatility'][0] if original_result['predicted_volatility'] else None
        except Exception as e:
            print(f"⚠️ Original model failed: {e}")
            original_vol = None

        # Compute bounded ML multiplier to adjust the realized base slightly
        if original_vol is not None and base_portfolio_vol and base_portfolio_vol > 0:
            ml_multiplier = np.clip(original_vol / base_portfolio_vol, 0.85, 1.15)
        else:
            ml_multiplier = 1.0

        final_portfolio_vol = base_portfolio_vol * ml_multiplier

        # Create forecast array using the single ML-adjusted volatility
        forecast = [final_portfolio_vol] * forecast_days
        
        # Calculate improvement metrics
        confidence_dist = {}
        for detail in enhanced_asset_details:
            conf = detail['confidence']
            confidence_dist[conf] = confidence_dist.get(conf, 0) + detail['weight']
        
        # Determine overall confidence
        if confidence_dist.get('high', 0) > 0.7:
            overall_confidence = 'High'
        elif confidence_dist.get('high', 0) + confidence_dist.get('medium', 0) > 0.8:
            overall_confidence = 'Medium'
        else:
            overall_confidence = 'Low'
        
        return {
            'forecast_days': forecast_days,
            'predicted_volatility': forecast,
            'final_volatility': final_portfolio_vol,
            'method': 'enhanced_1y_realized_ml_adjusted',
            'labels': {
                'window': '1y realized',
                'ml_adjustment': f'{ml_multiplier:.2f}x'
            },
            'enhanced_volatility': base_portfolio_vol,
            'original_volatility': original_vol,
            'improvement': self._calculate_improvement(base_portfolio_vol, original_vol),
            'coverage_analysis': coverage,
            'asset_details': enhanced_asset_details,
            'confidence_distribution': confidence_dist,
            'overall_confidence': overall_confidence,
            'enhancement_stats': self.enhancement_stats.copy(),
            'interpretation': self._interpret_enhanced_prediction(final_portfolio_vol),
            'model_type': 'enhanced_multi_source',
            'data_sources_used': self._get_data_sources_used(enhanced_asset_details)
        }
    
    def _calculate_portfolio_volatility(self, weights: np.ndarray, 
                                      asset_volatilities: List[float]) -> float:
        """
        Calculate portfolio volatility using improved correlation estimates.
        """
        asset_vols = np.array(asset_volatilities)
        
        # Weighted average (no diversification)
        weighted_avg = np.sum(weights * asset_vols)
        
        # Apply diversification benefit based on portfolio composition
        # More sophisticated than simple 0.6 correlation assumption
        n_assets = len(weights)
        
        if n_assets == 1:
            correlation_factor = 1.0
        elif n_assets <= 3:
            correlation_factor = 0.85  # Limited diversification
        elif n_assets <= 10:
            correlation_factor = 0.75  # Good diversification
        else:
            correlation_factor = 0.65  # Excellent diversification
        
        # Check for asset type diversification
        # This would be more sophisticated with actual correlation data
        diversified_vol = weighted_avg * np.sqrt(correlation_factor)
        
        return diversified_vol
    
    def _calculate_improvement(self, enhanced_vol: float, original_vol: Optional[float]) -> Dict:
        """Calculate improvement metrics vs original model."""
        if original_vol is None:
            return {
                'available': False,
                'message': 'Original model not available for comparison'
            }
        
        diff = enhanced_vol - original_vol
        pct_diff = (diff / original_vol) * 100 if original_vol != 0 else 0
        
        return {
            'available': True,
            'absolute_difference': diff,
            'percentage_difference': pct_diff,
            'enhanced_vol': enhanced_vol,
            'original_vol': original_vol,
            'interpretation': self._interpret_improvement(pct_diff)
        }
    
    def _interpret_improvement(self, pct_diff: float) -> str:
        """Interpret the improvement between enhanced and original model."""
        if abs(pct_diff) < 2:
            return "Similar estimates - enhanced model confirms original"
        elif pct_diff > 5:
            return "Enhanced model suggests higher risk than original"
        elif pct_diff < -5:
            return "Enhanced model suggests lower risk than original"
        else:
            return "Slight difference - enhanced model provides refinement"
    
    def _interpret_enhanced_prediction(self, volatility: float) -> Dict:
        """Enhanced interpretation with more context."""
        base_interp = self.original_trainer._interpret_prediction(volatility)
        
        # Add enhanced context with unified terminology
        if volatility < 0.05:
            risk_category = "Very Low"
            description = "Extremely conservative portfolio (likely heavy in treasury bonds/cash)"
        elif volatility < 0.12:
            risk_category = "Very Low"
            description = base_interp['description']
        elif volatility < 0.18:
            risk_category = "Low"
            description = base_interp['description']
        elif volatility < 0.25:
            risk_category = "Moderate"
            description = base_interp['description']
        elif volatility < 0.35:
            risk_category = "High"
            description = base_interp['description']
        elif volatility < 0.50:
            risk_category = "Very High"
            description = base_interp['description']
        elif volatility < 0.70:
            risk_category = "Very High"
            description = "Very high volatility portfolio (likely includes crypto/leveraged instruments)"
        else:
            risk_category = "Very High"
            description = "Extreme volatility portfolio (crypto-heavy or highly leveraged)"
        
        return {
            'risk_level': risk_category,
            'description': description,
            'annual_volatility_pct': f"{volatility * 100:.1f}%",
            'volatility_range': self._calculate_volatility_range(volatility)
        }
    
    def _calculate_volatility_range(self, volatility: float) -> Dict:
        """Calculate expected return range based on volatility."""
        # Assuming normal distribution, 68% of outcomes fall within 1 std dev
        return {
            'one_sigma_range': f"±{volatility * 100:.1f}%",
            'two_sigma_range': f"±{volatility * 2 * 100:.1f}%",
            'description': f"68% chance annual returns fall within ±{volatility * 100:.1f}%"
        }
    
    def _get_data_sources_used(self, asset_details: List[Dict]) -> List[str]:
        """Get list of unique data sources used in analysis."""
        sources = set()
        for detail in asset_details:
            if 'source' in detail:
                sources.add(detail['source'])
            if 'method' in detail:
                sources.add(detail['method'])
        return list(sources)
    
    def generate_enhancement_report(self, portfolio_df: pd.DataFrame) -> str:
        """
        Generate a comprehensive report on portfolio analysis enhancements.
        
        Args:
            portfolio_df: Portfolio DataFrame
            
        Returns:
            Formatted enhancement report
        """
        result = self.predict_volatility_enhanced(portfolio_df, use_apis=False)  # Quick analysis
        
        report = f"""
📊 PORTFOLIO VOLATILITY ENHANCEMENT REPORT
{'='*50}

🎯 PORTFOLIO SUMMARY
Total Assets: {len(portfolio_df)}
Enhanced Volatility Estimate: {result['enhanced_volatility']:.1%}
Risk Level: {result['interpretation']['risk_level']}
Overall Confidence: {result['overall_confidence']}

📈 COVERAGE ANALYSIS
Known Assets: {result['coverage_analysis']['covered_assets']}/{result['coverage_analysis']['total_assets']} ({result['coverage_analysis']['coverage_by_count']:.1%})
Weight Coverage: {result['coverage_analysis']['coverage_by_weight']:.1%}
Improvement Potential: {result['coverage_analysis']['improvement_potential']:.1%}

🔍 ASSET BREAKDOWN
"""
        
        for detail in result['asset_details']:
            report += f"  {detail['ticker']:8} | {detail['volatility']:6.1%} | {detail['weight']:6.1%} | {detail['confidence']:6} | {detail['asset_type']}\n"
        
        report += f"""
📊 CONFIDENCE DISTRIBUTION
"""
        for conf, weight in result['confidence_distribution'].items():
            report += f"  {conf.title():8}: {weight:.1%} of portfolio weight\n"
        
        if result['improvement']['available']:
            report += f"""
🔄 VS ORIGINAL MODEL
Enhanced: {result['improvement']['enhanced_vol']:.1%}
Original: {result['improvement']['original_vol']:.1%}
Difference: {result['improvement']['percentage_difference']:+.1f}%
{result['improvement']['interpretation']}
"""
        
        report += f"""
🎯 RECOMMENDATIONS
{self._generate_recommendations(result)}
        """
        
        return report
    
    def _generate_recommendations(self, result: Dict) -> str:
        """Generate actionable recommendations based on analysis."""
        recommendations = []
        
        # Coverage recommendations
        if result['coverage_analysis']['coverage_by_weight'] < 0.8:
            recommendations.append("• Consider using API keys for better volatility estimates of unknown assets")
        
        # Risk level recommendations
        vol = result['enhanced_volatility']
        if vol > 0.4:
            recommendations.append("• Portfolio has high volatility - consider reducing allocation to risky assets")
        elif vol < 0.1:
            recommendations.append("• Portfolio is very conservative - consider adding growth assets if appropriate")
        
        # Confidence recommendations
        if result['overall_confidence'] == 'Low':
            recommendations.append("• Low confidence in estimates - consider manual review of unknown assets")
        
        # Asset-specific recommendations
        high_vol_assets = [d for d in result['asset_details'] if d['volatility'] > 0.5]
        if high_vol_assets:
            tickers = [d['ticker'] for d in high_vol_assets[:3]]
            recommendations.append(f"• High volatility assets detected: {', '.join(tickers)} - monitor closely")
        
        return "\n".join(recommendations) if recommendations else "• Portfolio analysis looks comprehensive"


# Example usage
if __name__ == "__main__":
    # Initialize enhancer
    enhancer = VolatilityModelEnhancer()
    
    # Test with sample portfolio including unknown assets
    sample_portfolio = pd.DataFrame({
        'Ticker': ['AAPL', 'UNKNOWN_ETF', 'CRYPTO_TOKEN', 'BOND_FUND', 'SMALL_CAP_STOCK'],
        'Weight': [0.3, 0.25, 0.15, 0.2, 0.1]
    })
    
    # Generate enhanced prediction
    result = enhancer.predict_volatility_enhanced(sample_portfolio, use_apis=False)
    
    # Print results
    print(f"Enhanced Portfolio Volatility: {result['enhanced_volatility']:.1%}")
    print(f"Confidence: {result['overall_confidence']}")
    
    # Generate full report
    report = enhancer.generate_enhancement_report(sample_portfolio)
    print("\n" + report)