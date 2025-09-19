import { type PredictionResult } from './api';

export interface RiskLevelInfo {
  level: string;
  score: number;
  color: string;
  explanation: string;
}

export interface RiskColors {
  bg: string;
  text: string;
  badge: string;
  icon: string;
  accent: string;
}

/**
 * Calculate dynamic risk level based on portfolio analysis data
 */
export function calculateDynamicRiskLevel(
  result: PredictionResult
): RiskLevelInfo {
  // Extract risk analysis data
  const riskAnalysis = result.risk_analysis?.risk_metrics?.risk_summary;
  const correlationAnalysis =
    result.risk_analysis?.risk_metrics?.correlation_analysis;

  // If we have risk analysis data, use it
  if (
    riskAnalysis?.overall_risk_level &&
    riskAnalysis?.risk_score !== undefined
  ) {
    return {
      level: riskAnalysis.overall_risk_level,
      score: riskAnalysis.risk_score,
      color:
        riskAnalysis.risk_color ||
        getDefaultRiskColor(riskAnalysis.overall_risk_level),
      explanation: generateRiskExplanation(riskAnalysis, correlationAnalysis),
    };
  }

  // Fallback: Calculate based on volatility and portfolio composition
  const volatility =
    result.final_volatility ||
    (result.annual_volatility
      ? parseFloat(result.annual_volatility.replace('%', '')) / 100
      : 0.2);

  const portfolioSize = result.portfolio_assets?.length || 1;
  const maxWeight = Math.max(
    ...(result.portfolio_assets?.map(asset => asset.Weight || 0) || [0])
  );

  // Calculate risk score based on volatility and concentration
  let riskScore = 0;

  // Volatility component (0-50 points)
  if (volatility >= 0.3) {
    riskScore += 50; // Very high volatility
  } else if (volatility >= 0.25) {
    riskScore += 40; // High volatility
  } else if (volatility >= 0.2) {
    riskScore += 30; // Moderate volatility
  } else if (volatility >= 0.15) {
    riskScore += 20; // Low volatility
  } else {
    riskScore += 10; // Very low volatility
  }

  // Concentration component (0-50 points)
  if (maxWeight >= 0.5) {
    riskScore += 50; // Very high concentration
  } else if (maxWeight >= 0.3) {
    riskScore += 40; // High concentration
  } else if (maxWeight >= 0.2) {
    riskScore += 30; // Moderate concentration
  } else if (maxWeight >= 0.1) {
    riskScore += 20; // Low concentration
  } else {
    riskScore += 10; // Very low concentration
  }

  // Determine risk level
  let level: string;
  let color: string;

  if (riskScore >= 80) {
    level = 'Very High';
    color = '#dc3545';
  } else if (riskScore >= 60) {
    level = 'High';
    color = '#fd7e14';
  } else if (riskScore >= 40) {
    level = 'Moderate';
    color = '#ffc107';
  } else if (riskScore >= 20) {
    level = 'Low';
    color = '#20c997';
  } else {
    level = 'Very Low';
    color = '#28a745';
  }

  return {
    level,
    score: riskScore,
    color,
    explanation: generateFallbackRiskExplanation(
      level,
      volatility,
      maxWeight,
      portfolioSize
    ),
  };
}

/**
 * Generate risk explanation based on risk analysis data
 */
function generateRiskExplanation(
  riskSummary: any,
  correlationAnalysis?: any
): string {
  const concerns = riskSummary.key_concerns || [];
  const riskLevel = riskSummary.overall_risk_level?.toLowerCase() || '';

  // Check for specific concerns
  if (
    concerns.some((concern: string) =>
      concern.toLowerCase().includes('concentration')
    )
  ) {
    return 'Your portfolio has high risk due to concentration in a few assets.';
  } else if (
    concerns.some((concern: string) =>
      concern.toLowerCase().includes('correlation')
    )
  ) {
    return 'Your portfolio shows high risk due to correlated assets moving together.';
  } else if (
    concerns.some((concern: string) =>
      concern.toLowerCase().includes('volatility')
    )
  ) {
    return 'Your portfolio has high risk due to volatile asset holdings.';
  }

  // Generate based on risk level
  switch (riskLevel) {
    case 'very high':
      return 'Your portfolio has very high risk due to multiple risk factors.';
    case 'high':
      return 'Your portfolio has high risk that may need attention.';
    case 'moderate':
      return 'Your portfolio has moderate risk with room for improvement.';
    case 'low':
      return 'Your portfolio has low risk with good diversification.';
    case 'very low':
      return 'Your portfolio has very low risk with excellent diversification.';
    default:
      return 'Your portfolio risk has been assessed based on current holdings.';
  }
}

/**
 * Generate fallback risk explanation when detailed analysis isn't available
 */
