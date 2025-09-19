'use client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import {
  TrendingUp,
  Activity,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Target,
  PieChart,
  Info,
  Shield,
} from 'lucide-react';
import { useState } from 'react';
import LearnMoreDialog from './LearnMoreDialog';
import CorrelationAnalysisSection from './CorrelationAnalysisSection';
import KeyConcernsSection from './KeyConcernsSection';
import RecommendationsSection from './RecommendationsSection';
import GateWrapper from './GateWrapper';

interface VolatilityAnalysisDisplayProps {
  riskAnalysis: any;
  portfolioAssets: any[];
}

export default function VolatilityAnalysisDisplay({
  riskAnalysis,
  portfolioAssets,
}: VolatilityAnalysisDisplayProps) {
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
            <div className='p-2 rounded-lg bg-blue-10 border border-blue-20'>
              <Activity className='h-5 w-5 text-blue-600' />
            </div>
            Volatility Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>
              <strong>Volatility Assessment Unavailable</strong>
              <br />
              Volatility analysis data is not available for this portfolio.
              Please try again or contact support if the issue persists.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

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

  const metrics = riskAnalysis.risk_metrics;
  const correlationAnalysis = metrics?.correlation_analysis;
  const riskSummary = metrics?.risk_summary;
  const recommendations = metrics?.recommendations;

  return (
    <Card className='border-2 border-border/50 shadow-lg'>
      <CardHeader className='pb-6'>
        <CardTitle className='flex items-center gap-3 text-xl'>
          <div className='p-2 rounded-lg bg-blue-10 border border-blue-20'>
            <Activity className='h-5 w-5 text-blue-600' />
          </div>
          Volatility Assessment
          <Badge variant='secondary' className='ml-2 text-xs'>
            Supporting Metric
          </Badge>
        </CardTitle>
        <p className='text-sm text-muted-foreground mt-2'>
          Volatility contributes to your overall risk but isn't the full
          picture. This analysis provides additional context for your
          portfolio's price movements.
        </p>
      </CardHeader>
      <CardContent className='space-y-8'>
        {/* Risk Summary Section */}
        <div className='space-y-4'>
          <h4 className='text-lg font-semibold flex items-center gap-2'>
            <Shield className='h-5 w-5 text-primary' />
            Risk Assessment
          </h4>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20'>
              <div className='flex items-center justify-between mb-4'>
                <div className='p-2 rounded-lg bg-primary/10'>
                  <Shield className='h-5 w-5 text-primary' />
                </div>
                <div className='text-right'>
                  <p className='text-xs font-medium text-muted-foreground'>
                    Overall Risk
                  </p>
                </div>
              </div>
              <div>
                <p className='text-2xl font-bold text-primary mb-2'>
                  {riskSummary.overall_risk_level}
                </p>
                <p className='text-sm text-muted-foreground'>
                  Based on correlation & concentration analysis
                </p>
              </div>
            </div>
            <div className='bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800/30'>
              <div className='flex items-center justify-between mb-4'>
                <div className='p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30'>
                  <PieChart className='h-5 w-5 text-blue-600' />
                </div>
                <div className='text-right'>
                  <p className='text-xs font-medium text-muted-foreground'>
                    Diversification
                  </p>
                </div>
              </div>
              <div>
                <p className='text-2xl font-bold text-blue-600 mb-2'>
                  {riskSummary.diversification_score.score}/100
                </p>
                <p className='text-sm text-muted-foreground'>
                  Portfolio balance score
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Correlation Analysis Section */}
        <CorrelationAnalysisSection
          correlationAnalysis={correlationAnalysis}
          onLearnMore={handleLearnMore}
        />

        {/* Key Concerns Section */}
        <KeyConcernsSection
          riskSummary={riskSummary}
          portfolioAssets={portfolioAssets}
          correlationAnalysis={correlationAnalysis}
          expandedConcerns={expandedConcerns}
          onToggleExpandedConcerns={() =>
            setExpandedConcerns(!expandedConcerns)
          }
        />

        {/* Recommendations Section - Gated */}
        <GateWrapper
          gateId='recommendations'
          title='Get Personalized Investment Recommendations'
          description='Connect with a financial advisor to receive actionable investment recommendations tailored to your portfolio and financial goals.'
          benefits={[
            'Personalized investment recommendations',
            'Portfolio optimization strategies',
            'Risk mitigation plans',
            'Next steps and action items',
            'Ongoing portfolio monitoring advice',
          ]}
          icon={<TrendingUp className='h-6 w-6' />}
          triggerType='click'
          previewContent={
            <div className='border-2 border-blue-200 bg-blue-50 rounded-xl p-4 sm:p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='p-2 rounded-lg bg-blue-100 border border-blue-200'>
                  <TrendingUp className='h-5 w-5 text-blue-600' />
                </div>
                <h3 className='text-lg font-semibold text-blue-800'>
                  Investment Recommendations Preview
                </h3>
              </div>
              <div className='space-y-3'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium text-blue-700'>
                    Recommendations Available
                  </span>
                  <span className='px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold'>
                    {recommendations?.length || 5} items
                  </span>
                </div>
                <div className='text-xs text-blue-600 mt-3'>
                  Personalized investment recommendations, optimization
                  strategies, and risk mitigation plans available with advisor
                  consultation.
                </div>
              </div>
            </div>
          }
        >
          <RecommendationsSection
            recommendations={recommendations}
            portfolioAssets={portfolioAssets}
            correlationAnalysis={correlationAnalysis}
            onLearnMore={handleLearnMore}
          />
        </GateWrapper>

        {/* Learn More Dialog */}
        <LearnMoreDialog
          isOpen={learnMoreDialog.isOpen}
          topic={learnMoreDialog.topic}
          recommendation={learnMoreDialog.recommendation}
          onOpenChange={open =>
            setLearnMoreDialog(prev => ({ ...prev, isOpen: open }))
          }
        />
      </CardContent>
    </Card>
  );
}
