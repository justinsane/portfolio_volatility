"""
Main Risk Analyzer - Orchestrates all risk metric calculations
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any
import logging
from .correlation_analyzer import CorrelationAnalyzer

logger = logging.getLogger(__name__)

class RiskAnalyzer:
    """
    Main risk analyzer that orchestrates all risk metric calculations.
    """
    
    def __init__(self):
        """
        Initialize the risk analyzer with all analysis modules.
        """
        self.correlation_analyzer = CorrelationAnalyzer()
        
    def analyze_portfolio_risk(self, portfolio_df: pd.DataFrame) -> Dict:
        """
        Perform comprehensive risk analysis on a portfolio.
        
        Args:
            portfolio_df: Portfolio DataFrame with Ticker and Weight columns
            
        Returns:
            Dict containing all risk analysis results
        """
        try:
            # Validate input
            if portfolio_df.empty:
                return self._create_error_result("Portfolio data is empty")
            
            required_columns = ['Ticker', 'Weight']
            missing_columns = [col for col in required_columns if col not in portfolio_df.columns]
            if missing_columns:
                return self._create_error_result(f"Missing required columns: {missing_columns}")
            
            # Store portfolio data for asset type analysis
            self._current_portfolio_df = portfolio_df.copy()
            
            # Perform correlation and concentration analysis
            correlation_results = self.correlation_analyzer.analyze_portfolio_correlations(portfolio_df)
            
            # Compile comprehensive risk report
            risk_report = self._compile_risk_report(portfolio_df, correlation_results)
            
            return risk_report
            
        except Exception as e:
            logger.error(f"Error in risk analysis: {str(e)}")
            return self._create_error_result(f"Risk analysis failed: {str(e)}")
    
    def _compile_risk_report(self, portfolio_df: pd.DataFrame, correlation_results: Dict) -> Dict:
        """
        Compile a comprehensive risk report from all analysis results.
        
        Args:
            portfolio_df: Portfolio DataFrame
            correlation_results: Results from correlation analysis
            
        Returns:
            Comprehensive risk report
        """
        # Calculate basic portfolio statistics
        total_assets = len(portfolio_df)
        total_weight = portfolio_df['Weight'].sum()
        normalized_weights = portfolio_df['Weight'] / total_weight
        
        # Create risk summary
        risk_summary = self._create_risk_summary(correlation_results)
        
        # Create detailed risk metrics
        risk_metrics = {
            'correlation_analysis': correlation_results,
            'portfolio_summary': {
                'total_assets': total_assets,
                'total_weight': round(total_weight, 3),
                'weight_distribution': {
                    'min_weight': round(normalized_weights.min(), 3),
                    'max_weight': round(normalized_weights.max(), 3),
                    'avg_weight': round(normalized_weights.mean(), 3)
                }
            },
            'risk_summary': risk_summary,
            'recommendations': self._generate_risk_recommendations(correlation_results, portfolio_df)
        }
        
        # Convert numpy types to native Python types for JSON serialization
        risk_metrics = self._convert_numpy_types(risk_metrics)
        
        return {
            'success': True,
            'risk_metrics': risk_metrics,
            'analysis_timestamp': pd.Timestamp.now().isoformat()
        }
    
    def _create_risk_summary(self, correlation_results: Dict) -> Dict:
        """
        Create a summary of key risk metrics.
        
        Args:
            correlation_results: Results from correlation analysis
            
        Returns:
            Risk summary dictionary
        """
        correlation_pair = correlation_results.get('most_correlated_pair', {})
        concentration = correlation_results.get('concentration_metrics', {})
        
        # Determine overall risk level
        risk_level = self._determine_overall_risk_level(correlation_pair, concentration)
        
        return {
            'overall_risk_level': risk_level['level'],
            'risk_score': risk_level['score'],
            'risk_color': risk_level['color'],
            'key_concerns': self._identify_key_concerns(correlation_results),
            'diversification_score': self._calculate_diversification_score(correlation_results)
        }
    
    def _determine_overall_risk_level(self, correlation_pair: Dict, concentration: Dict) -> Dict:
        """
        Determine overall portfolio risk level based on correlation and concentration.
        
        Args:
            correlation_pair: Most correlated pair information
            concentration: Concentration metrics
            
        Returns:
            Risk level information
        """
        # Extract risk indicators
        correlation_level = correlation_pair.get('correlation_level', 'Unknown')
        concentration_level = concentration.get('concentration_level', 'Unknown')
        hhi = concentration.get('hhi', 0)
        correlation_value = correlation_pair.get('correlation', 0)
        
        # Calculate risk score (0-100)
        risk_score = 0
        
        # Correlation risk (40% weight)
        if correlation_level == "Very High":
            risk_score += 40
        elif correlation_level == "High":
            risk_score += 30
        elif correlation_level == "Moderate":
            risk_score += 20
        elif correlation_level == "Low":
            risk_score += 10
        
        # Concentration risk (60% weight)
        if concentration_level == "Very High":
            risk_score += 60
        elif concentration_level == "High":
            risk_score += 45
        elif concentration_level == "Moderate":
            risk_score += 30
        elif concentration_level == "Low":
            risk_score += 15
        
        # Determine risk level
        if risk_score >= 80:
            level = "Very High"
            color = "#dc3545"
        elif risk_score >= 60:
            level = "High"
            color = "#fd7e14"
        elif risk_score >= 40:
            level = "Moderate"
            color = "#ffc107"
        elif risk_score >= 20:
            level = "Low"
            color = "#20c997"
        else:
            level = "Very Low"
            color = "#28a745"
        
        return {
            'level': level,
            'score': risk_score,
            'color': color
        }
    
    def _identify_key_concerns(self, correlation_results: Dict) -> List[str]:
        """
        Identify key risk concerns based on analysis results.
        
        Args:
            correlation_results: Results from correlation analysis
            
        Returns:
            List of key concerns
        """
        concerns = []
        
        # Check if this is a single asset portfolio
        if correlation_results.get('single_asset_portfolio', False):
            concerns.append("Single asset portfolio - high concentration risk")
            concerns.append("No diversification benefits - consider adding more assets")
            return concerns
        
        correlation_pair = correlation_results.get('most_correlated_pair', {})
        concentration = correlation_results.get('concentration_metrics', {})
        
        # Check correlation concerns (only if correlation analysis was successful)
        if correlation_results.get('success', False):
            correlation_value = correlation_pair.get('correlation', 0)
            if correlation_value >= 0.8:
                concerns.append(f"Very high correlation ({correlation_value:.1%}) between {correlation_pair.get('asset1', 'N/A')} and {correlation_pair.get('asset2', 'N/A')}")
            elif correlation_value >= 0.6:
                concerns.append(f"High correlation ({correlation_value:.1%}) between {correlation_pair.get('asset1', 'N/A')} and {correlation_pair.get('asset2', 'N/A')}")
        
        # Check concentration concerns
        hhi = concentration.get('hhi', 0)
        if hhi >= 0.25:
            concerns.append(f"Very high portfolio concentration (HHI: {hhi:.3f})")
        elif hhi >= 0.15:
            concerns.append(f"High portfolio concentration (HHI: {hhi:.3f})")
        
        largest_holding = concentration.get('largest_holding', {})
        largest_weight = largest_holding.get('percentage', 0)
        if largest_weight >= 20:
            concerns.append(f"Large single holding: {largest_holding.get('ticker', 'N/A')} at {largest_weight:.1f}%")
        elif largest_weight >= 10:
            concerns.append(f"Significant single holding: {largest_holding.get('ticker', 'N/A')} at {largest_weight:.1f}%")
        
        # Check top 3 concentration
        top_3_concentration = concentration.get('top_3_concentration', 0)
        if top_3_concentration >= 0.6:
            concerns.append(f"Top 3 holdings represent {top_3_concentration:.1%} of portfolio")
        
        if not concerns:
            concerns.append("No significant risk concerns identified")
        
        return concerns
    
    def _calculate_diversification_score(self, correlation_results: Dict) -> Dict:
        """
        Calculate a diversification score for the portfolio.
        
        Args:
            correlation_results: Results from correlation analysis
            
        Returns:
            Diversification score information
        """
        avg_correlation = correlation_results.get('average_correlation', 0)
        concentration = correlation_results.get('concentration_metrics', {})
        hhi = concentration.get('hhi', 0)
        total_assets = correlation_results.get('total_assets', 1)
        is_single_asset = correlation_results.get('single_asset_portfolio', False)
        
        # Enhanced diversification score calculation
        if is_single_asset:
            # Single asset portfolios get very low diversification scores
            # Base score of 10 for having any investment, but heavily penalized for lack of diversification
            base_score = 10
            asset_type_bonus = self._calculate_asset_type_bonus(correlation_results)
            diversification_score = base_score + asset_type_bonus
            
            # Provide detailed explanation for single asset portfolios
            explanation = self._get_single_asset_explanation(correlation_results)
            
        else:
            # Multi-asset portfolio scoring
            # Calculate correlation score (lower correlation = higher score)
            correlation_score = max(0, 100 - (avg_correlation * 100))
            
            # Calculate concentration score (lower concentration = higher score)
            # Enhanced HHI scoring with better scaling
            if hhi <= 0.1:  # Very well diversified
                concentration_score = 100
            elif hhi <= 0.25:  # Well diversified
                concentration_score = 80 - (hhi - 0.1) * 200  # Linear interpolation
            elif hhi <= 0.5:  # Moderately concentrated
                concentration_score = 60 - (hhi - 0.25) * 80
            else:  # Highly concentrated
                concentration_score = max(0, 40 - (hhi - 0.5) * 80)
            
            # Asset count bonus for having more assets
            asset_count_bonus = min(10, (total_assets - 2) * 2)  # Up to 10 points for 7+ assets
            
            # Weighted average with asset count consideration
            diversification_score = (correlation_score * 0.5) + (concentration_score * 0.4) + asset_count_bonus
            
            # Cap at 100
            diversification_score = min(100, diversification_score)
            
            # Provide detailed explanation for multi-asset portfolios
            explanation = self._get_multi_asset_explanation(correlation_results, correlation_score, concentration_score, asset_count_bonus)
        
        # Determine diversification level with enhanced thresholds
        if diversification_score >= 85:
            level = "Excellent"
            color = "#28a745"
        elif diversification_score >= 70:
            level = "Very Good"
            color = "#20c997"
        elif diversification_score >= 55:
            level = "Good"
            color = "#17a2b8"
        elif diversification_score >= 40:
            level = "Fair"
            color = "#ffc107"
        elif diversification_score >= 25:
            level = "Poor"
            color = "#fd7e14"
        elif diversification_score >= 10:
            level = "Very Poor"
            color = "#dc3545"
        else:
            level = "Minimal"
            color = "#6c757d"
        
        return {
            'score': round(diversification_score, 1),
            'level': level,
            'color': color,
            'correlation_score': round(correlation_score if not is_single_asset else 0, 1),
            'concentration_score': round(concentration_score if not is_single_asset else 0, 1),
            'asset_count': total_assets,
            'is_single_asset': is_single_asset,
            'explanation': explanation
        }
    
    def _get_single_asset_explanation(self, correlation_results: Dict) -> str:
        """Get detailed explanation for single asset portfolios."""
        portfolio_df = getattr(self, '_current_portfolio_df', None)
        
        if portfolio_df is not None and len(portfolio_df) == 1:
            ticker = portfolio_df.iloc[0]['Ticker'].upper()
            
            if ticker in ['VTI', 'VOO', 'SPY', 'VT']:
                return f"Single broad market ETF ({ticker}) - While this provides market exposure, it lacks diversification across asset classes and sectors."
            elif ticker in ['AGG', 'BND', 'TLT']:
                return f"Single bond ETF ({ticker}) - Provides fixed income exposure but lacks equity diversification."
            elif ticker in ['EFA', 'EEM', 'VEA', 'VWO']:
                return f"Single international ETF ({ticker}) - Provides geographic diversification but lacks domestic and fixed income exposure."
            else:
                return f"Single asset ({ticker}) - High concentration risk with no diversification benefits."
        else:
            return "Single asset portfolio - High concentration risk with no diversification benefits."
    
    def _get_multi_asset_explanation(self, correlation_results: Dict, correlation_score: float, concentration_score: float, asset_count_bonus: float) -> str:
        """Get detailed explanation for multi-asset portfolios."""
        total_assets = correlation_results.get('total_assets', 1)
        avg_correlation = correlation_results.get('average_correlation', 0)
        concentration = correlation_results.get('concentration_metrics', {})
        hhi = concentration.get('hhi', 0)
        
        explanations = []
        
        # Asset count explanation
        if total_assets >= 7:
            explanations.append(f"Good asset count ({total_assets} assets)")
        elif total_assets >= 4:
            explanations.append(f"Moderate asset count ({total_assets} assets)")
        else:
            explanations.append(f"Low asset count ({total_assets} assets) - consider adding more assets")
        
        # Correlation explanation
        if avg_correlation <= 0.3:
            explanations.append("Low correlation between assets (good diversification)")
        elif avg_correlation <= 0.6:
            explanations.append("Moderate correlation between assets")
        else:
            explanations.append("High correlation between assets (limited diversification)")
        
        # Concentration explanation
        if hhi <= 0.1:
            explanations.append("Well distributed weights (low concentration)")
        elif hhi <= 0.25:
            explanations.append("Moderately distributed weights")
        else:
            explanations.append("Concentrated weights (high concentration risk)")
        
        return " | ".join(explanations)
    
    def _calculate_asset_type_bonus(self, correlation_results: Dict) -> float:
        """
        Calculate bonus points for single asset portfolios based on asset type.
        
        Args:
            correlation_results: Results from correlation analysis
            
        Returns:
            Bonus points (0-5)
        """
        # Get portfolio data if available
        portfolio_df = getattr(self, '_current_portfolio_df', None)
        
        if portfolio_df is not None and len(portfolio_df) == 1:
            ticker = portfolio_df.iloc[0]['Ticker'].upper()
            
            # Define asset categories with their bonus scores
            broad_market_etfs = ['VTI', 'VOO', 'SPY', 'VT', 'ITOT', 'SCHB', 'IVV', 'SWTSX']
            international_etfs = ['EFA', 'EEM', 'VEA', 'VWO', 'IEFA', 'IEMG', 'SCHE', 'SCHF']
            bond_etfs = ['AGG', 'BND', 'VCIT', 'VCSH', 'VGSH', 'TLT', 'IEF', 'SHY', 'SCHZ']
            sector_etfs = ['XLK', 'XLF', 'XLE', 'XLV', 'XLI', 'XLP', 'XLU', 'XLB', 'XLY', 'XLRE']
            commodity_etfs = ['GLD', 'SLV', 'USO', 'UNG', 'DBA', 'DBC']
            
            # Check asset type and assign bonus
            if ticker in broad_market_etfs:
                return 4.0  # Broad market ETFs provide good base diversification
            elif ticker in international_etfs:
                return 3.5  # International exposure is valuable
            elif ticker in bond_etfs:
                return 3.0  # Bonds provide stability and diversification
            elif ticker in sector_etfs:
                return 2.0  # Sector ETFs are more concentrated
            elif ticker in commodity_etfs:
                return 2.5  # Commodities can provide diversification
            elif any(indicator in ticker for indicator in ['ETF', 'FUND', 'INDEX']):
                return 2.5  # Generic ETF/fund bonus
            else:
                return 1.0  # Individual stock or unknown asset
        else:
            return 2.0  # Default bonus for any single asset
    
    def _generate_risk_recommendations(self, correlation_results: Dict, portfolio_df: pd.DataFrame = None) -> List[Dict]:
        """
        Generate risk management recommendations.
        
        Args:
            correlation_results: Results from correlation analysis
            portfolio_df: Portfolio DataFrame (optional, for asset-aware recommendations)
            
        Returns:
            List of recommendations
        """
        recommendations = []
        
        # Check if this is a single asset portfolio
        if correlation_results.get('single_asset_portfolio', False):
            recommendations.append({
                'type': 'single_asset',
                'priority': 'high',
                'title': 'Add Portfolio Diversification',
                'description': 'Single asset portfolios carry high concentration risk and offer no diversification benefits.',
                'action': 'Consider adding 5-10 additional assets across different sectors and asset classes'
            })
            
            # Smart ETF recommendation based on current holdings
            if portfolio_df is not None and len(portfolio_df) == 1:
                current_asset = portfolio_df.iloc[0]['Ticker'].upper()
                
                # Check if current asset is already an ETF
                etf_indicators = ['VTI', 'VOO', 'SPY', 'QQQ', 'IWM', 'EFA', 'EEM', 'AGG', 'BND', 'GLD', 'TLT']
                is_currently_etf = any(indicator in current_asset for indicator in etf_indicators)
                
                if is_currently_etf:
                    recommendations.append({
                        'type': 'single_asset',
                        'priority': 'medium',
                        'title': 'Consider Additional ETFs',
                        'description': f'While {current_asset} is already an ETF, single ETF positions still lack diversification.',
                        'action': 'Consider adding complementary ETFs like international (EFA, EEM), bonds (AGG, BND), or sector-specific ETFs'
                    })
                else:
                    recommendations.append({
                        'type': 'single_asset',
                        'priority': 'medium',
                        'title': 'Consider Index Funds or ETFs',
                        'description': 'Single stock positions are inherently risky compared to diversified funds.',
                        'action': 'Consider replacing with broad market ETFs like VTI, VOO, or sector-specific ETFs'
                    })
            
            return recommendations
        
        correlation_pair = correlation_results.get('most_correlated_pair', {})
        concentration = correlation_results.get('concentration_metrics', {})
        
        # Correlation recommendations (only if correlation analysis was successful)
        if correlation_results.get('success', False):
            correlation_value = correlation_pair.get('correlation', 0)
            if correlation_value >= 0.8:
                recommendations.append({
                    'type': 'correlation',
                    'priority': 'high',
                    'title': 'Consider Reducing Correlation',
                    'description': f'Very high correlation ({correlation_value:.1%}) between {correlation_pair.get("asset1")} and {correlation_pair.get("asset2")}. Consider replacing one with a less correlated asset.',
                    'action': 'Review and potentially replace one of the highly correlated assets'
                })
            elif correlation_value >= 0.6:
                recommendations.append({
                    'type': 'correlation',
                    'priority': 'medium',
                    'title': 'Monitor Correlation',
                    'description': f'High correlation ({correlation_value:.1%}) between {correlation_pair.get("asset1")} and {correlation_pair.get("asset2")}. Monitor for concentration risk.',
                    'action': 'Consider adding assets with lower correlation to these holdings'
                })
        
        # Concentration recommendations
        hhi = concentration.get('hhi', 0)
        if hhi >= 0.25:
            recommendations.append({
                'type': 'concentration',
                'priority': 'high',
                'title': 'Reduce Portfolio Concentration',
                'description': f'Very high concentration (HHI: {hhi:.3f}). Portfolio is heavily concentrated in few assets.',
                'action': 'Consider adding more assets to improve diversification'
            })
        elif hhi >= 0.15:
            recommendations.append({
                'type': 'concentration',
                'priority': 'medium',
                'title': 'Monitor Concentration',
                'description': f'High concentration (HHI: {hhi:.3f}). Consider adding more diversification.',
                'action': 'Review if additional assets would improve portfolio balance'
            })
        
        # Single holding recommendations
        largest_holding = concentration.get('largest_holding', {})
        largest_weight = largest_holding.get('percentage', 0)
        if largest_weight >= 20:
            recommendations.append({
                'type': 'single_holding',
                'priority': 'high',
                'title': 'Reduce Largest Holding',
                'description': f'{largest_holding.get("ticker")} represents {largest_weight:.1f}% of portfolio - very high single position risk.',
                'action': 'Consider reducing position size to improve diversification'
            })
        elif largest_weight >= 10:
            recommendations.append({
                'type': 'single_holding',
                'priority': 'medium',
                'title': 'Monitor Largest Holding',
                'description': f'{largest_holding.get("ticker")} represents {largest_weight:.1f}% of portfolio - significant single position.',
                'action': 'Monitor position size and consider rebalancing if it grows'
            })
        
        # If no specific concerns, provide general recommendations
        if not recommendations:
            recommendations.append({
                'type': 'general',
                'priority': 'low',
                'title': 'Portfolio Looks Well Diversified',
                'description': 'No significant concentration or correlation risks identified.',
                'action': 'Continue monitoring and rebalancing as needed'
            })
        
        return recommendations
    
    def _create_error_result(self, error_message: str) -> Dict:
        """
        Create error result when analysis fails.
        
        Args:
            error_message: Error message
            
        Returns:
            Error result dictionary
        """
        error_metrics = {
            'correlation_analysis': {
                'success': False,
                'error_message': error_message
            },
            'portfolio_summary': {},
            'risk_summary': {
                'overall_risk_level': 'Unknown',
                'risk_score': 0,
                'risk_color': '#6c757d',
                'key_concerns': ['Analysis failed'],
                'diversification_score': {
                    'score': 0,
                    'level': 'Unknown',
                    'color': '#6c757d'
                }
            },
            'recommendations': []
        }
        
        # Convert numpy types to native Python types for JSON serialization
        error_metrics = self._convert_numpy_types(error_metrics)
        
        return {
            'success': False,
            'error_message': error_message,
            'risk_metrics': error_metrics,
            'analysis_timestamp': pd.Timestamp.now().isoformat()
        }
    
    def _convert_numpy_types(self, obj: Any) -> Any:
        """
        Convert numpy types to native Python types for JSON serialization.
        
        Args:
            obj: Object that may contain numpy types
            
        Returns:
            Object with numpy types converted to native Python types
        """
        if isinstance(obj, dict):
            return {key: self._convert_numpy_types(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_numpy_types(item) for item in obj]
        elif isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif pd.isna(obj):
            return None
        else:
            return obj
