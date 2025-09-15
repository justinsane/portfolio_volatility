'use client';
import {
  TrendingUp,
  Shield,
  TrendingUp as TrendingUpIcon,
  BarChart3,
  Activity,
  Target,
  Globe,
  Users,
} from 'lucide-react';
import { type PredictionResult, submitEmailSignup } from '@/lib/api';
import { useEffect } from 'react';
import {
  ensureTickersResolved,
  warmFromEnhancementDetails,
} from '@/lib/tickerResolver';
import EmailSignup from './ui/EmailSignup';
import CrashTestPanel from './CrashTestPanel';
import SummaryMetrics from './SummaryMetrics';
import PortfolioComposition from './PortfolioComposition';
import RiskAnalysisDisplay from './RiskAnalysisDisplay';
import GateWrapper from './GateWrapper';
import { getGateConfig } from '@/lib/gateConfig';

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

          <GateWrapper
            gateId='ai-model-details'
            title='Understand AI Model Confidence'
            description="Learn how our advanced AI evaluates your portfolio's data quality, coverage, and reliability."
            benefits={[
              'Data Quality breakdown (100% score explanation)',
              'Coverage metrics detailed analysis',
              'Reliability scores methodology',
              'Model confidence indicators',
              'AI prediction accuracy insights',
            ]}
            icon={<BarChart3 className='h-6 w-6' />}
            triggerType='engagement'
            engagementThreshold={90} // 1.5 minutes + 30% scroll
            previewContent={
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                {/* Show basic metrics without enhancement data */}
                <div
                  className={`group relative overflow-hidden rounded-xl border-2 p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform ${
                    result.risk_level === 'HIGH'
                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                      : 'bg-green-50 text-green-700 border-green-200'
                  } shadow-lg`}
                >
                  <div className='flex items-center justify-between mb-4'>
                    <div className='p-2.5 rounded-lg bg-white/60 dark:bg-black/30 shadow-sm'>
                      <Shield className='h-6 w-6' />
                    </div>
                    <div className='text-right'>
                      <p className='text-xs font-semibold opacity-80'>
                        Risk Assessment
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className='text-3xl font-black mb-2 leading-none'>
                      {result.risk_level}
                    </p>
                    <p className='text-sm font-medium opacity-80'>
                      Portfolio Risk Level
                    </p>
                  </div>
                </div>

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
                    </div>
                    <p className='text-sm font-medium opacity-80'>
                      Expected Volatility
                    </p>
                  </div>
                </div>

                <div className='group relative overflow-hidden rounded-xl border-2 border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800/30 p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform shadow-lg'>
                  <div className='flex items-center justify-between mb-4'>
                    <div className='p-2.5 rounded-lg bg-white/60 dark:bg-black/30 shadow-sm'>
                      <Target className='h-6 w-6' />
                    </div>
                    <div className='text-right'>
                      <p className='text-xs font-semibold opacity-80'>
                        Time Horizon
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className='text-3xl font-black mb-2 leading-none'>
                      {result.forecast_days}
                    </p>
                    <p className='text-sm font-medium opacity-80'>
                      Days Forecast
                    </p>
                  </div>
                </div>

                <div className='group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-700 dark:bg-gray-950/20 dark:text-gray-400 dark:border-gray-800/30 p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform shadow-lg'>
                  <div className='flex items-center justify-between mb-4'>
                    <div className='p-2.5 rounded-lg bg-white/60 dark:bg-black/30 shadow-sm'>
                      <BarChart3 className='h-6 w-6' />
                    </div>
                    <div className='text-right'>
                      <p className='text-xs font-semibold opacity-80'>
                        AI Model
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className='text-xl font-bold mb-2 leading-tight'>
                      Enhanced Multi-Source
                    </p>
                    <p className='text-sm font-medium opacity-80'>
                      Prediction Method
                    </p>
                  </div>
                </div>

                {/* Gated enhancement data preview */}
                {result.enhancement_data && (
                  <div className='group relative overflow-hidden rounded-xl border-2 border-green-200 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/30 p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform shadow-lg'>
                    <div className='flex items-center justify-between mb-4'>
                      <div className='p-2.5 rounded-lg bg-white/60 dark:bg-black/30 shadow-sm'>
                        <Globe className='h-6 w-6' />
                      </div>
                      <div className='text-right'>
                        <p className='text-xs font-semibold opacity-80'>
                          Data Quality
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className='text-3xl font-black mb-2 leading-none'>
                        {(
                          result.enhancement_data.coverage_analysis
                            .coverage_by_count * 100
                        ).toFixed(0)}
                        %
                      </p>
                      <p className='text-sm font-medium opacity-80'>
                        Asset Coverage
                      </p>
                    </div>
                  </div>
                )}
              </div>
            }
          >
            <SummaryMetrics result={result} />
          </GateWrapper>
        </div>
      </div>

      <PortfolioComposition result={result} />

      {/* Risk Analysis - Gated */}
      {result.risk_analysis && result.risk_analysis.success && (
        <GateWrapper
          gateId='risk-analysis'
          title='Unlock Detailed Risk Analysis'
          description="Get comprehensive insights into your portfolio's risk factors, correlations, and concentration metrics."
          benefits={[
            'Detailed risk score breakdown',
            'Correlation analysis heatmap',
            'Concentration risk explanation',
            'Risk factor explanations and mitigation strategies',
            'Personalized risk assessment recommendations',
          ]}
          icon={<Shield className='h-6 w-6' />}
          triggerType='engagement'
          engagementThreshold={120} // 2 minutes + 30% scroll
          previewContent={
            <div className='border-2 border-orange-200 bg-orange-50 rounded-xl p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='p-2 rounded-lg bg-orange-100 border border-orange-200'>
                  <Shield className='h-5 w-5 text-orange-600' />
                </div>
                <h3 className='text-lg font-semibold text-orange-800'>
                  Risk Analysis Preview
                </h3>
              </div>
              <div className='space-y-3'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium text-orange-700'>
                    Overall Risk Score
                  </span>
                  <span className='px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold'>
                    {result.risk_analysis?.risk_metrics?.risk_summary
                      ?.risk_score || '84.6'}
                    /100
                  </span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium text-orange-700'>
                    Risk Level
                  </span>
                  <span className='px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold'>
                    {result.risk_analysis?.risk_metrics?.risk_summary
                      ?.overall_risk_level || 'HIGH'}
                  </span>
                </div>
                <div className='text-xs text-orange-600 mt-3'>
                  Detailed breakdown, correlation analysis, and concentration
                  metrics available with advisor consultation.
                </div>
              </div>
            </div>
          }
        >
          <RiskAnalysisDisplay
            riskAnalysis={result.risk_analysis}
            portfolioAssets={result.portfolio_assets}
          />
        </GateWrapper>
      )}

      {/* Crash Test Analysis - Gated */}
      <GateWrapper
        gateId='advanced-tools'
        title='Access Advanced Portfolio Tools'
        description='Explore sophisticated portfolio analysis tools and what-if scenarios.'
        benefits={[
          'What-If Scenarios functionality',
          'Advanced portfolio optimization',
          'Market stress testing',
          'Rebalancing recommendations',
          'Tax optimization strategies',
        ]}
        icon={<Users className='h-6 w-6' />}
        triggerType='click' // Change to click-based - only show when user wants advanced tools
        previewContent={
          <div className='border-2 border-purple-200 bg-purple-50 rounded-xl p-6'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='p-2 rounded-lg bg-purple-100 border border-purple-200'>
                <Users className='h-5 w-5 text-purple-600' />
              </div>
              <h3 className='text-lg font-semibold text-purple-800'>
                Advanced Tools Preview
              </h3>
            </div>
            <div className='space-y-3'>
              <div className='flex justify-between items-center'>
                <span className='text-sm font-medium text-purple-700'>
                  Crash Test Scenarios
                </span>
                <span className='px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold'>
                  Available
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm font-medium text-purple-700'>
                  What-If Analysis
                </span>
                <span className='px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold'>
                  Available
                </span>
              </div>
              <div className='text-xs text-purple-600 mt-3'>
                Advanced portfolio stress testing, scenario analysis, and
                optimization tools available with advisor consultation.
              </div>
            </div>
          </div>
        }
      >
        <CrashTestPanel portfolio={result.portfolio_assets} />
      </GateWrapper>

      <div className='rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 border border-border/50 p-8'>
        <EmailSignup onSubmit={submitEmailSignup} />
      </div>
    </div>
  );
}
