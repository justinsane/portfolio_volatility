'use client';
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
  PieChart,
  CheckCircle,
  Info,
  ArrowUpRight,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { type PredictionResult, submitEmailSignup } from '@/lib/api';
import { getETFInfo } from '@/lib/etf-mapping';
import { getDisplayName, getCategory } from '@/lib/tickerDirectory';
import { useEffect, useState } from 'react';
import {
  ensureTickersResolved,
  warmFromEnhancementDetails,
} from '@/lib/tickerResolver';
import EmailSignup from './ui/EmailSignup';
import CrashTestPanel from './CrashTestPanel';

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
    <div className='space-y-8 max-w-7xl mx-auto'>
      <div className='relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-accent/5 border border-border/50'>
        <div className='absolute inset-0 bg-grid-pattern opacity-5'></div>
        <div className='relative p-8'>
          <div className='flex items-center gap-3 mb-8'>
            <div className='p-3 rounded-xl bg-primary/10 border border-primary/20'>
              <TrendingUp className='h-6 w-6 text-primary' />
            </div>
            <div>
              <h1 className='text-4xl font-black text-foreground leading-tight'>
                Volatility Forecast Results
              </h1>
              <p className='text-muted-foreground/80 mt-3 text-lg font-medium'>
                Comprehensive portfolio risk analysis and predictions
              </p>
            </div>
          </div>

          <SummaryMetrics result={result} />
        </div>
      </div>

      <PortfolioComposition result={result} />

      {/* Risk Analysis */}
      {result.risk_analysis && result.risk_analysis.success && (
        <RiskAnalysisDisplay riskAnalysis={result.risk_analysis} />
      )}

      {/* Crash Test Analysis */}
      <CrashTestPanel portfolio={result.portfolio_assets} />

      <div className='rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 border border-border/50 p-8'>
        <EmailSignup onSubmit={submitEmailSignup} />
      </div>
    </div>
  );
}

