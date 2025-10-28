'use client';
import { type PredictionResult } from '@/lib/api';
import OverallRiskHero from './OverallRiskHero';
import SimplifiedSummaryMetrics from './SimplifiedSummaryMetrics';
import EmailSignup from './ui/EmailSignup';
import { submitEmailSignup } from '@/lib/api';

interface SimplifiedResultsLayoutProps {
  result: PredictionResult;
}

export default function SimplifiedResultsLayout({
  result,
}: SimplifiedResultsLayoutProps) {
  // Extract data for the simplified layout
  const riskLevel = result.risk_level || 'Unknown';
  const volatility =
    result.final_volatility ||
    (result.annual_volatility
      ? parseFloat(result.annual_volatility.replace('%', '')) / 100
      : undefined);
  const riskScore =
    result.risk_analysis?.risk_metrics?.risk_summary?.risk_score;
  const diversificationScore =
    result.risk_analysis?.risk_metrics?.risk_summary?.diversification_score
      ?.score;

  // Generate explanation based on risk analysis
  const getRiskExplanation = () => {
    if (
      result.risk_analysis?.risk_metrics?.risk_summary?.key_concerns &&
      result.risk_analysis.risk_metrics.risk_summary.key_concerns.length > 0
    ) {
      const concerns =
        result.risk_analysis.risk_metrics.risk_summary.key_concerns;
      if (
        concerns.some((concern: string) =>
          concern.toLowerCase().includes('concentration')
        )
      ) {
        return 'Your portfolio has high risk due to concentration in a few assets.';
      } else if (
        concerns.some((concern: string) =>
          concern.toLowerCase().includes('correlation')
        )
      ) {
        return 'Your portfolio shows high risk due to correlated assets moving together.';
      } else if (
        concerns.some((concern: string) =>
          concern.toLowerCase().includes('volatility')
        )
      ) {
        return 'Your portfolio has high risk due to volatile asset holdings.';
      }
    }
    return undefined; // Will use default explanation from OverallRiskHero
  };

  return (
    <div className='space-y-8 sm:space-y-12 max-w-6xl mx-auto px-4 sm:px-6'>
      {/* Step 1: Hero Section - Overall Risk Assessment */}
      <section className='w-full'>
        <OverallRiskHero result={result} />
      </section>

      {/* Step 2: Supporting Metrics */}
      <section className='w-full'>
        <SimplifiedSummaryMetrics result={result} />
      </section>

      {/* Step 3: Call to Action - Advisor Connection */}
      <section className='w-full'>
        <div className='bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl border border-border/50 p-6 sm:p-8'>
          <div className='text-center mb-6 sm:mb-8'>
            <h2 className='text-2xl sm:text-3xl font-bold text-foreground mb-4'>
              Ready for Deeper Analysis?
            </h2>
            <p className='text-muted-foreground text-lg max-w-2xl mx-auto'>
              Scroll down to explore detailed risk analysis, portfolio
              composition, and advanced tools. Each section provides deeper
              insights into your portfolio.
            </p>
          </div>

          {/* Trust Indicators */}
          <div className='text-center'>
            <div className='flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground'>
              <div className='flex items-center gap-2'>
                <span className='w-2 h-2 bg-green-500 rounded-full'></span>
                <span>Certified Financial Advisors</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='w-2 h-2 bg-green-500 rounded-full'></span>
                <span>24-Hour Response Time</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='w-2 h-2 bg-green-500 rounded-full'></span>
                <span>Free Initial Consultation</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
