import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  Upload,
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Shield,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import {
  predictVolatility,
  getSampleDownloadUrl,
  PredictionResult,
} from '../lib/api';
import { getETFInfo } from '../lib/etf-mapping';

export default function FileUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }
    setSelectedFile(file);
    setError(null);
    setResult(null);
  }, []);

  const handleFileInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragOver(false);

      const files = event.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handlePredict = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await predictVolatility(selectedFile);
      setResult(data);
    } catch (err) {
      console.error('Prediction error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadSample = () => {
    const link = document.createElement('a');
    link.href = getSampleDownloadUrl();
    link.download = 'sample_portfolio.csv';
    link.click();
  };

  return (
    <div className='space-y-6'>
      {/* File Upload Section */}
      <Card
        className={`transition-all duration-300 ${
          isDragOver ? 'border-blue-500 bg-blue-50' : ''
        }`}
      >
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Upload className='h-5 w-5' />
            Upload Portfolio CSV
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
              isDragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className='h-12 w-12 mx-auto mb-4 text-gray-400' />
            <p className='text-lg font-medium mb-2'>
              Drag and drop your CSV file here
            </p>
            <p className='text-sm text-gray-600 mb-4'>or click to browse</p>
            <p className='text-xs text-gray-500 mb-4'>
              Required columns: Ticker, Weight
            </p>

            <input
              type='file'
              accept='.csv'
              onChange={handleFileInput}
              className='hidden'
              id='file-input'
            />
            <label htmlFor='file-input'>
              <Button asChild>
                <span>
                  <FileText className='h-4 w-4 mr-2' />
                  Choose File
                </span>
              </Button>
            </label>
          </div>

          {selectedFile && (
            <div className='mt-4 p-3 bg-green-50 border border-green-200 rounded-lg'>
              <div className='flex items-center gap-2'>
                <CheckCircle className='h-4 w-4 text-green-600' />
                <span className='text-sm font-medium text-green-800'>
                  Selected: {selectedFile.name}
                </span>
              </div>
              <p className='text-xs text-green-600 mt-1'>
                Size: {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}

          {selectedFile && (
            <div className='mt-4 flex gap-2'>
              <Button onClick={handlePredict} disabled={isLoading}>
                {isLoading ? 'Analyzing...' : 'Predict Volatility'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Download Sample Section */}
      <Card>
        <CardContent className='p-6'>
          <div className='text-center'>
            <Button variant='outline' onClick={downloadSample} size='sm'>
              <Download className='h-4 w-4 mr-2' />
              Download Sample Portfolio CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className='p-6'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
              <p className='text-gray-600'>
                Analyzing portfolio and generating forecast...
              </p>
              <Progress value={undefined} className='mt-4' />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Display */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              📈 Volatility Forecast Results
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Metrics Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              <div className='p-4 bg-gray-50 rounded-lg'>
                <p className='text-sm text-gray-600 mb-1'>
                  Volatility Risk Level
                </p>
                <p className='text-xl font-bold text-gray-900'>
                  {result.risk_level}
                </p>
              </div>
              <div className='p-4 bg-gray-50 rounded-lg'>
                <p className='text-sm text-gray-600 mb-1'>Annual Volatility</p>
                <p className='text-xl font-bold text-gray-900'>
                  {result.annual_volatility}
                </p>
              </div>
              <div className='p-4 bg-gray-50 rounded-lg'>
                <p className='text-sm text-gray-600 mb-1'>Forecast Period</p>
                <p className='text-xl font-bold text-gray-900'>
                  {result.forecast_days} days
                </p>
              </div>
              <div className='p-4 bg-gray-50 rounded-lg'>
                <p className='text-sm text-gray-600 mb-1'>Model Type</p>
                <p className='text-xl font-bold text-gray-900'>
                  {result.model_type === 'enhanced_multi_source'
                    ? '🚀 Enhanced Multi-Source'
                    : result.model_type === 'historical_random_forest'
                    ? '🤖 Historical Random Forest'
                    : result.model_type === 'asset_based_estimation'
                    ? '📊 Asset-Based Estimation'
                    : result.model_type}
                </p>
              </div>
              {result.enhancement_data && (
                <>
                  <div className='p-4 bg-gray-50 rounded-lg'>
                    <p className='text-sm text-gray-600 mb-1'>Asset Coverage</p>
                    <p className='text-xl font-bold text-gray-900'>
                      {(
                        result.enhancement_data.coverage_analysis
                          .coverage_by_count * 100
                      ).toFixed(0)}
                      %
                    </p>
                  </div>
                  <div className='p-4 bg-gray-50 rounded-lg'>
                    <p className='text-sm text-gray-600 mb-1'>Confidence</p>
                    <Badge variant='secondary'>
                      {result.enhancement_data.overall_confidence}
                    </Badge>
                  </div>
                </>
              )}
            </div>

            {/* Description */}
            {result.description && (
              <div className='p-4 bg-blue-50 rounded-lg'>
                <p className='text-sm text-blue-800'>{result.description}</p>
              </div>
            )}

            {/* Portfolio Table */}
            <div>
              <h3 className='text-lg font-semibold mb-3'>
                💼 Portfolio Composition
              </h3>
              <div className='overflow-x-auto'>
                <table className='w-full border-collapse'>
                  <thead>
                    <tr className='bg-gray-50'>
                      <th className='p-3 text-left border-b'>Ticker</th>
                      <th className='p-3 text-left border-b'>Weight</th>
                      <th className='p-3 text-left border-b'>Volatility</th>
                      <th className='p-3 text-left border-b'>Confidence</th>
                      <th className='p-3 text-left border-b'>Asset Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.portfolio_assets.map((asset, index) => {
                      // Try to get enhanced asset details if available
                      const enhancedDetails =
                        result.enhancement_data?.asset_details?.find(
                          (detail: any) => detail.ticker === asset.Ticker
                        );
                      const etfInfo = getETFInfo(asset.Ticker);

                      const assetType =
                        enhancedDetails?.asset_type || 'Unknown';
                      const displayName =
                        (enhancedDetails?.name &&
                        enhancedDetails.name !== asset.Ticker
                          ? enhancedDetails.name
                          : undefined) || etfInfo?.name;
                      const volatility = enhancedDetails?.volatility
                        ? `${(enhancedDetails.volatility * 100).toFixed(1)}%`
                        : 'N/A';
                      const confidence =
                        enhancedDetails?.confidence || 'unknown';

                      return (
                        <tr key={index} className='border-b'>
                          <td className='p-3'>
                            <div className='font-medium'>{asset.Ticker}</div>
                            {displayName && (
                              <div className='text-xs text-gray-600 mt-0.5'>
                                {displayName}
                              </div>
                            )}
                          </td>
                          <td className='p-3'>
                            {(asset.Weight * 100).toFixed(1)}%
                          </td>
                          <td className='p-3'>{volatility}</td>
                          <td className='p-3'>
                            <Badge
                              variant={
                                confidence === 'high' ? 'default' : 'secondary'
                              }
                              className={
                                confidence === 'high'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {confidence}
                            </Badge>
                          </td>
                          <td className='p-3 text-gray-600'>{assetType}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Risk Analysis Section */}
            {result.risk_analysis && result.risk_analysis.success && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Shield className='h-5 w-5' />
                    📊 Risk Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <RiskAnalysisDisplay riskAnalysis={result.risk_analysis} />
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Risk Analysis Component
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
    <div className='space-y-6'>
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
            style={{ borderLeftColor: riskSummary.diversification_score.color }}
          >
            <p className='text-sm text-gray-600 mb-1'>Diversification Score</p>
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
              <p className='text-sm text-gray-600 mb-1'>Most Correlated Pair</p>
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
                {correlationAnalysis.concentration_metrics.concentration_level}
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
              <p className='text-sm text-gray-600 mb-1'>Average Correlation</p>
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
              <AlertCircle className='h-4 w-4' />
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
                {correlationAnalysis.concentration_metrics.concentration_level}
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
            {riskSummary.key_concerns.map((concern: string, index: number) => (
              <div
                key={index}
                className='p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded'
              >
                <p className='text-sm text-yellow-800'>{concern}</p>
              </div>
            ))}
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
                <p className='text-sm text-gray-600 mb-2'>{rec.description}</p>
                <p className='text-xs font-semibold text-gray-900'>
                  Action: {rec.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