function SummaryMetrics({ result }: { result: PredictionResult }) {
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'very high':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/30';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-800/30';
      case 'moderate':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800/30';
      case 'low':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/30';
      case 'very low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
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
        return 'Enhanced Multi-Source';
      case 'historical_random_forest':
        return 'Historical Random Forest';
      case 'asset_based_estimation':
        return 'Asset-Based Estimation';
      default:
        return modelType;
    }
  };

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
      {/* Risk Assessment - Most Prominent Card */}
      <div
        className={`group relative overflow-hidden rounded-xl border-2 p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform ${getRiskColor(
          result.risk_level
        )} shadow-lg`}
      >
        <div className='flex items-center justify-between mb-4'>
          <div className='p-2.5 rounded-lg bg-white/60 dark:bg-black/30 shadow-sm'>
            <Shield className='h-6 w-6' />
          </div>
          <div className='text-right'>
            <p className='text-xs font-semibold opacity-80'>Risk Assessment</p>
          </div>
        </div>
        <div>
          <p className='text-3xl font-black mb-2 leading-none'>
            {result.risk_level}
          </p>
          <p className='text-sm font-medium opacity-80'>Portfolio Risk Level</p>
        </div>
      </div>

      {/* Expected Volatility */}
      <div className='group relative overflow-hidden rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/30 p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform shadow-lg'>
        <div className='flex items-center justify-between mb-4'>
          <div className='p-2.5 rounded-lg bg-white/60 dark:bg-black/30 shadow-sm'>
            <Activity className='h-6 w-6' />
          </div>
          <div className='text-right'>
            <p className='text-xs font-semibold opacity-80'>Annual</p>
          </div>
        </div>
        <div>
          <div className='flex items-baseline gap-2 mb-2'>
            <p className='text-3xl font-black leading-none'>
              {result.final_volatility !== undefined
                ? `${(result.final_volatility * 100).toFixed(1)}%`
                : result.annual_volatility}
            </p>
            {result.labels?.ml_adjustment && (
              <Badge
                variant='outline'
                className='text-xs bg-white/60 dark:bg-black/30 font-medium'
              >
                ML: {result.labels.ml_adjustment}
              </Badge>
            )}
          </div>
          <p className='text-sm font-medium opacity-80'>Expected Volatility</p>
        </div>
      </div>

      {/* Time Horizon */}
      <div className='group relative overflow-hidden rounded-xl border-2 border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800/30 p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform shadow-lg'>
        <div className='flex items-center justify-between mb-4'>
          <div className='p-2.5 rounded-lg bg-white/60 dark:bg-black/30 shadow-sm'>
            <Target className='h-6 w-6' />
          </div>
          <div className='text-right'>
            <p className='text-xs font-semibold opacity-80'>Time Horizon</p>
          </div>
        </div>
        <div>
          <p className='text-3xl font-black mb-2 leading-none'>
            {result.forecast_days}
          </p>
          <p className='text-sm font-medium opacity-80'>Days Forecast</p>
        </div>
      </div>

      {/* AI Model */}
      <div className='group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-700 dark:bg-gray-950/20 dark:text-gray-400 dark:border-gray-800/30 p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform shadow-lg'>
        <div className='flex items-center justify-between mb-4'>
          <div className='p-2.5 rounded-lg bg-white/60 dark:bg-black/30 shadow-sm'>
            {getModelTypeIcon(result.model_type)}
          </div>
          <div className='text-right'>
            <p className='text-xs font-semibold opacity-80'>AI Model</p>
          </div>
        </div>
        <div>
          <p className='text-xl font-bold mb-2 leading-tight'>
            {getModelTypeLabel(result.model_type)}
          </p>
          <p className='text-sm font-medium opacity-80'>Prediction Method</p>
        </div>
      </div>

      {/* Enhanced Data Cards - Only show if enhancement data exists */}
      {result.enhancement_data && (
        <>
          {/* Data Quality */}
          <div className='group relative overflow-hidden rounded-xl border-2 border-green-200 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/30 p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform shadow-lg'>
            <div className='flex items-center justify-between mb-4'>
              <div className='p-2.5 rounded-lg bg-white/60 dark:bg-black/30 shadow-sm'>
                <Globe className='h-6 w-6' />
              </div>
              <div className='text-right'>
                <p className='text-xs font-semibold opacity-80'>Data Quality</p>
              </div>
            </div>
            <div>
              <p className='text-3xl font-black mb-2 leading-none'>
                {(
                  result.enhancement_data.coverage_analysis.coverage_by_count *
                  100
                ).toFixed(0)}
                %
              </p>
              <p className='text-sm font-medium opacity-80'>Asset Coverage</p>
            </div>
          </div>

          {/* Reliability */}
          <div className='group relative overflow-hidden rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/30 p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform shadow-lg'>
            <div className='flex items-center justify-between mb-4'>
              <div className='p-2.5 rounded-lg bg-white/60 dark:bg-black/30 shadow-sm'>
                {result.enhancement_data.overall_confidence === 'high' ? (
                  <CheckCircle className='h-6 w-6 text-green-600' />
                ) : (
                  <Info className='h-6 w-6 text-yellow-600' />
                )}
              </div>
              <div className='text-right'>
                <p className='text-xs font-semibold opacity-80'>Reliability</p>
              </div>
            </div>
            <div>
              <div className='flex items-center gap-2 mb-2'>
                <p className='text-2xl font-black capitalize leading-none'>
                  {result.enhancement_data.overall_confidence}
                </p>
              </div>
              <p className='text-sm font-medium opacity-80'>Confidence Level</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PortfolioComposition({ result }: { result: PredictionResult }) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'large cap':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/50';
      case 'mid cap':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800/50';
      case 'small cap':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-blue-800/50';
      case 'international':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800/50';
      case 'emerging markets':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800/50';
      case 'bond':
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950/30 dark:text-gray-300 dark:border-gray-800/50';
      case 'real estate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-300 dark:border-yellow-800/50';
      case 'technology':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800/50';
      case 'sector':
        return 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-950/30 dark:text-pink-300 dark:border-pink-800/50';
      case 'commodity':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/50';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800/50';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-300 dark:border-yellow-800/50';
      case 'low':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800/50';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getVolatilityColor = (volatility: string) => {
    if (volatility === 'N/A') return 'text-muted-foreground';
    const volValue = parseFloat(volatility.replace('%', ''));
    if (volValue < 10) return 'text-green-600 dark:text-green-400';
    if (volValue < 20) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Infer whether weights are fractional (0..1) or already percents (0..100)
  const maxWeight = Math.max(
    0,
    ...result.portfolio_assets.map(a =>
      typeof a.Weight === 'number' ? a.Weight : 0
    )
  );
  const weightsAreFractional = maxWeight <= 1.0000001; // tolerate float drift

  // Sorting function
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'asc'
    ) {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className='h-4 w-4 text-muted-foreground' />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className='h-4 w-4 text-primary' />
    ) : (
      <ChevronDown className='h-4 w-4 text-primary' />
    );
  };

  // Sort assets
  const sortedAssets = [...result.portfolio_assets].sort((a, b) => {
    if (!sortConfig) return 0;

    const enhancedDetailsA = result.enhancement_data?.asset_details?.find(
      (detail: any) => detail.ticker === a.Ticker
    );
    const enhancedDetailsB = result.enhancement_data?.asset_details?.find(
      (detail: any) => detail.ticker === b.Ticker
    );

    let aValue: any;
    let bValue: any;

    switch (sortConfig.key) {
      case 'asset':
        aValue = a.Ticker.toLowerCase();
        bValue = b.Ticker.toLowerCase();
        break;
      case 'weight':
        aValue = weightsAreFractional ? a.Weight * 100 : a.Weight;
        bValue = weightsAreFractional ? b.Weight * 100 : b.Weight;
        break;
      case 'volatility':
        aValue = enhancedDetailsA?.volatility || 0;
        bValue = enhancedDetailsB?.volatility || 0;
        break;
      case 'confidence':
        aValue = enhancedDetailsA?.confidence || 'unknown';
        bValue = enhancedDetailsB?.confidence || 'unknown';
        break;
      case 'category':
        aValue =
          enhancedDetailsA?.asset_type || getCategory(a.Ticker) || 'Unknown';
        bValue =
          enhancedDetailsB?.asset_type || getCategory(b.Ticker) || 'Unknown';
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleRowExpansion = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const handleAssetClick = (asset: any) => {
    // TODO: Implement asset detail view (modal or navigation)
    console.log('Opening asset details for:', asset.Ticker);
  };

  return (
    <Card className='border-2 border-border/50 shadow-lg'>
      <CardHeader className='pb-6'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='p-2 rounded-lg bg-primary/10 border border-primary/20'>
              <PieChart className='h-5 w-5 text-primary' />
            </div>
            <div>
              <CardTitle className='text-xl'>Portfolio Composition</CardTitle>
              <p className='text-sm text-muted-foreground mt-1'>
                Your current holdings and allocation
              </p>
            </div>
          </div>
          <Badge variant='outline' className='self-start sm:self-auto'>
            {result.portfolio_assets.length} Assets
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Mobile Card Layout */}
        <div className='block lg:hidden space-y-4'>
          {sortedAssets.map((asset, index) => {
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
              (enhancedDetails?.name && enhancedDetails.name !== asset.Ticker
                ? enhancedDetails.name
                : undefined) ||
              directoryName ||
              etfInfo?.name;

            const percent = weightsAreFractional
              ? asset.Weight * 100
              : asset.Weight;
            const percentInt = Math.round(percent);
            const isExpanded = expandedRows.has(index);

            return (
              <div
                key={index}
                className='group relative overflow-hidden rounded-xl border-2 border-border/50 bg-gradient-to-br from-background to-muted/30 transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:scale-[1.01] transform'
              >
                {/* Main Asset Info Row */}
                <div
                  className='flex items-start justify-between p-6 cursor-pointer'
                  onClick={() => handleAssetClick(asset)}
                >
                  <div className='flex items-center gap-3 flex-1 min-w-0'>
                    <div className='w-12 h-12 rounded-xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center flex-shrink-0'>
                      <span className='text-sm font-bold text-primary'>
                        {asset.Ticker.slice(0, 2)}
                      </span>
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='font-bold text-lg text-foreground group-hover:text-primary transition-colors'>
                        {asset.Ticker}
                      </div>
                      {displayName && (
                        <div className='text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed'>
                          {displayName}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className='text-right flex-shrink-0'>
                    <div className='text-2xl font-black text-primary mb-1'>
                      {percentInt}%
                    </div>
                    <div className='w-20 h-2 bg-muted rounded-full overflow-hidden'>
                      <div
                        className='h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300'
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Secondary Metrics Row */}
                <div className='px-6 pb-4'>
                  <div className='grid grid-cols-2 gap-4 pt-4 border-t border-border/30'>
                    <div className='space-y-2'>
                      <div className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                        Volatility
                      </div>
                      <div className='flex items-center gap-2'>
                        <span
                          className={`font-semibold text-lg ${getVolatilityColor(
                            volatility
                          )}`}
                        >
                          {volatility}
                        </span>
                        {volatility !== 'N/A' && (
                          <div className='w-2 h-2 rounded-full bg-primary/60'></div>
                        )}
                      </div>
                    </div>
                    <div className='space-y-2'>
                      <div className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                        Category
                      </div>
                      <Badge
                        variant='outline'
                        className={`font-medium border text-sm ${getCategoryColor(
                          assetType
                        )}`}
                      >
                        {assetType}
                      </Badge>
                    </div>
                  </div>

                  {/* Expandable Section */}
                  <div className='pt-4 border-t border-border/30'>
                    <div className='flex items-center justify-between'>
                      <div className='space-y-2 flex-1'>
                        <div className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                          Confidence
                        </div>
                        <Badge
                          variant='outline'
                          className={`font-medium border text-sm ${getConfidenceColor(
                            confidence
                          )}`}
                        >
                          {confidence}
                        </Badge>
                      </div>
                      <div className='flex items-center gap-2'>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            toggleRowExpansion(index);
                          }}
                          className='p-2 rounded-lg hover:bg-muted/50 transition-colors'
                        >
                          {isExpanded ? (
                            <ChevronUp className='h-5 w-5 text-muted-foreground' />
                          ) : (
                            <ChevronDown className='h-5 w-5 text-muted-foreground' />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className='mt-4 pt-4 border-t border-border/30 space-y-3'>
                        <div className='text-sm text-muted-foreground'>
                          <strong>Asset Details:</strong> Click to view
                          comprehensive information about this holding.
                        </div>
                        <div className='flex gap-2'>
                          <button className='flex-1 px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium'>
                            View Details
                          </button>
                          <button className='px-3 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm font-medium'>
                            Edit
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table Layout */}
        <div className='hidden lg:block'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10'>
                <tr className='border-b-2 border-border'>
                  <th className='text-left p-4 font-semibold text-foreground sticky left-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-20'>
                    <button
                      onClick={() => handleSort('asset')}
                      className='flex items-center gap-2 hover:text-primary transition-colors'
                    >
                      Asset
                      {getSortIcon('asset')}
                    </button>
                  </th>
                  <th className='text-left p-4 font-semibold text-foreground'>
                    <button
                      onClick={() => handleSort('weight')}
                      className='flex items-center gap-2 hover:text-primary transition-colors'
                    >
                      Weight
                      {getSortIcon('weight')}
                    </button>
                  </th>
                  <th className='text-left p-4 font-semibold text-foreground'>
                    <button
                      onClick={() => handleSort('volatility')}
                      className='flex items-center gap-2 hover:text-primary transition-colors'
                    >
                      Volatility
                      {getSortIcon('volatility')}
                    </button>
                  </th>
                  <th className='text-left p-4 font-semibold text-foreground'>
                    <button
                      onClick={() => handleSort('confidence')}
                      className='flex items-center gap-2 hover:text-primary transition-colors'
                    >
                      Confidence
                      {getSortIcon('confidence')}
                    </button>
                  </th>
                  <th className='text-left p-4 font-semibold text-foreground'>
                    <button
                      onClick={() => handleSort('category')}
                      className='flex items-center gap-2 hover:text-primary transition-colors'
                    >
                      Category
                      {getSortIcon('category')}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border/50'>
                {sortedAssets.map((asset, index) => {
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
                      className='hover:bg-muted/30 transition-all duration-200 group cursor-pointer'
                      onClick={() => handleAssetClick(asset)}
                    >
                      <td className='p-4 sticky left-0 bg-background group-hover:bg-muted/30 transition-colors z-10'>
                        <div className='flex items-center gap-3'>
                          <div className='w-12 h-12 rounded-xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center flex-shrink-0'>
                            <span className='text-sm font-bold text-primary'>
                              {asset.Ticker.slice(0, 2)}
                            </span>
                          </div>
                          <div className='min-w-0 flex-1'>
                            <div className='font-bold text-lg text-foreground group-hover:text-primary transition-colors'>
                              {asset.Ticker}
                            </div>
                            {displayName && (
                              <div className='text-sm text-muted-foreground mt-1 line-clamp-1'>
                                {displayName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className='p-4'>
                        <div className='flex items-center gap-3'>
                          <span className='font-bold text-xl text-primary min-w-[3rem]'>
                            {percentInt}%
                          </span>
                          <div className='flex-1 max-w-32'>
                            <div className='w-full h-3 bg-muted rounded-full overflow-hidden'>
                              <div
                                className='h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300'
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className='p-4'>
                        <div className='flex items-center gap-2'>
                          <span
                            className={`font-semibold text-lg ${getVolatilityColor(
                              volatility
                            )}`}
                          >
                            {volatility}
                          </span>
                          {volatility !== 'N/A' && (
                            <div className='w-3 h-3 rounded-full bg-primary/60'></div>
                          )}
                        </div>
                      </td>
                      <td className='p-4'>
                        <Badge
                          variant='outline'
                          className={`font-medium border text-sm ${getConfidenceColor(
                            confidence
                          )}`}
                        >
                          {confidence}
                        </Badge>
                      </td>
                      <td className='p-4'>
                        <Badge
                          variant='outline'
                          className={`font-medium border text-sm ${getCategoryColor(
                            assetType
                          )}`}
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
        return '#dc2626';
      case 'High':
        return '#ea580c';
      case 'Moderate':
        return '#d97706';
      case 'Low':
        return '#16a34a';
      case 'Very Low':
        return '#059669';
      default:
        return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#dc2626';
      case 'medium':
        return '#ea580c';
      case 'low':
        return '#16a34a';
      default:
        return '#6b7280';
    }
  };

  return (
    <Card className='border-2 border-border/50 shadow-lg'>
      <CardHeader className='pb-6'>
        <CardTitle className='flex items-center gap-3 text-xl'>
          <div className='p-2 rounded-lg bg-primary/10 border border-primary/20'>
            <Shield className='h-5 w-5 text-primary' />
          </div>
          Risk Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-8'>
        <div>
          <h4 className='text-lg font-semibold mb-6 flex items-center gap-2'>
            <Shield className='h-5 w-5 text-primary' />
            Risk Summary
          </h4>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div
              className='relative overflow-hidden rounded-xl border-2 p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-sm hover:shadow-md transition-shadow'
              style={{ borderColor: riskSummary.risk_color }}
            >
              <div className='flex items-center justify-between mb-4'>
                <div className='p-2 rounded-lg bg-white/80 dark:bg-black/20 shadow-sm'>
                  <Shield
                    className='h-5 w-5'
                    style={{ color: riskSummary.risk_color }}
                  />
                </div>
                <div className='text-right'>
                  <p className='text-xs font-medium text-muted-foreground'>
                    Overall Assessment
                  </p>
                </div>
              </div>
              <div>
                <p
                  className='text-2xl font-bold mb-2'
                  style={{ color: riskSummary.risk_color }}
                >
                  {riskSummary.overall_risk_level}
                </p>
                <p className='text-sm text-muted-foreground'>
                  Based on correlation & concentration
                </p>
              </div>
            </div>

            <div
              className='relative overflow-hidden rounded-xl border-2 p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-sm hover:shadow-md transition-shadow'
              style={{ borderColor: riskSummary.diversification_score.color }}
            >
              <div className='flex items-center justify-between mb-4'>
                <div className='p-2 rounded-lg bg-white/80 dark:bg-black/20 shadow-sm'>
                  <PieChart
                    className='h-5 w-5'
                    style={{ color: riskSummary.diversification_score.color }}
                  />
                </div>
                <div className='text-right'>
                  <p className='text-xs font-medium text-muted-foreground'>
                    Portfolio Balance
                  </p>
                </div>
              </div>
              <div>
                <p
                  className='text-2xl font-bold mb-2'
                  style={{ color: riskSummary.diversification_score.color }}
                >
                  {riskSummary.diversification_score.score}/100
                </p>
                <p className='text-sm text-muted-foreground line-clamp-2'>
                  {riskSummary.diversification_score.explanation ||
                    'Diversification analysis completed'}
                </p>
              </div>
            </div>

            <div className='relative overflow-hidden rounded-xl border-2 border-primary/30 p-6 bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm hover:shadow-md transition-shadow'>
              <div className='flex items-center justify-between mb-4'>
                <div className='p-2 rounded-lg bg-white/80 dark:bg-black/20 shadow-sm'>
                  <BarChart3 className='h-5 w-5 text-primary' />
                </div>
                <div className='text-right'>
                  <p className='text-xs font-medium text-muted-foreground'>
                    Risk Score
                  </p>
                </div>
              </div>
              <div>
                <p className='text-2xl font-bold text-primary mb-2'>
                  {riskSummary.risk_score}/100
                </p>
                <p className='text-sm text-muted-foreground'>
                  Comprehensive risk metric
                </p>
              </div>
            </div>
          </div>
        </div>

        {correlationAnalysis.success ? (
          <div>
            <h4 className='text-lg font-semibold mb-6 flex items-center gap-2'>
              <TrendingUp className='h-5 w-5 text-primary' />
              Correlation Analysis
            </h4>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div
                className='relative overflow-hidden rounded-xl border-2 p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-sm hover:shadow-md transition-shadow'
                style={{
                  borderColor:
                    correlationAnalysis.most_correlated_pair.risk_color,
                }}
              >
                <div className='flex items-center justify-between mb-4'>
                  <div className='p-2 rounded-lg bg-white/80 dark:bg-black/20 shadow-sm'>
                    <TrendingUp
                      className='h-5 w-5'
                      style={{
                        color:
                          correlationAnalysis.most_correlated_pair.risk_color,
                      }}
                    />
                  </div>
                  <div className='text-right'>
                    <p className='text-xs font-medium text-muted-foreground'>
                      Highest Correlation
                    </p>
                  </div>
                </div>
                <div>
                  <p className='text-lg font-semibold text-foreground mb-1'>
                    {correlationAnalysis.most_correlated_pair.asset1} &{' '}
                    {correlationAnalysis.most_correlated_pair.asset2}
                  </p>
                  <p
                    className='text-xl font-bold mb-2'
                    style={{
                      color:
                        correlationAnalysis.most_correlated_pair.risk_color,
                    }}
                  >
                    {(
                      correlationAnalysis.most_correlated_pair.correlation * 100
                    ).toFixed(1)}
                    %
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {correlationAnalysis.most_correlated_pair.risk_description}
                  </p>
                </div>
              </div>

              <div
                className='relative overflow-hidden rounded-xl border-2 p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-sm hover:shadow-md transition-shadow'
                style={{
                  borderColor:
                    correlationAnalysis.concentration_metrics.risk_color,
                }}
              >
                <div className='flex items-center justify-between mb-4'>
                  <div className='p-2 rounded-lg bg-white/80 dark:bg-black/20 shadow-sm'>
                    <Target
                      className='h-5 w-5'
                      style={{
                        color:
                          correlationAnalysis.concentration_metrics.risk_color,
                      }}
                    />
                  </div>
                  <div className='text-right'>
                    <p className='text-xs font-medium text-muted-foreground'>
                      Concentration Risk
                    </p>
                  </div>
                </div>
                <div>
                  <p className='text-lg font-semibold text-foreground mb-1'>
                    HHI: {correlationAnalysis.concentration_metrics.hhi}
                  </p>
                  <p
                    className='text-xl font-bold mb-2'
                    style={{
                      color:
                        correlationAnalysis.concentration_metrics.risk_color,
                    }}
                  >
                    {
                      correlationAnalysis.concentration_metrics
                        .concentration_level
                    }
                  </p>
                  <p className='text-xs text-muted-foreground'>
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
              </div>

              <div className='relative overflow-hidden rounded-xl border-2 border-primary/30 p-6 bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm hover:shadow-md transition-shadow'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='p-2 rounded-lg bg-white/80 dark:bg-black/20 shadow-sm'>
                    <Activity className='h-5 w-5 text-primary' />
                  </div>
                  <div className='text-right'>
                    <p className='text-xs font-medium text-muted-foreground'>
                      Portfolio Correlation
                    </p>
                  </div>
                </div>
                <div>
                  <p className='text-2xl font-bold text-primary mb-2'>
                    {(correlationAnalysis.average_correlation * 100).toFixed(1)}
                    %
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Lower is better for diversification
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h4 className='text-lg font-semibold mb-6 flex items-center gap-2'>
              <TrendingUp className='h-5 w-5 text-primary' />
              Correlation Analysis
            </h4>
            {correlationAnalysis.single_asset_portfolio ? (
              <Alert className='border-amber-200 bg-amber-50 dark:bg-amber-950/20'>
                <AlertTriangle className='h-4 w-4 text-amber-600' />
                <AlertDescription className='text-amber-800 dark:text-amber-200'>
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
          </div>
        )}

        {riskSummary.key_concerns && riskSummary.key_concerns.length > 0 && (
          <div>
            <h4 className='text-lg font-semibold mb-6 flex items-center gap-2'>
              <AlertTriangle className='h-5 w-5 text-amber-600' />
              Key Concerns
            </h4>
            <div className='grid gap-4'>
              {riskSummary.key_concerns.map(
                (concern: string, index: number) => (
                  <div
                    key={index}
                    className='flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-400 rounded-lg'
                  >
                    <AlertTriangle className='h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0' />
                    <p className='text-sm text-amber-800 dark:text-amber-200 leading-relaxed'>
                      {concern}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {recommendations && recommendations.length > 0 && (
          <div>
            <h4 className='text-lg font-semibold mb-6 flex items-center gap-2'>
              <Lightbulb className='h-5 w-5 text-primary' />
              Recommendations
            </h4>
            <div className='grid gap-6'>
              {recommendations.map((rec: any, index: number) => (
                <div
                  key={index}
                  className='relative overflow-hidden rounded-xl border-2 p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-sm hover:shadow-md transition-shadow'
                  style={{ borderColor: getPriorityColor(rec.priority) }}
                >
                  <div className='flex justify-between items-start mb-4'>
                    <div className='flex items-center gap-3'>
                      <div className='p-2 rounded-lg bg-white/80 dark:bg-black/20 shadow-sm'>
                        <Lightbulb
                          className='h-5 w-5'
                          style={{ color: getPriorityColor(rec.priority) }}
                        />
                      </div>
                      <h5 className='font-semibold text-foreground text-lg'>
                        {rec.title}
                      </h5>
                    </div>
                    <Badge
                      className='text-xs font-semibold px-3 py-1'
                      style={{
                        backgroundColor: getPriorityColor(rec.priority),
                        color: 'white',
                      }}
                    >
                      {rec.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <p className='text-muted-foreground mb-4 leading-relaxed'>
                    {rec.description}
                  </p>
                  <div className='flex items-start gap-2 p-3 bg-muted/30 rounded-lg'>
                    <ArrowUpRight className='h-4 w-4 text-primary mt-0.5 flex-shrink-0' />
                    <p className='text-sm font-medium text-foreground'>
                      <span className='text-primary'>Action:</span> {rec.action}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
