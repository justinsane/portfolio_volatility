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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { Button } from './ui/button';

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
        <RiskAnalysisDisplay
          riskAnalysis={result.risk_analysis}
          portfolioAssets={result.portfolio_assets}
        />
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

function RiskAnalysisDisplay({
  riskAnalysis,
  portfolioAssets,
}: {
  riskAnalysis: any;
  portfolioAssets: any[];
}) {
  const [expandedConcerns, setExpandedConcerns] = useState(false);
  const [learnMoreDialog, setLearnMoreDialog] = useState<{
    isOpen: boolean;
    topic: string;
    recommendation: any;
  }>({
    isOpen: false,
    topic: '',
    recommendation: null,
  });

  // Safety check: if risk analysis is missing, show a message
  if (!riskAnalysis || !riskAnalysis.risk_metrics) {
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
        <CardContent>
          <Alert>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>
              <strong>Risk Analysis Unavailable</strong>
              <br />
              Risk analysis data is not available for this portfolio. Please try
              again or contact support if the issue persists.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  // Helper function to generate dynamic concerns based on portfolio data
  const generateDynamicConcerns = () => {
    const dynamicConcerns = [];

    // Safety check: if risk analysis data is missing, return empty array
    if (!riskAnalysis?.risk_metrics) {
      return dynamicConcerns;
    }

    const { correlationAnalysis, riskSummary } = riskAnalysis.risk_metrics;

    // Analyze correlation concerns
    if (
      correlationAnalysis?.success &&
      correlationAnalysis?.most_correlated_pair
    ) {
      const { asset1, asset2, correlation, correlation_level } =
        correlationAnalysis.most_correlated_pair;
      if (correlation_level === 'Very High' || correlation_level === 'High') {
        dynamicConcerns.push({
          type: 'correlation',
          title: `High Correlation Between ${asset1} and ${asset2}`,
          description: `Their strong positive relationship (${(
            correlation * 100
          ).toFixed(
            1
          )}%) means they offer less diversification when market conditions shift. Consider reducing exposure to one of these or adding uncorrelated assets.`,
          severity: correlation_level === 'Very High' ? 'critical' : 'high',
          action: 'correlation',
        });
      }
    }

    // Analyze concentration concerns
    if (
      correlationAnalysis?.success &&
      correlationAnalysis?.concentration_metrics
    ) {
      const { hhi, concentration_level, largest_holding } =
        correlationAnalysis.concentration_metrics;
      if (
        concentration_level === 'Very High' ||
        concentration_level === 'High'
      ) {
        dynamicConcerns.push({
          type: 'concentration',
          title: `Significant Portfolio Concentration (HHI: ${hhi})`,
          description: `Your portfolio's structure indicates a high reliance on a few specific assets, increasing vulnerability to the underperformance of those holdings.`,
          severity: concentration_level === 'Very High' ? 'critical' : 'high',
          action: 'concentration',
        });
      }
    }

    // Analyze single holding concentration
    if (
      correlationAnalysis?.success &&
      correlationAnalysis?.concentration_metrics?.largest_holding
    ) {
      const { ticker, percentage } =
        correlationAnalysis.concentration_metrics.largest_holding;
      if (percentage > 25) {
        // More than 25%
        dynamicConcerns.push({
          type: 'single-holding',
          title: `Over-Reliance on ${ticker}`,
          description: `With ${ticker} comprising ${percentage}% of your portfolio, its performance will disproportionately impact your overall returns and risk. Consider rebalancing to distribute your capital across more holdings.`,
          severity: percentage > 40 ? 'critical' : 'high',
          action: 'single-holding',
        });
      }
    }

    // Analyze top 3 holdings concentration
    if (portfolioAssets && portfolioAssets.length >= 3) {
      const sortedAssets = [...portfolioAssets].sort(
        (a, b) => b.Weight - a.Weight
      );
      const top3Holdings = sortedAssets.slice(0, 3);
      const top3TotalWeight = top3Holdings.reduce(
        (sum, asset) => sum + asset.Weight,
        0
      );
      const top3Percentage =
        top3TotalWeight >= 1 ? top3TotalWeight : top3TotalWeight * 100;

      if (top3Percentage > 70) {
        // More than 70%
        const top3Tickers = top3Holdings.map(a => a.Ticker).join(', ');
        dynamicConcerns.push({
          type: 'top3-concentration',
          title: `Top Holdings Dominate Portfolio`,
          description: `${top3Percentage.toFixed(
            1
          )}% of your portfolio is concentrated in just your top 3 assets (${top3Tickers}). This extreme concentration can lead to higher volatility and lower risk-adjusted returns compared to a more diversified portfolio.`,
          severity: top3Percentage > 80 ? 'critical' : 'high',
          action: 'top3-concentration',
        });
      }
    }

    // Add any additional concerns from the original key_concerns that aren't covered by dynamic analysis
    const coveredConcernTypes = dynamicConcerns.map(c => c.type);
    const additionalConcerns = (riskSummary?.key_concerns || []).filter(
      (concern: string) => {
        const lowerConcern = concern.toLowerCase();
        // Check if this concern is already covered by our dynamic analysis
        if (
          lowerConcern.includes('correlation') &&
          coveredConcernTypes.includes('correlation')
        )
          return false;
        if (
          lowerConcern.includes('concentration') &&
          coveredConcernTypes.includes('concentration')
        )
          return false;
        if (
          lowerConcern.includes('hhi') &&
          coveredConcernTypes.includes('concentration')
        )
          return false;
        if (
          lowerConcern.includes('largest') &&
          coveredConcernTypes.includes('single-holding')
        )
          return false;
        if (
          lowerConcern.includes('top 3') &&
          coveredConcernTypes.includes('top3-concentration')
        )
          return false;
        return true;
      }
    );

    // Convert additional concerns to dynamic format
    additionalConcerns.forEach((concern: string) => {
      dynamicConcerns.push({
        type: 'general',
        title: 'Portfolio Risk Concern',
        description: concern,
        severity: 'medium',
        action: 'general',
      });
    });

    return dynamicConcerns;
  };
  const metrics = riskAnalysis.risk_metrics;
  const correlationAnalysis = metrics?.correlation_analysis;
  const riskSummary = metrics?.risk_summary;
  const recommendations = metrics?.recommendations;

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

  const getRiskLevelBgColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Very High':
        return 'bg-gradient-to-br from-red-600 to-red-700 dark:from-red-700 dark:to-red-800';
      case 'High':
        return 'bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700';
      case 'Moderate':
        return 'bg-gradient-to-br from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700';
      case 'Low':
        return 'bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700';
      case 'Very Low':
        return 'bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700';
      default:
        return 'bg-gradient-to-br from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700';
    }
  };

  const handleReviewRecommendations = () => {
    // Scroll to recommendations section
    const recommendationsSection = document.getElementById(
      'recommendations-section'
    );
    if (recommendationsSection) {
      recommendationsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLearnMore = (topic: string, recommendation: any) => {
    setLearnMoreDialog({
      isOpen: true,
      topic,
      recommendation,
    });
  };

  const getLearnMoreContent = (topic: string, recommendation: any) => {
    const content = {
      'high-correlation': {
        title: 'Understanding High Correlation',
        summary:
          'High correlation between assets means they move together, reducing diversification benefits and increasing portfolio risk.',
        sections: [
          {
            title: 'What is Correlation?',
            content:
              'Correlation measures how closely two assets move together. A correlation of 1.0 means they move in perfect sync, while 0.0 means they move independently. When assets have high correlation (above 80%), they offer limited diversification benefits.',
          },
          {
            title: 'Why High Correlation is Risky',
            content:
              'When highly correlated assets decline together, your portfolio loses diversification benefits. This can lead to larger losses during market downturns and reduced risk-adjusted returns.',
          },
          {
            title: 'Strategies to Reduce Correlation',
            content:
              'Consider adding assets with low correlation to your current holdings, such as: • International equities • Real estate • Commodities • Alternative investments',
          },
          {
            title: 'Target Goals',
            content:
              'Aim to reduce correlation between highly correlated assets to below 70%. Consider replacing one asset with a different asset class to improve diversification.',
          },
        ],
        actions: [
          { label: 'Explore Alternative Assets', action: 'explore-assets' },
          { label: 'Rebalance Portfolio', action: 'rebalance' },
          { label: 'View Correlation Matrix', action: 'correlation-matrix' },
        ],
      },
      'portfolio-concentration': {
        title: 'Addressing Portfolio Concentration',
        summary:
          'High concentration in a few assets increases risk. Your portfolio has significant exposure to individual holdings.',
        sections: [
          {
            title: 'What is Concentration Risk?',
            content:
              'Concentration risk occurs when a large portion of your portfolio is invested in a few assets. This reduces diversification benefits and increases overall portfolio volatility.',
          },
          {
            title: 'Why Concentration is Dangerous',
            content:
              'High concentration means poor diversification. If your largest holdings decline significantly, they will have a major impact on your entire portfolio performance. This can lead to larger losses during market downturns.',
          },
          {
            title: 'Strategies to Reduce Concentration',
            content:
              '• Gradually reduce large positions to 5-15% of portfolio • Add more diverse assets across different sectors • Consider dollar-cost averaging into new positions • Set maximum allocation limits per asset (e.g., 10-15%)',
          },
          {
            title: 'Rebalancing Approach',
            content:
              'Instead of selling all at once, consider: • Selling portions of large positions gradually • Investing new capital into other assets • Setting up automatic rebalancing rules • Using dollar-cost averaging to reduce impact',
          },
        ],
        actions: [
          { label: 'Create Rebalancing Plan', action: 'rebalancing-plan' },
          {
            label: 'Explore Diversification Tools',
            action: 'diversification-tools',
          },
          { label: 'Set Allocation Targets', action: 'allocation-targets' },
        ],
      },
      'single-asset-concentration': {
        title: 'Managing Single Asset Concentration',
        summary:
          'A single asset represents a large portion of your portfolio, creating concentration risk and reducing diversification benefits.',
        sections: [
          {
            title: 'Current Concentration Risk',
            content:
              'Having a single asset dominate your portfolio creates significant volatility risk. If this asset declines significantly, it will have a major impact on your entire portfolio performance.',
          },
          {
            title: 'Recommended Allocation',
            content:
              'For most investors, no single asset should represent more than 10-15% of total portfolio. Consider reducing large positions to improve diversification and reduce risk.',
          },
          {
            title: 'Reduction Strategies',
            content:
              '• Gradually reduce the large position over 3-6 months • Reallocate proceeds to diversified ETFs • Consider dollar-cost averaging out to minimize tax impact • Replace with more stable, diversified assets',
          },
          {
            title: 'Alternative Approaches',
            content:
              'If you want to maintain exposure to this asset class, consider: • Sector ETFs for broader exposure • Index funds for diversification • Smaller allocations across multiple related assets',
          },
        ],
        actions: [
          { label: 'Calculate Reduction Plan', action: 'reduction-calculator' },
          {
            label: 'Explore Diversified Alternatives',
            action: 'diversified-alternatives',
          },
          { label: 'Set Up Dollar-Cost Averaging', action: 'dca-setup' },
        ],
      },
      'top3-concentration': {
        title: 'Addressing Top 3 Holdings Concentration',
        summary:
          'Your top 3 holdings represent a large portion of your portfolio, creating concentration risk and limiting diversification.',
        sections: [
          {
            title: 'Current Concentration Risk',
            content:
              'Having your top 3 holdings dominate your portfolio reduces diversification benefits. This concentration can lead to higher volatility and increased risk during market downturns.',
          },
          {
            title: 'Recommended Allocation',
            content:
              'Aim to have your top 3 holdings represent no more than 50-60% of your total portfolio. This provides better diversification across more assets and sectors.',
          },
          {
            title: 'Diversification Strategies',
            content:
              '• Add 5-7 new positions across different asset classes • Consider international equities (VXUS, IEFA) • Add real estate (VNQ, IYR) and commodities (DJP, GSG) • Include sector-specific ETFs for targeted exposure',
          },
          {
            title: 'Implementation Approach',
            content:
              '• Start with broad market ETFs for core positions • Add sector-specific funds gradually • Consider target-date funds for automatic rebalancing • Review and rebalance quarterly',
          },
        ],
        actions: [
          { label: 'Explore New Asset Classes', action: 'explore-assets' },
          {
            label: 'Portfolio Diversification Tool',
            action: 'diversification-tool',
          },
          {
            label: 'Asset Allocation Calculator',
            action: 'allocation-calculator',
          },
        ],
      },
      diversification: {
        title: 'Improving Portfolio Diversification',
        summary:
          'Your portfolio lacks sufficient diversification across asset classes, sectors, and geographies.',
        sections: [
          {
            title: 'Current Diversification Issues',
            content:
              'Your portfolio is heavily concentrated in a few assets and lacks exposure to important asset classes like international equities, real estate, and commodities.',
          },
          {
            title: 'Benefits of Diversification',
            content:
              'Proper diversification: • Reduces overall portfolio volatility • Improves risk-adjusted returns • Protects against sector-specific downturns • Provides exposure to different economic cycles',
          },
          {
            title: 'Recommended Asset Allocation',
            content:
              'Consider a more balanced approach: • 40-60% US equities • 20-30% International equities • 10-20% Bonds • 5-10% Real estate • 5-10% Commodities/Alternatives',
          },
          {
            title: 'Implementation Strategy',
            content:
              '• Start with broad market ETFs for core positions • Add sector-specific funds gradually • Consider target-date funds for automatic rebalancing • Review and rebalance quarterly',
          },
        ],
        actions: [
          { label: 'Build Diversified Portfolio', action: 'portfolio-builder' },
          {
            label: 'Asset Allocation Calculator',
            action: 'allocation-calculator',
          },
          { label: 'Sector Analysis Tool', action: 'sector-analysis' },
        ],
      },
    };

    return content[topic as keyof typeof content] || content['diversification'];
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
        {/* Risk Summary Section - Redesigned for Impact */}
        <div>
          <h4 className='text-lg font-semibold mb-6 flex items-center gap-2'>
            <Shield className='h-5 w-5 text-primary' />
            Risk Summary
          </h4>

          {/* Mobile Layout */}
          <div className='block lg:hidden space-y-6'>
            {/* Dominant Risk Assessment Card */}
            <div
              className={`relative overflow-hidden rounded-2xl p-8 ${getRiskLevelBgColor(
                riskSummary.overall_risk_level
              )} text-white shadow-xl transform hover:scale-[1.02] transition-all duration-300`}
            >
              <div className='absolute inset-0 bg-black/10'></div>
              <div className='relative'>
                <div className='flex items-center justify-between mb-6'>
                  <div className='p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg'>
                    <Shield className='h-8 w-8 text-white' />
                  </div>
                  <div className='text-right'>
                    <p className='text-sm font-medium text-white/80'>
                      Overall Assessment
                    </p>
                  </div>
                </div>
                <div className='mb-6'>
                  <p className='text-5xl font-black mb-3 leading-none'>
                    {riskSummary.overall_risk_level}
                  </p>
                  <p className='text-lg text-white/90 font-medium'>
                    Based on correlation & concentration analysis
                  </p>
                </div>
                <button
                  onClick={handleReviewRecommendations}
                  className='w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-4 px-6 rounded-xl border border-white/30 transition-all duration-200 hover:shadow-lg'
                >
                  Review Recommendations →
                </button>
              </div>
            </div>

            {/* Secondary Metrics Cards */}
            <div className='grid grid-cols-1 gap-4'>
              <div className='relative overflow-hidden rounded-xl border-2 p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-sm hover:shadow-md transition-shadow'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='p-2 rounded-lg bg-white/80 dark:bg-black/20 shadow-sm'>
                    <PieChart className='h-5 w-5 text-blue-600' />
                  </div>
                  <div className='text-right'>
                    <p className='text-xs font-medium text-muted-foreground'>
                      Portfolio Balance
                    </p>
                  </div>
                </div>
                <div>
                  <p className='text-3xl font-bold text-blue-600 mb-2'>
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
                  <p className='text-3xl font-bold text-primary mb-2'>
                    {riskSummary.risk_score}/100
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Comprehensive risk metric
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className='hidden lg:grid lg:grid-cols-12 lg:gap-6'>
            {/* Dominant Risk Assessment Card - Takes 6 columns */}
            <div
              className={`lg:col-span-6 relative overflow-hidden rounded-2xl p-8 ${getRiskLevelBgColor(
                riskSummary.overall_risk_level
              )} text-white shadow-xl transform hover:scale-[1.02] transition-all duration-300`}
            >
              <div className='absolute inset-0 bg-black/10'></div>
              <div className='relative'>
                <div className='flex items-center justify-between mb-6'>
                  <div className='p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg'>
                    <Shield className='h-8 w-8 text-white' />
                  </div>
                  <div className='text-right'>
                    <p className='text-sm font-medium text-white/80'>
                      Overall Assessment
                    </p>
                  </div>
                </div>
                <div className='mb-6'>
                  <p className='text-5xl font-black mb-3 leading-none'>
                    {riskSummary.overall_risk_level}
                  </p>
                  <p className='text-lg text-white/90 font-medium'>
                    Based on correlation & concentration analysis
                  </p>
                </div>
                <button
                  onClick={handleReviewRecommendations}
                  className='bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-4 px-8 rounded-xl border border-white/30 transition-all duration-200 hover:shadow-lg'
                >
                  Review Recommendations →
                </button>
              </div>
            </div>

            {/* Secondary Metrics Cards - Take 3 columns each */}
            <div className='lg:col-span-3'>
              <div className='relative overflow-hidden rounded-xl border-2 p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-sm hover:shadow-md transition-shadow h-full'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='p-2 rounded-lg bg-white/80 dark:bg-black/20 shadow-sm'>
                    <PieChart className='h-5 w-5 text-blue-600' />
                  </div>
                  <div className='text-right'>
                    <p className='text-xs font-medium text-muted-foreground'>
                      Portfolio Balance
                    </p>
                  </div>
                </div>
                <div>
                  <p className='text-2xl font-bold text-blue-600 mb-2'>
                    {riskSummary.diversification_score.score}/100
                  </p>
                  <p className='text-sm text-muted-foreground line-clamp-2'>
                    {riskSummary.diversification_score.explanation ||
                      'Diversification analysis completed'}
                  </p>
                </div>
              </div>
            </div>

            <div className='lg:col-span-3'>
              <div className='relative overflow-hidden rounded-xl border-2 border-primary/30 p-6 bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm hover:shadow-md transition-shadow h-full'>
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
        </div>

        {/* Correlation Analysis Section - Enhanced with Action Items */}
        {correlationAnalysis?.success ? (
          <div>
            <h4 className='text-lg font-semibold mb-6 flex items-center gap-2'>
              <TrendingUp className='h-5 w-5 text-primary' />
              Correlation Analysis
              <div className='relative group'>
                <Info className='h-4 w-4 text-muted-foreground cursor-help' />
                <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-background border border-border rounded-lg shadow-lg text-xs text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50'>
                  Measures how closely assets move together
                  <div className='absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border'></div>
                </div>
              </div>
            </h4>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              {/* Highest Correlation Card - Enhanced */}
              <div
                className={`relative overflow-hidden rounded-xl border-2 p-6 shadow-sm hover:shadow-md transition-shadow ${
                  correlationAnalysis?.most_correlated_pair?.risk_level ===
                    'Very High' ||
                  correlationAnalysis?.most_correlated_pair?.risk_level ===
                    'High'
                    ? 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800/30'
                    : 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800'
                }`}
                style={{
                  borderColor:
                    correlationAnalysis?.most_correlated_pair?.risk_color,
                }}
              >
                <div className='flex items-center justify-between mb-4'>
                  <div className='p-2 rounded-lg bg-white/80 dark:bg-black/20 shadow-sm'>
                    <TrendingUp
                      className='h-5 w-5'
                      style={{
                        color:
                          correlationAnalysis?.most_correlated_pair?.risk_color,
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
                    {correlationAnalysis?.most_correlated_pair?.asset1} &{' '}
                    {correlationAnalysis?.most_correlated_pair?.asset2}
                  </p>
                  <p
                    className='text-2xl font-bold mb-2'
                    style={{
                      color:
                        correlationAnalysis?.most_correlated_pair?.risk_color,
                    }}
                  >
                    {(
                      (correlationAnalysis?.most_correlated_pair?.correlation ||
                        0) * 100
                    ).toFixed(1)}
                    % (
                    {correlationAnalysis?.most_correlated_pair
                      ?.correlation_level || 'Unknown'}
                    )
                  </p>
                  <p className='text-xs text-muted-foreground mb-3 leading-relaxed'>
                    These assets tend to move together, which can limit
                    diversification benefits during market shifts.
                  </p>
                  {(correlationAnalysis?.most_correlated_pair
                    ?.correlation_level === 'Very High' ||
                    correlationAnalysis?.most_correlated_pair
                      ?.correlation_level === 'High') && (
                    <button
                      onClick={() => handleLearnMore('high-correlation', null)}
                      className='w-full bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-sm font-medium py-2 px-3 rounded-lg border border-red-200 dark:border-red-800/50 transition-colors'
                    >
                      Explore Alternatives
                    </button>
                  )}
                </div>
              </div>

              {/* Concentration Risk Card - Enhanced */}
              <div
                className={`relative overflow-hidden rounded-xl border-2 p-6 shadow-sm hover:shadow-md transition-shadow ${
                  correlationAnalysis?.concentration_metrics
                    ?.concentration_level === 'Very High' ||
                  correlationAnalysis?.concentration_metrics
                    ?.concentration_level === 'High'
                    ? 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800/30'
                    : 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800'
                }`}
                style={{
                  borderColor:
                    correlationAnalysis?.concentration_metrics?.risk_color,
                }}
              >
                <div className='flex items-center justify-between mb-4'>
                  <div className='p-2 rounded-lg bg-white/80 dark:bg-black/20 shadow-sm'>
                    <Target
                      className='h-5 w-5'
                      style={{
                        color:
                          correlationAnalysis?.concentration_metrics
                            ?.risk_color,
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
                  <div className='flex items-center gap-2 mb-1'>
                    <p className='text-lg font-semibold text-foreground'>
                      HHI: {correlationAnalysis?.concentration_metrics?.hhi}
                    </p>
                    <div className='relative group'>
                      <Info className='h-3 w-3 text-muted-foreground cursor-help' />
                      <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-background border border-border rounded shadow-lg text-xs text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50'>
                        Herfindahl-Hirschman Index measures portfolio
                        concentration
                        <div className='absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-border'></div>
                      </div>
                    </div>
                  </div>
                  <p
                    className='text-2xl font-bold mb-2'
                    style={{
                      color:
                        correlationAnalysis?.concentration_metrics?.risk_color,
                    }}
                  >
                    {correlationAnalysis?.concentration_metrics
                      ?.concentration_level || 'Unknown'}
                  </p>
                  <p className='text-xs text-muted-foreground mb-3 leading-relaxed'>
                    Your largest holding,{' '}
                    {
                      correlationAnalysis?.concentration_metrics
                        ?.largest_holding?.ticker
                    }{' '}
                    (
                    {
                      correlationAnalysis?.concentration_metrics
                        ?.largest_holding?.percentage
                    }
                    %), significantly contributes to this risk.
                  </p>
                  {(correlationAnalysis?.concentration_metrics
                    ?.concentration_level === 'Very High' ||
                    correlationAnalysis?.concentration_metrics
                      ?.concentration_level === 'High') && (
                    <button
                      onClick={() =>
                        handleLearnMore('portfolio-concentration', null)
                      }
                      className='w-full bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 text-sm font-medium py-2 px-3 rounded-lg border border-orange-200 dark:border-orange-800/50 transition-colors'
                    >
                      Diversify Holdings
                    </button>
                  )}
                </div>
              </div>

              {/* Portfolio Correlation Card - Neutral */}
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
                    {(
                      (correlationAnalysis?.average_correlation || 0) * 100
                    ).toFixed(1)}
                    %
                  </p>
                  <p className='text-sm text-muted-foreground mb-3 leading-relaxed'>
                    This represents the average correlation among all assets.
                    Lower values (ideally below 30%) generally indicate better
                    diversification.
                  </p>
                  <div className='relative group'>
                    <button className='w-full bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium py-2 px-3 rounded-lg border border-primary/20 transition-colors'>
                      Learn More About Diversification
                    </button>
                  </div>
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
            {correlationAnalysis?.single_asset_portfolio ? (
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
                  {correlationAnalysis?.error_message ||
                    'Unable to perform correlation analysis'}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Key Concerns Section - Enhanced with Dynamic Content */}
        {riskSummary?.key_concerns && riskSummary.key_concerns.length > 0 && (
          <div>
            <h4 className='text-lg font-semibold mb-6 flex items-center gap-2'>
              <AlertTriangle className='h-5 w-5 text-amber-600' />
              Key Concerns
            </h4>
            <div className='space-y-4'>
              {/* Mobile: Show first 2 concerns, collapsible for more */}
              <div className='block lg:hidden'>
                {generateDynamicConcerns()
                  .slice(0, expandedConcerns ? undefined : 2)
                  .map((concern: any, index: number) => {
                    const getSeverityColor = (severity: string) => {
                      switch (severity) {
                        case 'critical':
                          return 'from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-400 dark:border-red-800/50';
                        case 'high':
                          return 'from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-400 dark:border-orange-800/50';
                        case 'medium':
                          return 'from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-400 dark:border-amber-800/50';
                        default:
                          return 'from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-400 dark:border-amber-800/50';
                      }
                    };

                    const getSeverityIconColor = (severity: string) => {
                      switch (severity) {
                        case 'critical':
                          return 'text-red-600';
                        case 'high':
                          return 'text-orange-600';
                        case 'medium':
                          return 'text-amber-600';
                        default:
                          return 'text-amber-600';
                      }
                    };

                    return (
                      <div
                        key={index}
                        className={`flex items-start gap-4 p-4 bg-gradient-to-r ${getSeverityColor(
                          concern.severity
                        )} rounded-lg hover:shadow-md transition-shadow`}
                      >
                        <AlertTriangle
                          className={`h-5 w-5 mt-0.5 flex-shrink-0 ${getSeverityIconColor(
                            concern.severity
                          )}`}
                        />
                        <div className='flex-1'>
                          <h5 className='font-semibold text-foreground mb-1'>
                            {concern.title}
                          </h5>
                          <p className='text-sm text-muted-foreground leading-relaxed'>
                            {concern.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                {generateDynamicConcerns().length > 2 && (
                  <button
                    onClick={() => setExpandedConcerns(!expandedConcerns)}
                    className='w-full p-3 text-amber-700 dark:text-amber-300 font-medium hover:bg-amber-100 dark:hover:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800/50 transition-colors'
                  >
                    {expandedConcerns
                      ? `Show Less`
                      : `Show ${
                          generateDynamicConcerns().length - 2
                        } More Concerns`}
                  </button>
                )}
              </div>

              {/* Desktop: Show all concerns */}
              <div className='hidden lg:grid lg:gap-4'>
                {generateDynamicConcerns().map(
                  (concern: any, index: number) => {
                    const getSeverityColor = (severity: string) => {
                      switch (severity) {
                        case 'critical':
                          return 'from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-400 dark:border-red-800/50';
                        case 'high':
                          return 'from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-400 dark:border-orange-800/50';
                        case 'medium':
                          return 'from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-400 dark:border-amber-800/50';
                        default:
                          return 'from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-400 dark:border-amber-800/50';
                      }
                    };

                    const getSeverityIconColor = (severity: string) => {
                      switch (severity) {
                        case 'critical':
                          return 'text-red-600';
                        case 'high':
                          return 'text-orange-600';
                        case 'medium':
                          return 'text-amber-600';
                        default:
                          return 'text-amber-600';
                      }
                    };

                    return (
                      <div
                        key={index}
                        className={`flex items-start gap-4 p-4 bg-gradient-to-r ${getSeverityColor(
                          concern.severity
                        )} rounded-lg hover:shadow-md transition-shadow`}
                      >
                        <AlertTriangle
                          className={`h-5 w-5 mt-0.5 flex-shrink-0 ${getSeverityIconColor(
                            concern.severity
                          )}`}
                        />
                        <div className='flex-1'>
                          <h5 className='font-semibold text-foreground mb-1'>
                            {concern.title}
                          </h5>
                          <p className='text-sm text-muted-foreground leading-relaxed'>
                            {concern.description}
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recommendations Section - Enhanced with Action Buttons */}
        {recommendations && recommendations.length > 0 && (
          <div id='recommendations-section'>
            <h4 className='text-lg font-semibold mb-6 flex items-center gap-2'>
              <Lightbulb className='h-5 w-5 text-primary' />
              Recommendations
            </h4>

            {/* Enhanced Recommendations that directly address key concerns */}
            <div className='grid gap-6'>
              {/* Dynamic High Correlation Recommendation */}
              {(() => {
                // Check if we have correlation analysis and high correlation
                if (
                  !correlationAnalysis?.success ||
                  !correlationAnalysis?.most_correlated_pair ||
                  correlationAnalysis?.most_correlated_pair
                    ?.correlation_level !== 'Very High'
                ) {
                  return null;
                }

                const { asset1, asset2, correlation } =
                  correlationAnalysis.most_correlated_pair;

                // Check if both assets still exist in the current portfolio
                const currentTickers =
                  portfolioAssets?.map(asset => asset.Ticker) || [];
                const bothAssetsExist =
                  currentTickers.includes(asset1) &&
                  currentTickers.includes(asset2);

                if (!bothAssetsExist) {
                  return null; // Don't show recommendation if assets don't exist
                }

                // Get asset categories for generic recommendations
                const getAssetCategory = (ticker: string) => {
                  const asset = portfolioAssets?.find(a => a.Ticker === ticker);
                  if (!asset) return 'asset';

                  // You can enhance this with more sophisticated category detection
                  const tickerUpper = ticker.toUpperCase();
                  if (
                    tickerUpper.includes('BND') ||
                    tickerUpper.includes('TLT') ||
                    tickerUpper.includes('AGG')
                  )
                    return 'bond';
                  if (
                    tickerUpper.includes('VTI') ||
                    tickerUpper.includes('SPY') ||
                    tickerUpper.includes('VOO')
                  )
                    return 'US equity';
                  if (
                    tickerUpper.includes('VXUS') ||
                    tickerUpper.includes('EFA') ||
                    tickerUpper.includes('IEFA')
                  )
                    return 'international equity';
                  if (
                    tickerUpper.includes('VNQ') ||
                    tickerUpper.includes('IYR')
                  )
                    return 'real estate';
                  if (
                    tickerUpper.includes('GLD') ||
                    tickerUpper.includes('SLV')
                  )
                    return 'commodity';
                  return 'asset';
                };

                const asset1Category = getAssetCategory(asset1);
                const asset2Category = getAssetCategory(asset2);
                const correlationPercent = (correlation * 100).toFixed(1);

                return (
                  <div className='relative overflow-hidden rounded-xl border-2 p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 shadow-sm hover:shadow-md transition-shadow border-red-200 dark:border-red-800/30'>
                    <div className='flex justify-between items-start mb-4'>
                      <div className='flex items-center gap-3'>
                        <div className='p-2 rounded-lg bg-white/80 dark:bg-black/20 shadow-sm'>
                          <TrendingUp className='h-5 w-5 text-red-600' />
                        </div>
                        <h5 className='font-semibold text-foreground text-lg'>
                          Reduce High Correlation Between {asset1} & {asset2}
                        </h5>
                      </div>
                      <Badge className='text-xs font-semibold px-3 py-1 bg-red-600 text-white'>
                        HIGH PRIORITY
                      </Badge>
                    </div>
                    <p className='text-muted-foreground mb-4 leading-relaxed'>
                      Your {asset1} and {asset2} holdings have a{' '}
                      {correlationPercent}% correlation, which significantly
                      reduces diversification benefits. Consider replacing one{' '}
                      {asset1Category} with a different asset class.
                    </p>
                    <div className='mb-4 p-3 bg-white/50 dark:bg-black/20 rounded-lg'>
                      <p className='text-sm font-medium text-foreground mb-2'>
                        Target Goal:
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        Reduce correlation to below 70% by diversifying into
                        different asset classes like international equities,
                        real estate, or commodities
                      </p>
                    </div>
                    <div className='flex flex-col sm:flex-row gap-3'>
                      <button className='flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-sm hover:shadow-md'>
                        Explore Diversification Options
                      </button>
                      <button
                        onClick={() =>
                          handleLearnMore('high-correlation', null)
                        }
                        className='px-6 py-3 bg-muted hover:bg-muted/80 text-muted-foreground font-medium rounded-lg border border-border transition-colors'
                      >
                        Learn More
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Dynamic Concentration Recommendation */}
              {(() => {
                // Analyze portfolio for concentration issues
                const assets = portfolioAssets || [];
                const sortedAssets = [...assets].sort(
                  (a, b) => b.Weight - a.Weight
                );
                const largestHolding = sortedAssets[0];
                const top3Holdings = sortedAssets.slice(0, 3);
                const top3TotalWeight = top3Holdings.reduce(
                  (sum, asset) => sum + asset.Weight,
                  0
                );

                // Determine if we need to show concentration warning
                const hasHighConcentration =
                  largestHolding && largestHolding.Weight > 0.25; // >25%
                const hasTop3Concentration = top3TotalWeight > 0.7; // >70%

                if (!hasHighConcentration && !hasTop3Concentration) return null;

                // Determine the specific concentration issue
                const isSingleAssetConcentration = hasHighConcentration;
                const concentrationType = isSingleAssetConcentration
                  ? 'single-asset'
                  : 'top3';

                const getConcentrationContent = () => {
                  // Helper function to normalize weights to percentages
                  const normalizeWeight = (weight: number) => {
                    // If weight is already a percentage (>= 1), return as is
                    // If weight is a decimal (< 1), multiply by 100
                    return weight >= 1 ? weight : weight * 100;
                  };

                  if (isSingleAssetConcentration) {
                    const currentPercent = Math.round(
                      normalizeWeight(largestHolding.Weight)
                    );
                    const targetPercent = Math.min(
                      15,
                      Math.round(currentPercent * 0.4)
                    ); // Reduce to 40% of current or 15% max

                    return {
                      title: `Reduce ${largestHolding.Ticker} Concentration (${currentPercent}% → ${targetPercent}%)`,
                      description: `${largestHolding.Ticker} represents ${currentPercent}% of your portfolio, creating concentration risk. This single holding dominates your portfolio performance.`,
                      actionPlan: `Consider reducing ${largestHolding.Ticker} to ${targetPercent}% and reallocating to diversified assets`,
                      priority: currentPercent > 40 ? 'CRITICAL' : 'HIGH',
                      color: currentPercent > 40 ? 'orange' : 'yellow',
                      topic: 'single-asset-concentration',
                    };
                  } else {
                    const currentPercent = Math.round(
                      normalizeWeight(top3TotalWeight)
                    );
                    const targetPercent = Math.round(currentPercent * 0.75); // Reduce by 25%

                    return {
                      title: `Diversify Top 3 Holdings (${currentPercent}% → ${targetPercent}%)`,
                      description: `Your top 3 holdings (${top3Holdings
                        .map(a => a.Ticker)
                        .join(
                          ', '
                        )}) represent ${currentPercent}% of the portfolio, creating concentration risk.`,
                      actionPlan: `Add 5-7 new positions to reduce top 3 concentration to ${targetPercent}%`,
                      priority: 'HIGH',
                      color: 'yellow',
                      topic: 'top3-concentration',
                    };
                  }
                };

                const content = getConcentrationContent();
                const colorClasses = {
                  orange:
                    'from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800/30',
                  yellow:
                    'from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800/30',
                };
                const badgeColors = {
                  orange: 'bg-orange-600',
                  yellow: 'bg-yellow-600',
                };
                const buttonColors = {
                  orange: 'bg-orange-600 hover:bg-orange-700',
                  yellow: 'bg-yellow-600 hover:bg-yellow-700',
                };

                return (
                  <div
                    className={`relative overflow-hidden rounded-xl border-2 p-6 bg-gradient-to-br ${
                      colorClasses[content.color]
                    } shadow-sm hover:shadow-md transition-shadow`}
                  >
                    <div className='flex justify-between items-start mb-4'>
                      <div className='flex items-center gap-3'>
                        <div className='p-2 rounded-lg bg-white/80 dark:bg-black/20 shadow-sm'>
                          <AlertTriangle
                            className={`h-5 w-5 text-${content.color}-600`}
                          />
                        </div>
                        <h5 className='font-semibold text-foreground text-lg'>
                          {content.title}
                        </h5>
                      </div>
                      <Badge
                        className={`text-xs font-semibold px-3 py-1 ${
                          badgeColors[content.color]
                        } text-white`}
                      >
                        {content.priority}
                      </Badge>
                    </div>
                    <p className='text-muted-foreground mb-4 leading-relaxed'>
                      {content.description}
                    </p>
                    <div className='mb-4 p-3 bg-white/50 dark:bg-black/20 rounded-lg'>
                      <p className='text-sm font-medium text-foreground mb-2'>
                        Action Plan:
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        {content.actionPlan}
                      </p>
                    </div>
                    <div className='flex flex-col sm:flex-row gap-3'>
                      <button
                        className={`flex-1 ${
                          buttonColors[content.color]
                        } text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-sm hover:shadow-md`}
                      >
                        {isSingleAssetConcentration
                          ? 'Create Reduction Plan'
                          : 'Explore New Assets'}
                      </button>
                      <button
                        onClick={() => handleLearnMore(content.topic, null)}
                        className='px-6 py-3 bg-muted hover:bg-muted/80 text-muted-foreground font-medium rounded-lg border border-border transition-colors'
                      >
                        Learn More
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Original Recommendations */}
              {recommendations.map((rec: any, index: number) => {
                // Determine the topic based on recommendation content
                const getRecommendationTopic = (
                  title: string,
                  description: string
                ) => {
                  const lowerTitle = title.toLowerCase();
                  const lowerDesc = description.toLowerCase();

                  if (
                    lowerTitle.includes('correlation') ||
                    lowerDesc.includes('correlation') ||
                    lowerDesc.includes('bnd') ||
                    lowerDesc.includes('tlt')
                  ) {
                    return 'high-correlation';
                  }
                  if (
                    lowerTitle.includes('concentration') ||
                    lowerDesc.includes('concentration') ||
                    lowerDesc.includes('hhi')
                  ) {
                    // Check if it's about top 3 holdings specifically
                    if (
                      lowerTitle.includes('top 3') ||
                      lowerDesc.includes('top 3') ||
                      lowerDesc.includes('top3')
                    ) {
                      return 'top3-concentration';
                    }
                    // Check if it's about a single asset
                    if (
                      lowerTitle.includes('reduce') &&
                      (lowerTitle.includes('%') || lowerDesc.includes('%'))
                    ) {
                      return 'single-asset-concentration';
                    }
                    return 'portfolio-concentration';
                  }
                  if (
                    lowerTitle.includes('diversification') ||
                    lowerDesc.includes('diversification')
                  ) {
                    return 'diversification';
                  }
                  return 'diversification'; // default
                };

                const topic = getRecommendationTopic(
                  rec.title,
                  rec.description
                );

                return (
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
                    <p className='text-muted-foreground mb-6 leading-relaxed'>
                      {rec.description}
                    </p>
                    <div className='flex flex-col sm:flex-row gap-3'>
                      <button
                        className='flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-colors shadow-sm hover:shadow-md'
                        style={{
                          backgroundColor: getPriorityColor(rec.priority),
                        }}
                      >
                        {rec.action}
                      </button>
                      <button
                        onClick={() => handleLearnMore(topic, rec)}
                        className='px-6 py-3 bg-muted hover:bg-muted/80 text-muted-foreground font-medium rounded-lg border border-border transition-colors'
                      >
                        Learn More
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Learn More Dialog */}
        <Dialog
          open={learnMoreDialog.isOpen}
          onOpenChange={open =>
            setLearnMoreDialog(prev => ({ ...prev, isOpen: open }))
          }
        >
          <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle className='text-2xl font-bold text-foreground'>
                {learnMoreDialog.isOpen &&
                  getLearnMoreContent(
                    learnMoreDialog.topic,
                    learnMoreDialog.recommendation
                  ).title}
              </DialogTitle>
            </DialogHeader>

            {learnMoreDialog.isOpen && (
              <div className='space-y-6'>
                {/* Summary */}
                <div className='p-4 bg-primary/5 rounded-lg border border-primary/20'>
                  <p className='text-lg text-foreground font-medium'>
                    {
                      getLearnMoreContent(
                        learnMoreDialog.topic,
                        learnMoreDialog.recommendation
                      ).summary
                    }
                  </p>
                </div>

                {/* Mobile Accordion Layout */}
                <div className='block lg:hidden'>
                  <Accordion type='single' collapsible className='w-full'>
                    {getLearnMoreContent(
                      learnMoreDialog.topic,
                      learnMoreDialog.recommendation
                    ).sections.map((section, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className='text-left font-semibold text-foreground hover:text-primary transition-colors'>
                          {section.title}
                        </AccordionTrigger>
                        <AccordionContent className='text-muted-foreground leading-relaxed'>
                          {section.content}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>

                {/* Desktop Side-by-Side Layout */}
                <div className='hidden lg:grid lg:grid-cols-2 lg:gap-8'>
                  <div className='space-y-6'>
                    {getLearnMoreContent(
                      learnMoreDialog.topic,
                      learnMoreDialog.recommendation
                    )
                      .sections.slice(0, 2)
                      .map((section, index) => (
                        <div key={index} className='space-y-3'>
                          <h3 className='text-lg font-semibold text-foreground'>
                            {section.title}
                          </h3>
                          <p className='text-muted-foreground leading-relaxed'>
                            {section.content}
                          </p>
                        </div>
                      ))}
                  </div>
                  <div className='space-y-6'>
                    {getLearnMoreContent(
                      learnMoreDialog.topic,
                      learnMoreDialog.recommendation
                    )
                      .sections.slice(2)
                      .map((section, index) => (
                        <div key={index} className='space-y-3'>
                          <h3 className='text-lg font-semibold text-foreground'>
                            {section.title}
                          </h3>
                          <p className='text-muted-foreground leading-relaxed'>
                            {section.content}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='border-t border-border pt-6'>
                  <h3 className='text-lg font-semibold text-foreground mb-4'>
                    Take Action
                  </h3>
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
                    {getLearnMoreContent(
                      learnMoreDialog.topic,
                      learnMoreDialog.recommendation
                    ).actions.map((action, index) => (
                      <Button
                        key={index}
                        variant='outline'
                        className='w-full justify-start text-left h-auto py-3 px-4'
                        onClick={() => {
                          // Handle different actions
                          console.log(`Action: ${action.action}`);
                          // TODO: Implement specific action handlers
                        }}
                      >
                        <div className='flex flex-col items-start'>
                          <span className='font-medium text-foreground'>
                            {action.label}
                          </span>
                          <span className='text-xs text-muted-foreground'>
                            Click to get started
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
