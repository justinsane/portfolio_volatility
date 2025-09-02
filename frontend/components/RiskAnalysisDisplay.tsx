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

        {/* Recommendations Section */}
        <RecommendationsSection
          recommendations={recommendations}
          portfolioAssets={portfolioAssets}
          correlationAnalysis={correlationAnalysis}
          onLearnMore={handleLearnMore}
        />

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
