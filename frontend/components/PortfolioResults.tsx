'use client';
import {
  TrendingUp,
  Shield,
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
import SimplifiedResultsLayout from './SimplifiedResultsLayout';
import CrashTestPanel from './CrashTestPanel';
import PortfolioComposition from './PortfolioComposition';
import VolatilityAnalysisDisplay from './VolatilityAnalysisDisplay';
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
      {/* Simplified Results Layout - New 3-step flow */}
      <SimplifiedResultsLayout result={result} />

      {/* Portfolio Composition - Keep this as it's valuable */}
      <PortfolioComposition result={result} />

      {/* Advanced Analysis - Gated behind advisor connection */}
      {result.risk_analysis && result.risk_analysis.success && (
        <GateWrapper
          gateId='risk-analysis'
          title='Get Your Complete Portfolio Analysis'
          description="Connect with a financial advisor to unlock detailed insights into your portfolio's risk factors, correlations, and concentration metrics."
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
                  Volatility Assessment Preview
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
          <VolatilityAnalysisDisplay
            riskAnalysis={result.risk_analysis}
            portfolioAssets={result.portfolio_assets}
          />
        </GateWrapper>
      )}

      {/* Advanced Tools - Gated behind advisor connection */}
      <GateWrapper
        gateId='advanced-tools'
        title='Access Advanced Portfolio Tools'
        description='Connect with a financial advisor to explore sophisticated portfolio analysis tools and what-if scenarios.'
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
    </div>
  );
}
