'use client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { PieChart, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { type PredictionResult } from '@/lib/api';
import { getETFInfo } from '@/lib/etf-mapping';
import { getDisplayName, getCategory } from '@/lib/tickerDirectory';
import { useState } from 'react';

interface PortfolioCompositionProps {
  result: PredictionResult;
}

export default function PortfolioComposition({
  result,
}: PortfolioCompositionProps) {
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
