'use client';
import { Badge } from './ui/badge';
import { Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';

interface RecommendationsSectionProps {
  recommendations: any[];
  portfolioAssets: any[];
  correlationAnalysis: any;
  onLearnMore: (topic: string, recommendation: any) => void;
}

export default function RecommendationsSection({
  recommendations,
  portfolioAssets,
  correlationAnalysis,
  onLearnMore,
}: RecommendationsSectionProps) {
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

  const getRecommendationTopic = (title: string, description: string) => {
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

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
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
            correlationAnalysis?.most_correlated_pair?.correlation_level !==
              'Very High'
          ) {
            return null;
          }

          const { asset1, asset2, correlation } =
            correlationAnalysis.most_correlated_pair;

          // Check if both assets still exist in the current portfolio
          const currentTickers =
            portfolioAssets?.map(asset => asset.Ticker) || [];
          const bothAssetsExist =
            currentTickers.includes(asset1) && currentTickers.includes(asset2);

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
            if (tickerUpper.includes('VNQ') || tickerUpper.includes('IYR'))
              return 'real estate';
            if (tickerUpper.includes('GLD') || tickerUpper.includes('SLV'))
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
                Your {asset1} and {asset2} holdings have a {correlationPercent}%
                correlation, which significantly reduces diversification
                benefits. Consider replacing one {asset1Category} with a
                different asset class.
              </p>
              <div className='mb-4 p-3 bg-white/50 dark:bg-black/20 rounded-lg'>
                <p className='text-sm font-medium text-foreground mb-2'>
                  Target Goal:
                </p>
                <p className='text-sm text-muted-foreground'>
                  Reduce correlation to below 70% by diversifying into different
                  asset classes like international equities, real estate, or
                  commodities
                </p>
              </div>
              <div className='flex flex-col sm:flex-row gap-3'>
                <button className='flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-sm hover:shadow-md'>
                  Explore Diversification Options
                </button>
                <button
                  onClick={() => onLearnMore('high-correlation', null)}
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
          const sortedAssets = [...assets].sort((a, b) => b.Weight - a.Weight);
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
          const colorClasses: Record<string, string> = {
            orange:
              'from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800/30',
            yellow:
              'from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800/30',
          };
          const badgeColors: Record<string, string> = {
            orange: 'bg-orange-600',
            yellow: 'bg-yellow-600',
          };
          const buttonColors: Record<string, string> = {
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
                  onClick={() => onLearnMore(content.topic, null)}
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
          const topic = getRecommendationTopic(rec.title, rec.description);

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
                  onClick={() => onLearnMore(topic, rec)}
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
  );
}
