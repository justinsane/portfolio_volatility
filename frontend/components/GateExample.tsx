'use client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Shield, BarChart3, TrendingUp, Lock } from 'lucide-react';
import GateWrapper from './GateWrapper';
import { getGateConfig } from '@/lib/gateConfig';

// Example of how to wrap existing components with gates
export default function GateExample() {
  const riskAnalysisConfig = getGateConfig('risk-analysis');
  const recommendationsConfig = getGateConfig('recommendations');

  return (
    <div className='space-y-6 p-6'>
      <h2 className='text-2xl font-bold text-center'>Gate System Demo</h2>

      {/* Example 1: Risk Analysis Gate */}
      {riskAnalysisConfig && (
        <GateWrapper
          gateId={riskAnalysisConfig.id}
          title={riskAnalysisConfig.title}
          description={riskAnalysisConfig.description}
          benefits={riskAnalysisConfig.benefits}
          icon={<riskAnalysisConfig.icon className='h-6 w-6' />}
          triggerType={riskAnalysisConfig.triggerType}
          triggerDelay={riskAnalysisConfig.triggerDelay}
          previewContent={
            <Card className='border-2 border-orange-200 bg-orange-50'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Shield className='h-5 w-5 text-orange-600' />
                  Risk Analysis Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm font-medium'>
                      Overall Risk Score
                    </span>
                    <Badge variant='destructive'>84.6/100</Badge>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm font-medium'>Risk Level</span>
                    <Badge variant='destructive'>HIGH</Badge>
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    Detailed breakdown, correlation analysis, and concentration
                    metrics available with advisor consultation.
                  </div>
                </div>
              </CardContent>
            </Card>
          }
        >
          {/* This is the full content that will be shown after unlocking */}
          <Card className='border-2 border-green-200 bg-green-50'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Shield className='h-5 w-5 text-green-600' />
                Full Risk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <div className='text-sm font-medium'>
                      Risk Score Breakdown
                    </div>
                    <div className='text-2xl font-bold text-green-600'>
                      84.6/100
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      Based on volatility, correlation, and concentration
                      analysis
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <div className='text-sm font-medium'>
                      Correlation Analysis
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Most correlated pair: AAPL & MSFT (0.85)
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      High correlation increases portfolio risk
                    </div>
                  </div>
                </div>
                <div className='space-y-2'>
                  <div className='text-sm font-medium'>
                    Concentration Risk (HHI)
                  </div>
                  <div className='text-lg font-semibold text-orange-600'>
                    0.255
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    High concentration risk - consider diversifying holdings
                  </div>
                </div>
                <div className='p-3 bg-blue-50 rounded-lg'>
                  <div className='text-sm font-medium text-blue-800'>
                    Recommendation
                  </div>
                  <div className='text-xs text-blue-600 mt-1'>
                    Consider reducing position sizes in top holdings and adding
                    uncorrelated assets to improve diversification.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </GateWrapper>
      )}

      {/* Example 2: Recommendations Gate */}
      {recommendationsConfig && (
        <GateWrapper
          gateId={recommendationsConfig.id}
          title={recommendationsConfig.title}
          description={recommendationsConfig.description}
          benefits={recommendationsConfig.benefits}
          icon={<recommendationsConfig.icon className='h-6 w-6' />}
          triggerType={recommendationsConfig.triggerType}
          previewContent={
            <Card className='border-2 border-blue-200 bg-blue-50'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <TrendingUp className='h-5 w-5 text-blue-600' />
                  Recommendations Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm font-medium'>
                      Recommendations Available
                    </span>
                    <Badge variant='secondary'>5 items</Badge>
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    Personalized investment recommendations, optimization
                    strategies, and risk mitigation plans available with advisor
                    consultation.
                  </div>
                  <Button size='sm' className='w-full'>
                    <Lock className='h-4 w-4 mr-2' />
                    View Recommendations
                  </Button>
                </div>
              </CardContent>
            </Card>
          }
        >
          {/* Full recommendations content */}
          <Card className='border-2 border-green-200 bg-green-50'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <TrendingUp className='h-5 w-5 text-green-600' />
                Personalized Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='space-y-3'>
                  <div className='p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                    <div className='text-sm font-medium text-yellow-800'>
                      High Priority
                    </div>
                    <div className='text-xs text-yellow-600 mt-1'>
                      Reduce AAPL position from 25% to 15% to improve
                      diversification
                    </div>
                  </div>
                  <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                    <div className='text-sm font-medium text-blue-800'>
                      Medium Priority
                    </div>
                    <div className='text-xs text-blue-600 mt-1'>
                      Add international exposure (VXUS) to reduce geographic
                      concentration
                    </div>
                  </div>
                  <div className='p-3 bg-green-50 border border-green-200 rounded-lg'>
                    <div className='text-sm font-medium text-green-800'>
                      Low Priority
                    </div>
                    <div className='text-xs text-green-600 mt-1'>
                      Consider adding REITs (VNQ) for inflation protection
                    </div>
                  </div>
                </div>
                <div className='p-3 bg-purple-50 border border-purple-200 rounded-lg'>
                  <div className='text-sm font-medium text-purple-800'>
                    Next Steps
                  </div>
                  <div className='text-xs text-purple-600 mt-1'>
                    1. Review tax implications before rebalancing
                    <br />
                    2. Set up automatic rebalancing schedule
                    <br />
                    3. Monitor correlation changes quarterly
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </GateWrapper>
      )}

      {/* Instructions */}
      <Card className='border-2 border-gray-200 bg-gray-50'>
        <CardHeader>
          <CardTitle className='text-lg'>How to Use Gates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-2 text-sm text-muted-foreground'>
            <p>
              • <strong>Time-based gates:</strong> Automatically trigger after
              spending time on the site
            </p>
            <p>
              • <strong>Click-based gates:</strong> Trigger when users click to
              view gated content
            </p>
            <p>
              • <strong>Scroll-based gates:</strong> Trigger when users scroll
              to gated sections
            </p>
            <p>
              • <strong>Preview content:</strong> Shows a preview of what&apos;s
              behind the gate
            </p>
            <p>
              • <strong>Unlock persistence:</strong> Once unlocked, gates stay
              unlocked for the session
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