function generateFallbackRiskExplanation(
  level: string,
  volatility: number,
  maxWeight: number,
  portfolioSize: number
): string {
  const levelLower = level.toLowerCase();

  if (levelLower.includes('very high') || levelLower.includes('high')) {
    if (maxWeight > 0.3) {
      return 'Your portfolio has high risk due to concentration in a few assets.';
    } else if (volatility > 0.25) {
      return 'Your portfolio has high risk due to volatile asset holdings.';
    } else {
      return 'Your portfolio has high risk due to multiple factors.';
    }
  } else if (levelLower.includes('moderate')) {
    return 'Your portfolio has moderate risk with room for improvement.';
  } else {
    return 'Your portfolio has low risk with good diversification.';
  }
}

/**
 * Get default risk color for a risk level
 */
function getDefaultRiskColor(riskLevel: string): string {
  const level = riskLevel.toLowerCase();

  if (level.includes('very high')) {
    return '#dc3545';
  } else if (level.includes('high')) {
    return '#fd7e14';
  } else if (level.includes('moderate')) {
    return '#ffc107';
  } else if (level.includes('low')) {
    return '#20c997';
  } else {
    return '#28a745';
  }
}

/**
 * Get traffic-light colors for risk level
 */
export function getRiskColors(riskLevel: string): RiskColors {
  const normalizedLevel = riskLevel.toLowerCase();

  if (normalizedLevel.includes('low') || normalizedLevel.includes('very low')) {
    return {
      bg: 'bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700',
      text: 'text-white',
      badge: 'bg-green-100 text-green-800 border-green-200',
      icon: 'text-green-600',
      accent: 'from-green-500/20 to-green-600/20',
    };
  } else if (
    normalizedLevel.includes('moderate') ||
    normalizedLevel.includes('medium')
  ) {
    return {
      bg: 'bg-gradient-to-br from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700',
      text: 'text-white',
      badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: 'text-yellow-600',
      accent: 'from-yellow-500/20 to-yellow-600/20',
    };
  } else if (
    normalizedLevel.includes('high') ||
    normalizedLevel.includes('very high')
  ) {
    return {
      bg: 'bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700',
      text: 'text-white',
      badge: 'bg-red-100 text-red-800 border-red-200',
      icon: 'text-red-600',
      accent: 'from-red-500/20 to-red-600/20',
    };
  } else {
    // Default to moderate
    return {
      bg: 'bg-gradient-to-br from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700',
      text: 'text-white',
      badge: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: 'text-gray-600',
      accent: 'from-gray-500/20 to-gray-600/20',
    };
  }
}

/**
 * Get risk level icon based on risk level
 */
export function getRiskIcon(riskLevel: string) {
  const normalizedLevel = riskLevel.toLowerCase();

  if (normalizedLevel.includes('low') || normalizedLevel.includes('very low')) {
    return '🛡️'; // Shield for low risk
  } else if (
    normalizedLevel.includes('moderate') ||
    normalizedLevel.includes('medium')
  ) {
    return '⚠️'; // Warning for moderate risk
  } else if (
    normalizedLevel.includes('high') ||
    normalizedLevel.includes('very high')
  ) {
    return '🚨'; // Alert for high risk
  } else {
    return '📊'; // Chart for unknown/default
  }
}

/**
 * Generate contextual explanations for metrics
 */
export function generateMetricExplanation(
  metricType: 'volatility' | 'diversification',
  volatility?: number,
  diversificationScore?: number
): string {
  if (metricType === 'volatility' && volatility !== undefined) {
    const volatilityPercent = volatility * 100;

    if (volatilityPercent >= 25) {
      return 'High volatility means your portfolio could experience significant price swings. This increases risk but may offer higher potential returns.';
    } else if (volatilityPercent >= 15) {
      return 'Moderate volatility suggests your portfolio will have some price movement. This is typical for balanced portfolios.';
    } else if (volatilityPercent >= 10) {
      return 'Low volatility indicates your portfolio should be relatively stable. This is common with conservative investments.';
    } else {
      return 'Very low volatility suggests your portfolio is very stable, typical of cash or bond-heavy portfolios.';
    }
  }

  if (metricType === 'diversification' && diversificationScore !== undefined) {
    if (diversificationScore >= 80) {
      return 'Excellent diversification means your investments are well spread out, reducing risk from any single asset or sector.';
    } else if (diversificationScore >= 60) {
      return 'Good diversification shows your portfolio is reasonably balanced, though there may be room for improvement.';
    } else if (diversificationScore >= 40) {
      return 'Fair diversification suggests your portfolio could benefit from spreading investments across more assets or sectors.';
    } else {
      return 'Poor diversification means your portfolio is concentrated in a few investments, which increases risk significantly.';
    }
  }

  return "This metric helps explain your portfolio's risk characteristics.";
}
