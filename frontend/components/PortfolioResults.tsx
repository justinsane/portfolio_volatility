'use client';
import { TrendingUp } from 'lucide-react';
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
