import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import {
  TrendingUp,
  Shield,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Target,
  Activity,
  Globe,
  Building2,
  Zap,
} from 'lucide-react';
import { PredictionResult } from '@/lib/api';
import { getETFInfo } from '@/lib/etf-mapping';
import { getDisplayName, getCategory } from '@/lib/tickerDirectory';
import { useEffect } from 'react';
import {
  ensureTickersResolved,
  warmFromEnhancementDetails,
} from '../lib/tickerResolver';

interface PortfolioResultsProps {
  result: PredictionResult;
}

export default function PortfolioResults({ result }: PortfolioResultsProps) {
  useEffect(() => {
    const tickers = result.portfolio_assets.map(a => a.Ticker);
    warmFromEnhancementDetails(result.enhancement_data?.asset_details || []);
    ensureTickersResolved(tickers);
  }, [result]);
  return (
    <div className='space-y-6'>
      {/* Summary Metrics */}
      <SummaryMetrics result={result} />

      {/* Portfolio Composition */}
      <PortfolioComposition result={result} />

      {/* Risk Analysis */}
      {result.risk_analysis && result.risk_analysis.success && (
        <RiskAnalysisDisplay riskAnalysis={result.risk_analysis} />
      )}
    </div>
  );
}

function SummaryMetrics({ result }: { result: PredictionResult }) {
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'very high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'very low':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getModelTypeIcon = (modelType: string) => {
    switch (modelType) {
      case 'enhanced_multi_source':
        return <Zap className='h-5 w-5' />;
      case 'historical_random_forest':
        return <BarChart3 className='h-5 w-5' />;
      case 'asset_based_estimation':
        return <Target className='h-5 w-5' />;
      default:
        return <Activity className='h-5 w-5' />;
    }
  };

  const getModelTypeLabel = (modelType: string) => {
    switch (modelType) {
      case 'enhanced_multi_source':
        return '🚀 Enhanced Multi-Source';
      case 'historical_random_forest':
        return '🤖 Historical Random Forest';
      case 'asset_based_estimation':
        return '📊 Asset-Based Estimation';
      default:
        return modelType;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <TrendingUp className='h-5 w-5' />
          Volatility Forecast Results
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Key Metrics Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          <div
            className={`p-4 rounded-lg border ${getRiskColor(
              result.risk_level
            )}`}
          >
            <div className='flex items-center gap-2 mb-2'>
              <Shield className='h-4 w-4' />
              <p className='text-sm font-medium'>Risk Level</p>
            </div>
            <p className='text-2xl font-bold'>{result.risk_level}</p>
          </div>

          <div className='p-4 bg-blue-50 rounded-lg border border-blue-200'>
            <div className='flex items-center gap-2 mb-2'>
              <Activity className='h-4 w-4 text-blue-600' />
              <p className='text-sm font-medium text-blue-800'>
                Annual Volatility
              </p>
            </div>
            <div className='flex items-baseline gap-3'>
              <p className='text-2xl font-bold text-blue-900'>
                {result.final_volatility !== undefined
                  ? `${(result.final_volatility * 100).toFixed(1)}%`
                  : result.annual_volatility}
              </p>
              {result.labels?.window && (
                <Badge variant='outline' className='text-xs'>
                  {result.labels.window}
                </Badge>
              )}
              {result.labels?.ml_adjustment && (
                <Badge variant='outline' className='text-xs'>
                  ML: {result.labels.ml_adjustment}
                </Badge>
              )}
            </div>
          </div>

          <div className='p-4 bg-purple-50 rounded-lg border border-purple-200'>
            <div className='flex items-center gap-2 mb-2'>
              <Target className='h-4 w-4 text-purple-600' />
              <p className='text-sm font-medium text-purple-800'>
                Forecast Period
              </p>
            </div>
            <p className='text-2xl font-bold text-purple-900'>
              {result.forecast_days} days
            </p>
          </div>

          <div className='p-4 bg-gray-50 rounded-lg border border-gray-200'>
            <div className='flex items-center gap-2 mb-2'>
              {getModelTypeIcon(result.model_type)}
              <p className='text-sm font-medium'>Model Type</p>
            </div>
            <p className='text-lg font-semibold'>
              {getModelTypeLabel(result.model_type)}
            </p>
          </div>

          {result.enhancement_data && (
            <>
              <div className='p-4 bg-green-50 rounded-lg border border-green-200'>
                <div className='flex items-center gap-2 mb-2'>
                  <Globe className='h-4 w-4 text-green-600' />
                  <p className='text-sm font-medium text-green-800'>
                    Asset Coverage
                  </p>
                </div>
                <p className='text-2xl font-bold text-green-900'>
                  {(
                    result.enhancement_data.coverage_analysis
                      .coverage_by_count * 100
                  ).toFixed(0)}
                  %
                </p>
              </div>

              <div className='p-4 bg-amber-50 rounded-lg border border-amber-200'>
                <div className='flex items-center gap-2 mb-2'>
                  <Building2 className='h-4 w-4 text-amber-600' />
                  <p className='text-sm font-medium text-amber-800'>
                    Confidence
                  </p>
                </div>
                <Badge
                  variant={
                    result.enhancement_data.overall_confidence === 'high'
                      ? 'default'
                      : 'secondary'
                  }
                  className={
                    result.enhancement_data.overall_confidence === 'high'
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  }
                >
                  {result.enhancement_data.overall_confidence}
                </Badge>
              </div>
            </>
          )}
        </div>

        {/* Description */}
        {result.description && (
          <div className='p-4 bg-blue-50 rounded-lg border border-blue-200'>
            <p className='text-sm text-blue-800 leading-relaxed'>
              {result.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PortfolioComposition({ result }: { result: PredictionResult }) {
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'large cap':
        return 'bg-blue-100 text-blue-800';
      case 'mid cap':
        return 'bg-green-100 text-green-800';
      case 'small cap':
        return 'bg-purple-100 text-purple-800';
      case 'international':
        return 'bg-orange-100 text-orange-800';
      case 'emerging markets':
        return 'bg-red-100 text-red-800';
      case 'bond':
        return 'bg-gray-100 text-gray-800';
      case 'real estate':
        return 'bg-yellow-100 text-yellow-800';
      case 'technology':
        return 'bg-indigo-100 text-indigo-800';
      case 'sector':
        return 'bg-pink-100 text-pink-800';
      case 'commodity':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Infer whether weights are fractional (0..1) or already percents (0..100)
  const maxWeight = Math.max(
    0,
    ...result.portfolio_assets.map(a =>
      typeof a.Weight === 'number' ? a.Weight : 0
    )
  );
  const weightsAreFractional = maxWeight <= 1.0000001; // tolerate float drift

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <BarChart3 className='h-5 w-5' />
          Portfolio Composition
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-gray-200'>
                <th className='text-left p-3 font-semibold text-gray-700'>
                  Asset
                </th>
                <th className='text-left p-3 font-semibold text-gray-700'>
                  Weight
                </th>
                <th className='text-left p-3 font-semibold text-gray-700'>
                  Volatility
                </th>
                <th className='text-left p-3 font-semibold text-gray-700'>
                  Confidence
                </th>
                <th className='text-left p-3 font-semibold text-gray-700'>
                  Category
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {result.portfolio_assets.map((asset, index) => {
                const etfInfo = getETFInfo(asset.Ticker);
                const enhancedDetails =
                  result.enhancement_data?.asset_details?.find(
                    (detail: any) => detail.ticker === asset.Ticker
                  );

                const assetType =
                  enhancedDetails?.asset_type ||
                  getCategory(asset.Ticker) ||
                  etfInfo?.category ||
                  'Unknown';
                const volatility = enhancedDetails?.volatility
                  ? `${(enhancedDetails.volatility * 100).toFixed(1)}%`
                  : 'N/A';
                const confidence = enhancedDetails?.confidence || 'unknown';
                const directoryName = getDisplayName(asset.Ticker);
                const displayName =
                  (enhancedDetails?.name &&
                  enhancedDetails.name !== asset.Ticker
                    ? enhancedDetails.name
                    : undefined) ||
                  directoryName ||
                  etfInfo?.name;

                const percent = weightsAreFractional
                  ? asset.Weight * 100
                  : asset.Weight;
                const percentInt = Math.round(percent);
                return (
                  <tr
                    key={index}
                    className='hover:bg-gray-50 transition-colors'
                  >
                    <td className='p-3'>
                      <div>
                        <div className='font-semibold text-gray-900'>
                          {asset.Ticker}
                        </div>
                        {displayName && (
                          <div className='text-sm text-gray-600 mt-1'>
                            {displayName}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className='p-3'>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium'>{percentInt}%</span>
                        <div className='flex-1 max-w-24'>
                          <Progress value={percent} className='h-2' />
                        </div>
                      </div>
                    </td>
                    <td className='p-3'>
                      <span className='font-medium text-gray-900'>
                        {volatility}
                      </span>
                    </td>
                    <td className='p-3'>
                      <Badge
                        variant='outline'
                        className={`${getConfidenceColor(confidence)}`}
                      >
                        {confidence}
                      </Badge>
                    </td>
                    <td className='p-3'>
                      <Badge
                        variant='outline'
                        className={`${getCategoryColor(assetType)}`}
                      >
                        {assetType}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function RiskAnalysisDisplay({ riskAnalysis }: { riskAnalysis: any }) {
  const metrics = riskAnalysis.risk_metrics;
  const correlationAnalysis = metrics.correlation_analysis;
  const riskSummary = metrics.risk_summary;
  const recommendations = metrics.recommendations;

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Very High':
        return '#dc3545';
      case 'High':
        return '#fd7e14';
      case 'Moderate':
        return '#ffc107';
      case 'Low':
        return '#20c997';
      case 'Very Low':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#dc3545';
      case 'medium':
        return '#fd7e14';
      case 'low':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Shield className='h-5 w-5' />
          Risk Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Risk Summary */}
        <div>
          <h4 className='text-lg font-semibold mb-4 flex items-center gap-2'>
            <Shield className='h-4 w-4' />
            Risk Summary
          </h4>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div
              className='p-4 bg-gray-50 rounded-lg border-l-4'
              style={{ borderLeftColor: riskSummary.risk_color }}
            >
              <p className='text-sm text-gray-600 mb-1'>Portfolio Risk Level</p>
              <p
                className='text-xl font-bold'
                style={{ color: riskSummary.risk_color }}
              >
                {riskSummary.overall_risk_level}
              </p>
              <p className='text-xs text-gray-500 mt-1'>
                Based on correlation & concentration
              </p>
            </div>
            <div
              className='p-4 bg-gray-50 rounded-lg border-l-4'
              style={{
                borderLeftColor: riskSummary.diversification_score.color,
              }}
            >
              <p className='text-sm text-gray-600 mb-1'>
                Diversification Score
              </p>
              <p
                className='text-xl font-bold'
                style={{ color: riskSummary.diversification_score.color }}
              >
                {riskSummary.diversification_score.score}/100
              </p>
              <p className='text-xs text-gray-500 mt-1 line-clamp-2'>
                {riskSummary.diversification_score.explanation ||
                  'Diversification analysis completed'}
              </p>
            </div>
            <div className='p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500'>
              <p className='text-sm text-gray-600 mb-1'>Risk Score</p>
              <p className='text-xl font-bold text-gray-900'>
                {riskSummary.risk_score}/100
              </p>
            </div>
          </div>
        </div>

        {/* Correlation Analysis */}
        {correlationAnalysis.success ? (
          <div>
            <h4 className='text-lg font-semibold mb-4 flex items-center gap-2'>
              <TrendingUp className='h-4 w-4' />
              Correlation Analysis
            </h4>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div
                className='p-4 bg-gray-50 rounded-lg border-l-4'
                style={{
                  borderLeftColor:
                    correlationAnalysis.most_correlated_pair.risk_color,
                }}
              >
                <p className='text-sm text-gray-600 mb-1'>
                  Most Correlated Pair
                </p>
                <p className='text-lg font-semibold text-gray-900'>
                  {correlationAnalysis.most_correlated_pair.asset1} &{' '}
                  {correlationAnalysis.most_correlated_pair.asset2}
                </p>
                <p
                  className='text-sm font-semibold'
                  style={{
                    color: correlationAnalysis.most_correlated_pair.risk_color,
                  }}
                >
                  {(
                    correlationAnalysis.most_correlated_pair.correlation * 100
                  ).toFixed(1)}
                  % correlation
                </p>
                <p className='text-xs text-gray-500 mt-1'>
                  {correlationAnalysis.most_correlated_pair.risk_description}
                </p>
              </div>
              <div
                className='p-4 bg-gray-50 rounded-lg border-l-4'
                style={{
                  borderLeftColor:
                    correlationAnalysis.concentration_metrics.risk_color,
                }}
              >
                <p className='text-sm text-gray-600 mb-1'>
                  Portfolio Concentration
                </p>
                <p className='text-lg font-semibold text-gray-900'>
                  HHI: {correlationAnalysis.concentration_metrics.hhi}
                </p>
                <p
                  className='text-sm font-semibold'
                  style={{
                    color: correlationAnalysis.concentration_metrics.risk_color,
                  }}
                >
                  {
                    correlationAnalysis.concentration_metrics
                      .concentration_level
                  }
                </p>
                <p className='text-xs text-gray-500 mt-1'>
                  Largest:{' '}
                  {
                    correlationAnalysis.concentration_metrics.largest_holding
                      .ticker
                  }{' '}
                  (
                  {
                    correlationAnalysis.concentration_metrics.largest_holding
                      .percentage
                  }
                  %)
                </p>
              </div>
              <div className='p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500'>
                <p className='text-sm text-gray-600 mb-1'>
                  Average Correlation
                </p>
                <p className='text-lg font-semibold text-gray-900'>
                  {(correlationAnalysis.average_correlation * 100).toFixed(1)}%
                </p>
                <p className='text-xs text-gray-500 mt-1'>
                  Lower is better for diversification
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h4 className='text-lg font-semibold mb-4 flex items-center gap-2'>
              <TrendingUp className='h-4 w-4' />
              Correlation Analysis
            </h4>
            {correlationAnalysis.single_asset_portfolio ? (
              <Alert>
                <AlertTriangle className='h-4 w-4' />
                <AlertDescription>
                  <strong>Single Asset Portfolio Detected</strong>
                  <br />
                  Correlation analysis is not applicable for single asset
                  portfolios. Consider adding more assets for proper
                  diversification.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant='destructive'>
                <AlertTriangle className='h-4 w-4' />
                <AlertDescription>
                  <strong>Correlation Analysis Unavailable</strong>
                  <br />
                  {correlationAnalysis.error_message ||
                    'Unable to perform correlation analysis'}
                </AlertDescription>
              </Alert>
            )}

            {/* Show concentration metrics even if correlation fails */}
            <div className='mt-4'>
              <div
                className='p-4 bg-gray-50 rounded-lg border-l-4'
                style={{
                  borderLeftColor:
                    correlationAnalysis.concentration_metrics.risk_color,
                }}
              >
                <p className='text-sm text-gray-600 mb-1'>
                  Portfolio Concentration
                </p>
                <p className='text-lg font-semibold text-gray-900'>
                  HHI: {correlationAnalysis.concentration_metrics.hhi}
                </p>
                <p
                  className='text-sm font-semibold'
                  style={{
                    color: correlationAnalysis.concentration_metrics.risk_color,
                  }}
                >
                  {
                    correlationAnalysis.concentration_metrics
                      .concentration_level
                  }
                </p>
                <p className='text-xs text-gray-500 mt-1'>
                  {correlationAnalysis.single_asset_portfolio
                    ? `Single Asset: ${correlationAnalysis.concentration_metrics.largest_holding.ticker} (100.0%)`
                    : `Largest: ${correlationAnalysis.concentration_metrics.largest_holding.ticker} (${correlationAnalysis.concentration_metrics.largest_holding.percentage}%)`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Key Concerns */}
        {riskSummary.key_concerns && riskSummary.key_concerns.length > 0 && (
          <div>
            <h4 className='text-lg font-semibold mb-4 flex items-center gap-2'>
              <AlertTriangle className='h-4 w-4' />
              Key Concerns
            </h4>
            <div className='space-y-2'>
              {riskSummary.key_concerns.map(
                (concern: string, index: number) => (
                  <div
                    key={index}
                    className='p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded'
                  >
                    <p className='text-sm text-yellow-800'>{concern}</p>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div>
            <h4 className='text-lg font-semibold mb-4 flex items-center gap-2'>
              <Lightbulb className='h-4 w-4' />
              Recommendations
            </h4>
            <div className='space-y-3'>
              {recommendations.map((rec: any, index: number) => (
                <div
                  key={index}
                  className='p-4 bg-gray-50 rounded-lg border-l-4'
                  style={{ borderLeftColor: getPriorityColor(rec.priority) }}
                >
                  <div className='flex justify-between items-center mb-2'>
                    <h5 className='font-semibold text-gray-900'>{rec.title}</h5>
                    <Badge
                      className='text-xs font-semibold'
                      style={{
                        backgroundColor: getPriorityColor(rec.priority),
                        color: 'white',
                      }}
                    >
                      {rec.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <p className='text-sm text-gray-600 mb-2'>
                    {rec.description}
                  </p>
                  <p className='text-xs font-semibold text-gray-900'>
                    Action: {rec.action}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
