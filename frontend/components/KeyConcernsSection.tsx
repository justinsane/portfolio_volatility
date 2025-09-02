'use client';
import { AlertTriangle } from 'lucide-react';

interface KeyConcernsSectionProps {
  riskSummary: any;
  portfolioAssets: any[];
  correlationAnalysis: any;
  expandedConcerns: boolean;
  onToggleExpandedConcerns: () => void;
}

export default function KeyConcernsSection({
  riskSummary,
  portfolioAssets,
  correlationAnalysis,
  expandedConcerns,
  onToggleExpandedConcerns,
}: KeyConcernsSectionProps) {
  // Helper function to generate dynamic concerns based on portfolio data
  const generateDynamicConcerns = () => {
    const dynamicConcerns: Array<{
      type: string;
      title: string;
      description: string;
      severity: string;
      action: string;
    }> = [];

    // Safety check: if risk analysis data is missing, return empty array
    if (!riskSummary) {
      return dynamicConcerns;
    }

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

  if (!riskSummary?.key_concerns || riskSummary.key_concerns.length === 0) {
    return null;
  }

  return (
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
              onClick={onToggleExpandedConcerns}
              className='w-full p-3 text-amber-700 dark:text-amber-300 font-medium hover:bg-amber-100 dark:hover:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800/50 transition-colors'
            >
              {expandedConcerns
                ? `Show Less`
                : `Show ${generateDynamicConcerns().length - 2} More Concerns`}
            </button>
          )}
        </div>

        {/* Desktop: Show all concerns */}
        <div className='hidden lg:grid lg:gap-4'>
          {generateDynamicConcerns().map((concern: any, index: number) => {
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
        </div>
      </div>
    </div>
  );
}
