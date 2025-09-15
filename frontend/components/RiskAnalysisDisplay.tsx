'use client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import {
  TrendingUp,
  Shield,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Target,
  Activity,
  PieChart,
  Info,
} from 'lucide-react';
import { useState } from 'react';
import LearnMoreDialog from './LearnMoreDialog';
import RiskSummarySection from './RiskSummarySection';
import CorrelationAnalysisSection from './CorrelationAnalysisSection';
import KeyConcernsSection from './KeyConcernsSection';
import RecommendationsSection from './RecommendationsSection';
import GateWrapper from './GateWrapper';

interface RiskAnalysisDisplayProps {
  riskAnalysis: any;
  portfolioAssets: any[];
}

export default function RiskAnalysisDisplay({
  riskAnalysis,
  portfolioAssets,
}: RiskAnalysisDisplayProps) {
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
            <div className='p-2 rounded-lg bg-primary/10 border border-primary/20'>
              <Shield className='h-5 w-5 text-primary' />
            </div>
            Risk Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>
              <strong>Risk Analysis Unavailable</strong>
              <br />
              Risk analysis data is not available for this portfolio. Please try
              again or contact support if the issue persists.
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
          <div className='p-2 rounded-lg bg-primary/10 border border-primary/20'>
            <Shield className='h-5 w-5 text-primary' />
          </div>
          Risk Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-8'>
        {/* Risk Summary Section */}
        <RiskSummarySection
          riskSummary={riskSummary}
          onReviewRecommendations={handleReviewRecommendations}
        />

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
          title='Get Personalized Recommendations'
          description='Receive actionable investment recommendations tailored to your portfolio and financial goals.'
          benefits={[
            'Personalized investment recommendations',
            'Portfolio optimization suggestions',
            'Risk mitigation strategies',
            'Next steps and action items',
            'Ongoing portfolio monitoring advice',
          ]}
          icon={<TrendingUp className='h-6 w-6' />}
          triggerType='click'
          previewContent={
            <div className='border-2 border-blue-200 bg-blue-50 rounded-xl p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='p-2 rounded-lg bg-blue-100 border border-blue-200'>
                  <TrendingUp className='h-5 w-5 text-blue-600' />
                </div>
                <h3 className='text-lg font-semibold text-blue-800'>
                  Recommendations Preview
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
