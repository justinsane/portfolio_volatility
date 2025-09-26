'use client';
import { Badge } from './ui/badge';
import { Activity, PieChart, HelpCircle } from 'lucide-react';
import { type PredictionResult } from '@/lib/api';
import { generateMetricExplanation } from '@/lib/riskCalculations';

interface SimplifiedSummaryMetricsProps {
  result: PredictionResult;
}

export default function SimplifiedSummaryMetrics({
  result,
}: SimplifiedSummaryMetricsProps) {
  // Extract volatility data
  const volatility =
    result.final_volatility ||
    (result.annual_volatility
      ? parseFloat(result.annual_volatility.replace('%', '')) / 100
      : undefined);

  // Calculate diversification score from risk analysis
  const diversificationScore =
    result.risk_analysis?.risk_metrics?.risk_summary?.diversification_score
      ?.score || 75;

  // Generate explanations for each metric
  const volatilityExplanation = generateMetricExplanation(
    'volatility',
    volatility,
    diversificationScore
  );
  const diversificationExplanation = generateMetricExplanation(
    'diversification',
    volatility,
    diversificationScore
  );

  return (
    <div className='space-y-6 px-4 sm:px-0'>
      <div className='text-center'>
        <h2 className='text-2xl sm:text-3xl font-bold text-foreground mb-2'>
          Your Portfolio Insights
        </h2>
        <p className='text-muted-foreground text-lg'>
          Two key metrics that explain your risk level
        </p>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto'>
        {/* Expected Volatility */}
        {volatility !== undefined && (
          <div className='group relative overflow-hidden rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/30 p-4 sm:p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform shadow-lg'>
            <div className='flex items-center justify-between mb-4'>
              <div className='p-3 rounded-lg bg-white/60 dark:bg-black/30 shadow-sm'>
                <Activity className='h-6 w-6' />
              </div>
              <div className='text-right'>
                <p className='text-sm font-semibold opacity-80'>Expected</p>
              </div>
            </div>
            <div className='mb-4'>
              <div className='flex items-baseline gap-3 mb-3'>
                <p className='text-3xl sm:text-4xl font-black leading-none'>
                  {(volatility * 100).toFixed(1)}%
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
              <p className='text-lg font-semibold opacity-90'>
                Expected Volatility
              </p>
              <p className='text-sm opacity-80 mt-1'>
                How much your portfolio could swing in a year
              </p>
            </div>

            {/* Why explanation */}
            <div className='bg-white/20 dark:bg-black/20 rounded-lg p-4 border border-white/30 dark:border-white/10'>
              <div className='flex items-start gap-2'>
                <HelpCircle className='h-4 w-4 mt-0.5 flex-shrink-0 opacity-70' />
                <div>
                  <p className='text-sm font-medium opacity-90 mb-1'>
                    Why this matters:
                  </p>
                  <p className='text-xs opacity-80 leading-relaxed'>
                    {volatilityExplanation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Diversification Score */}
        <div className='group relative overflow-hidden rounded-xl border-2 border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800/30 p-4 sm:p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform shadow-lg'>
          <div className='flex items-center justify-between mb-4'>
            <div className='p-3 rounded-lg bg-white/60 dark:bg-black/30 shadow-sm'>
              <PieChart className='h-6 w-6' />
            </div>
            <div className='text-right'>
              <p className='text-sm font-semibold opacity-80'>Score</p>
            </div>
          </div>
          <div className='mb-4'>
            <div className='flex items-baseline gap-3 mb-3'>
              <p className='text-3xl sm:text-4xl font-black leading-none'>
                {diversificationScore}/100
              </p>
              <Badge
                variant='outline'
                className={`text-xs font-medium ${
                  diversificationScore >= 80
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : diversificationScore >= 60
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    : 'bg-red-100 text-red-800 border-red-200'
                }`}
              >
                {diversificationScore >= 80
                  ? 'Excellent'
                  : diversificationScore >= 60
                  ? 'Good'
                  : 'Needs Work'}
              </Badge>
            </div>
            <p className='text-lg font-semibold opacity-90'>
              How spread out your investments are
            </p>
            <p className='text-sm opacity-80 mt-1'>
              Higher scores mean better risk distribution
            </p>
          </div>

          {/* Why explanation */}
          <div className='bg-white/20 dark:bg-black/20 rounded-lg p-4 border border-white/30 dark:border-white/10'>
            <div className='flex items-start gap-2'>
              <HelpCircle className='h-4 w-4 mt-0.5 flex-shrink-0 opacity-70' />
              <div>
                <p className='text-sm font-medium opacity-90 mb-1'>
                  Why this matters:
                </p>
                <p className='text-xs opacity-80 leading-relaxed'>
                  {diversificationExplanation}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
