'use client';
import { Shield, PieChart, BarChart3 } from 'lucide-react';

interface RiskSummarySectionProps {
  riskSummary: any;
  onReviewRecommendations: () => void;
}

export default function RiskSummarySection({
  riskSummary,
  onReviewRecommendations,
}: RiskSummarySectionProps) {
  const getRiskLevelBgColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Very High':
        return 'bg-gradient-to-br from-red-600 to-red-700 dark:from-red-700 dark:to-red-800';
      case 'High':
        return 'bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700';
      case 'Moderate':
        return 'bg-gradient-to-br from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700';
      case 'Low':
        return 'bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700';
      case 'Very Low':
        return 'bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700';
      default:
        return 'bg-gradient-to-br from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700';
    }
  };

  return (
    <div>
      <h4 className='text-lg font-semibold mb-6 flex items-center gap-2'>
        <Shield className='h-5 w-5 text-primary' />
        Risk Summary
      </h4>

      {/* Mobile Layout */}
      <div className='block lg:hidden space-y-6'>
        {/* Dominant Risk Assessment Card */}
        <div
          className={`relative overflow-hidden rounded-2xl p-8 ${getRiskLevelBgColor(
            riskSummary.overall_risk_level
          )} text-white shadow-xl transform hover:scale-[1.02] transition-all duration-300`}
        >
          <div className='absolute inset-0 bg-black/10'></div>
          <div className='relative'>
            <div className='flex items-center justify-between mb-6'>
              <div className='p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg'>
                <Shield className='h-8 w-8 text-white' />
              </div>
              <div className='text-right'>
                <p className='text-sm font-medium text-white/80'>
                  Overall Assessment
                </p>
              </div>
            </div>
            <div className='mb-6'>
              <p className='text-5xl font-black mb-3 leading-none'>
                {riskSummary.overall_risk_level}
              </p>
              <p className='text-lg text-white/90 font-medium'>
                Based on correlation & concentration analysis
              </p>
            </div>
            <button
              onClick={onReviewRecommendations}
              className='w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-4 px-6 rounded-xl border border-white/30 transition-all duration-200 hover:shadow-lg'
            >
              Review Recommendations →
            </button>
          </div>
        </div>

        {/* Secondary Metrics Cards */}
        <div className='grid grid-cols-1 gap-4'>
          <div className='relative overflow-hidden rounded-xl border-2 p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-sm hover:shadow-md transition-shadow'>
            <div className='flex items-center justify-between mb-4'>
              <div className='p-2 rounded-lg bg-white/80 dark:bg-black/20 shadow-sm'>
                <PieChart className='h-5 w-5 text-blue-600' />
              </div>
              <div className='text-right'>
                <p className='text-xs font-medium text-muted-foreground'>
                  Portfolio Balance
                </p>
              </div>
            </div>
            <div>
              <p className='text-3xl font-bold text-blue-600 mb-2'>
                {riskSummary.diversification_score.score}/100
              </p>
              <p className='text-sm text-muted-foreground line-clamp-2'>
                {riskSummary.diversification_score.explanation ||
                  'Diversification analysis completed'}
              </p>
            </div>
          </div>

          <div className='relative overflow-hidden rounded-xl border-2 border-primary/30 p-6 bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm hover:shadow-md transition-shadow'>
            <div className='flex items-center justify-between mb-4'>
              <div className='p-2 rounded-lg bg-white/80 dark:bg-black/20 shadow-sm'>
                <BarChart3 className='h-5 w-5 text-primary' />
              </div>
              <div className='text-right'>
                <p className='text-xs font-medium text-muted-foreground'>
                  Risk Score
                </p>
              </div>
            </div>
            <div>
              <p className='text-3xl font-bold text-primary mb-2'>
                {riskSummary.risk_score}/100
              </p>
              <p className='text-sm text-muted-foreground'>
                Comprehensive risk metric
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className='hidden lg:grid lg:grid-cols-12 lg:gap-6'>
        {/* Dominant Risk Assessment Card - Takes 6 columns */}
        <div
          className={`lg:col-span-6 relative overflow-hidden rounded-2xl p-8 ${getRiskLevelBgColor(
            riskSummary.overall_risk_level
          )} text-white shadow-xl transform hover:scale-[1.02] transition-all duration-300`}
        >
          <div className='absolute inset-0 bg-black/10'></div>
          <div className='relative'>
            <div className='flex items-center justify-between mb-6'>
              <div className='p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg'>
                <Shield className='h-8 w-8 text-white' />
              </div>
              <div className='text-right'>
                <p className='text-sm font-medium text-white/80'>
                  Overall Assessment
                </p>
              </div>
            </div>
            <div className='mb-6'>
              <p className='text-5xl font-black mb-3 leading-none'>
                {riskSummary.overall_risk_level}
              </p>
              <p className='text-lg text-white/90 font-medium'>
                Based on correlation & concentration analysis
              </p>
            </div>
            <button
              onClick={onReviewRecommendations}
              className='bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-4 px-8 rounded-xl border border-white/30 transition-all duration-200 hover:shadow-lg'
            >
              Review Recommendations →
            </button>
          </div>
        </div>

        {/* Secondary Metrics Cards - Take 3 columns each */}
        <div className='lg:col-span-3'>
          <div className='relative overflow-hidden rounded-xl border-2 p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-sm hover:shadow-md transition-shadow h-full'>
            <div className='flex items-center justify-between mb-4'>
              <div className='p-2 rounded-lg bg-white/80 dark:bg-black/20 shadow-sm'>
                <PieChart className='h-5 w-5 text-blue-600' />
              </div>
              <div className='text-right'>
                <p className='text-xs font-medium text-muted-foreground'>
                  Portfolio Balance
                </p>
              </div>
            </div>
            <div>
              <p className='text-2xl font-bold text-blue-600 mb-2'>
                {riskSummary.diversification_score.score}/100
              </p>
              <p className='text-sm text-muted-foreground line-clamp-2'>
                {riskSummary.diversification_score.explanation ||
                  'Diversification analysis completed'}
              </p>
            </div>
          </div>
        </div>

        <div className='lg:col-span-3'>
          <div className='relative overflow-hidden rounded-xl border-2 border-primary/30 p-6 bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm hover:shadow-md transition-shadow h-full'>
            <div className='flex items-center justify-between mb-4'>
              <div className='p-2 rounded-lg bg-white/80 dark:bg-black/20 shadow-sm'>
                <BarChart3 className='h-5 w-5 text-primary' />
              </div>
              <div className='text-right'>
                <p className='text-xs font-medium text-muted-foreground'>
                  Risk Score
                </p>
              </div>
            </div>
            <div>
              <p className='text-2xl font-bold text-primary mb-2'>
                {riskSummary.risk_score}/100
              </p>
              <p className='text-sm text-muted-foreground'>
                Comprehensive risk metric
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
