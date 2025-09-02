'use client';
import { Alert, AlertDescription } from './ui/alert';
import {
  TrendingUp,
  Target,
  Activity,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface CorrelationAnalysisSectionProps {
  correlationAnalysis: any;
  onLearnMore: (topic: string, recommendation: any) => void;
}

export default function CorrelationAnalysisSection({
  correlationAnalysis,
  onLearnMore,
}: CorrelationAnalysisSectionProps) {
  if (!correlationAnalysis?.success) {
    return (
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
    );
  }

  return (
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
            correlationAnalysis?.most_correlated_pair?.risk_level === 'High'
              ? 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800/30'
              : 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800'
          }`}
          style={{
            borderColor: correlationAnalysis?.most_correlated_pair?.risk_color,
          }}
        >
          <div className='flex items-center justify-between mb-4'>
            <div className='p-2 rounded-lg bg-white/80 dark:bg-black/20 shadow-sm'>
              <TrendingUp
                className='h-5 w-5'
                style={{
                  color: correlationAnalysis?.most_correlated_pair?.risk_color,
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
                color: correlationAnalysis?.most_correlated_pair?.risk_color,
              }}
            >
              {(
                (correlationAnalysis?.most_correlated_pair?.correlation || 0) *
                100
              ).toFixed(1)}
              % (
              {correlationAnalysis?.most_correlated_pair?.correlation_level ||
                'Unknown'}
              )
            </p>
            <p className='text-xs text-muted-foreground mb-3 leading-relaxed'>
              These assets tend to move together, which can limit
              diversification benefits during market shifts.
            </p>
            {(correlationAnalysis?.most_correlated_pair?.correlation_level ===
              'Very High' ||
              correlationAnalysis?.most_correlated_pair?.correlation_level ===
                'High') && (
              <button
                onClick={() => onLearnMore('high-correlation', null)}
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
            correlationAnalysis?.concentration_metrics?.concentration_level ===
              'Very High' ||
            correlationAnalysis?.concentration_metrics?.concentration_level ===
              'High'
              ? 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800/30'
              : 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800'
          }`}
          style={{
            borderColor: correlationAnalysis?.concentration_metrics?.risk_color,
          }}
        >
          <div className='flex items-center justify-between mb-4'>
            <div className='p-2 rounded-lg bg-white/80 dark:bg-black/20 shadow-sm'>
              <Target
                className='h-5 w-5'
                style={{
                  color: correlationAnalysis?.concentration_metrics?.risk_color,
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
                  Herfindahl-Hirschman Index measures portfolio concentration
                  <div className='absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-border'></div>
                </div>
              </div>
            </div>
            <p
              className='text-2xl font-bold mb-2'
              style={{
                color: correlationAnalysis?.concentration_metrics?.risk_color,
              }}
            >
              {correlationAnalysis?.concentration_metrics
                ?.concentration_level || 'Unknown'}
            </p>
            <p className='text-xs text-muted-foreground mb-3 leading-relaxed'>
              Your largest holding,{' '}
              {
                correlationAnalysis?.concentration_metrics?.largest_holding
                  ?.ticker
              }{' '}
              (
              {
                correlationAnalysis?.concentration_metrics?.largest_holding
                  ?.percentage
              }
              %), significantly contributes to this risk.
            </p>
            {(correlationAnalysis?.concentration_metrics
              ?.concentration_level === 'Very High' ||
              correlationAnalysis?.concentration_metrics
                ?.concentration_level === 'High') && (
              <button
                onClick={() => onLearnMore('portfolio-concentration', null)}
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
              {((correlationAnalysis?.average_correlation || 0) * 100).toFixed(
                1
              )}
              %
            </p>
            <p className='text-sm text-muted-foreground mb-3 leading-relaxed'>
              This represents the average correlation among all assets. Lower
              values (ideally below 30%) generally indicate better
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
  );
}
