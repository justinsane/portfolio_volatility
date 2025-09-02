'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { Button } from './ui/button';

interface LearnMoreDialogProps {
  isOpen: boolean;
  topic: string;
  recommendation: any;
  onOpenChange: (open: boolean) => void;
}

export default function LearnMoreDialog({
  isOpen,
  topic,
  recommendation,
  onOpenChange,
}: LearnMoreDialogProps) {
  const getLearnMoreContent = (topic: string, recommendation: any) => {
    const content = {
      'high-correlation': {
        title: 'Understanding High Correlation',
        summary:
          'High correlation between assets means they move together, reducing diversification benefits and increasing portfolio risk.',
        sections: [
          {
            title: 'What is Correlation?',
            content:
              'Correlation measures how closely two assets move together. A correlation of 1.0 means they move in perfect sync, while 0.0 means they move independently. When assets have high correlation (above 80%), they offer limited diversification benefits.',
          },
          {
            title: 'Why High Correlation is Risky',
            content:
              'When highly correlated assets decline together, your portfolio loses diversification benefits. This can lead to larger losses during market downturns and reduced risk-adjusted returns.',
          },
          {
            title: 'Strategies to Reduce Correlation',
            content:
              'Consider adding assets with low correlation to your current holdings, such as: • International equities • Real estate • Commodities • Alternative investments',
          },
          {
            title: 'Target Goals',
            content:
              'Aim to reduce correlation between highly correlated assets to below 70%. Consider replacing one asset with a different asset class to improve diversification.',
          },
        ],
        actions: [
          { label: 'Explore Alternative Assets', action: 'explore-assets' },
          { label: 'Rebalance Portfolio', action: 'rebalance' },
          { label: 'View Correlation Matrix', action: 'correlation-matrix' },
        ],
      },
      'portfolio-concentration': {
        title: 'Addressing Portfolio Concentration',
        summary:
          'High concentration in a few assets increases risk. Your portfolio has significant exposure to individual holdings.',
        sections: [
          {
            title: 'What is Concentration Risk?',
            content:
              'Concentration risk occurs when a large portion of your portfolio is invested in a few assets. This reduces diversification benefits and increases overall portfolio volatility.',
          },
          {
            title: 'Why Concentration is Dangerous',
            content:
              'High concentration means poor diversification. If your largest holdings decline significantly, they will have a major impact on your entire portfolio performance. This can lead to larger losses during market downturns.',
          },
          {
            title: 'Strategies to Reduce Concentration',
            content:
              '• Gradually reduce large positions to 5-15% of portfolio • Add more diverse assets across different sectors • Consider dollar-cost averaging into new positions • Set maximum allocation limits per asset (e.g., 10-15%)',
          },
          {
            title: 'Rebalancing Approach',
            content:
              'Instead of selling all at once, consider: • Selling portions of large positions gradually • Investing new capital into other assets • Setting up automatic rebalancing rules • Using dollar-cost averaging to reduce impact',
          },
        ],
        actions: [
          { label: 'Create Rebalancing Plan', action: 'rebalancing-plan' },
          {
            label: 'Explore Diversification Tools',
            action: 'diversification-tools',
          },
          { label: 'Set Allocation Targets', action: 'allocation-targets' },
        ],
      },
      'single-asset-concentration': {
        title: 'Managing Single Asset Concentration',
        summary:
          'A single asset represents a large portion of your portfolio, creating concentration risk and reducing diversification benefits.',
        sections: [
          {
            title: 'Current Concentration Risk',
            content:
              'Having a single asset dominate your portfolio creates significant volatility risk. If this asset declines significantly, it will have a major impact on your entire portfolio performance.',
          },
          {
            title: 'Recommended Allocation',
            content:
              'For most investors, no single asset should represent more than 10-15% of total portfolio. Consider reducing large positions to improve diversification and reduce risk.',
          },
          {
            title: 'Reduction Strategies',
            content:
              '• Gradually reduce the large position over 3-6 months • Reallocate proceeds to diversified ETFs • Consider dollar-cost averaging out to minimize tax impact • Replace with more stable, diversified assets',
          },
          {
            title: 'Alternative Approaches',
            content:
              'If you want to maintain exposure to this asset class, consider: • Sector ETFs for broader exposure • Index funds for diversification • Smaller allocations across multiple related assets',
          },
        ],
        actions: [
          { label: 'Calculate Reduction Plan', action: 'reduction-calculator' },
          {
            label: 'Explore Diversified Alternatives',
            action: 'diversified-alternatives',
          },
          { label: 'Set Up Dollar-Cost Averaging', action: 'dca-setup' },
        ],
      },
      'top3-concentration': {
        title: 'Addressing Top 3 Holdings Concentration',
        summary:
          'Your top 3 holdings represent a large portion of your portfolio, creating concentration risk and limiting diversification.',
        sections: [
          {
            title: 'Current Concentration Risk',
            content:
              'Having your top 3 holdings dominate your portfolio reduces diversification benefits. This concentration can lead to higher volatility and increased risk during market downturns.',
          },
          {
            title: 'Recommended Allocation',
            content:
              'Aim to have your top 3 holdings represent no more than 50-60% of your total portfolio. This provides better diversification across more assets and sectors.',
          },
          {
            title: 'Diversification Strategies',
            content:
              '• Add 5-7 new positions across different asset classes • Consider international equities (VXUS, IEFA) • Add real estate (VNQ, IYR) and commodities (DJP, GSG) • Include sector-specific ETFs for targeted exposure',
          },
          {
            title: 'Implementation Approach',
            content:
              '• Start with broad market ETFs for core positions • Add sector-specific funds gradually • Consider target-date funds for automatic rebalancing • Review and rebalance quarterly',
          },
        ],
        actions: [
          { label: 'Explore New Asset Classes', action: 'explore-assets' },
          {
            label: 'Portfolio Diversification Tool',
            action: 'diversification-tool',
          },
          {
            label: 'Asset Allocation Calculator',
            action: 'allocation-calculator',
          },
        ],
      },
      diversification: {
        title: 'Improving Portfolio Diversification',
        summary:
          'Your portfolio lacks sufficient diversification across asset classes, sectors, and geographies.',
        sections: [
          {
            title: 'Current Diversification Issues',
            content:
              'Your portfolio is heavily concentrated in a few assets and lacks exposure to important asset classes like international equities, real estate, and commodities.',
          },
          {
            title: 'Benefits of Diversification',
            content:
              'Proper diversification: • Reduces overall portfolio volatility • Improves risk-adjusted returns • Protects against sector-specific downturns • Provides exposure to different economic cycles',
          },
          {
            title: 'Recommended Asset Allocation',
            content:
              'Consider a more balanced approach: • 40-60% US equities • 20-30% International equities • 10-20% Bonds • 5-10% Real estate • 5-10% Commodities/Alternatives',
          },
          {
            title: 'Implementation Strategy',
            content:
              '• Start with broad market ETFs for core positions • Add sector-specific funds gradually • Consider target-date funds for automatic rebalancing • Review and rebalance quarterly',
          },
        ],
        actions: [
          { label: 'Build Diversified Portfolio', action: 'portfolio-builder' },
          {
            label: 'Asset Allocation Calculator',
            action: 'allocation-calculator',
          },
          { label: 'Sector Analysis Tool', action: 'sector-analysis' },
        ],
      },
    };

    return content[topic as keyof typeof content] || content['diversification'];
  };

  if (!isOpen) return null;

  const content = getLearnMoreContent(topic, recommendation);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold text-foreground'>
            {content.title}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Summary */}
          <div className='p-4 bg-primary/5 rounded-lg border border-primary/20'>
            <p className='text-lg text-foreground font-medium'>
              {content.summary}
            </p>
          </div>

          {/* Mobile Accordion Layout */}
          <div className='block lg:hidden'>
            <Accordion type='single' collapsible className='w-full'>
              {content.sections.map((section, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className='text-left font-semibold text-foreground hover:text-primary transition-colors'>
                    {section.title}
                  </AccordionTrigger>
                  <AccordionContent className='text-muted-foreground leading-relaxed'>
                    {section.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Desktop Side-by-Side Layout */}
          <div className='hidden lg:grid lg:grid-cols-2 lg:gap-8'>
            <div className='space-y-6'>
              {content.sections.slice(0, 2).map((section, index) => (
                <div key={index} className='space-y-3'>
                  <h3 className='text-lg font-semibold text-foreground'>
                    {section.title}
                  </h3>
                  <p className='text-muted-foreground leading-relaxed'>
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
            <div className='space-y-6'>
              {content.sections.slice(2).map((section, index) => (
                <div key={index} className='space-y-3'>
                  <h3 className='text-lg font-semibold text-foreground'>
                    {section.title}
                  </h3>
                  <p className='text-muted-foreground leading-relaxed'>
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className='border-t border-border pt-6'>
            <h3 className='text-lg font-semibold text-foreground mb-4'>
              Take Action
            </h3>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
              {content.actions.map((action, index) => (
                <Button
                  key={index}
                  variant='outline'
                  className='w-full justify-start text-left h-auto py-3 px-4'
                  onClick={() => {
                    // Handle different actions
                    console.log(`Action: ${action.action}`);
                    // TODO: Implement specific action handlers
                  }}
                >
                  <div className='flex flex-col items-start'>
                    <span className='font-medium text-foreground'>
                      {action.label}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      Click to get started
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
