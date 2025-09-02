'use client';
import { Badge } from './ui/badge';
import {
  Shield,
  BarChart3,
  Target,
  Activity,
  Globe,
  Zap,
  CheckCircle,
  Info,
} from 'lucide-react';
import { type PredictionResult } from '@/lib/api';

interface SummaryMetricsProps {
  result: PredictionResult;
}

export default function SummaryMetrics({ result }: SummaryMetricsProps) {
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'very high':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/30';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-800/30';
      case 'moderate':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800/30';
      case 'low':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/30';
      case 'very low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getModelTypeIcon = (modelType: string) => {
    switch (modelType) {
      case 'enhanced_multi_source':
        return <Zap className='h-5 w-5' />;
      case 'historical_random_forest':
        return <BarChart3 className='h-5 w-5' />;
      case 'asset_based_estimation':
        return <Target className='h-5 w-5' />;
      default:
        return <Activity className='h-5 w-5' />;
    }
  };

  const getModelTypeLabel = (modelType: string) => {
    switch (modelType) {
      case 'enhanced_multi_source':
        return 'Enhanced Multi-Source';
      case 'historical_random_forest':
        return 'Historical Random Forest';
      case 'asset_based_estimation':
        return 'Asset-Based Estimation';
      default:
        return modelType;
    }
  };

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
      {/* Risk Assessment - Most Prominent Card */}
      <div
        className={`group relative overflow-hidden rounded-xl border-2 p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform ${getRiskColor(
          result.risk_level
        )} shadow-lg`}
      >
        <div className='flex items-center justify-between mb-4'>
          <div className='p-2.5 rounded-lg bg-white/60 dark:bg-black/30 shadow-sm'>
            <Shield className='h-6 w-6' />
          </div>
          <div className='text-right'>
            <p className='text-xs font-semibold opacity-80'>Risk Assessment</p>
          </div>
        </div>
        <div>
          <p className='text-3xl font-black mb-2 leading-none'>
            {result.risk_level}
          </p>
          <p className='text-sm font-medium opacity-80'>Portfolio Risk Level</p>
        </div>
      </div>

      {/* Expected Volatility */}
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
            {result.labels?.ml_adjustment && (
              <Badge
                variant='outline'
                className='text-xs bg-white/60 dark:bg-black/30 font-medium'
              >
                ML: {result.labels.ml_adjustment}
              </Badge>
            )}
          </div>
          <p className='text-sm font-medium opacity-80'>Expected Volatility</p>
        </div>
      </div>

      {/* Time Horizon */}
      <div className='group relative overflow-hidden rounded-xl border-2 border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800/30 p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform shadow-lg'>
        <div className='flex items-center justify-between mb-4'>
          <div className='p-2.5 rounded-lg bg-white/60 dark:bg-black/30 shadow-sm'>
            <Target className='h-6 w-6' />
          </div>
          <div className='text-right'>
            <p className='text-xs font-semibold opacity-80'>Time Horizon</p>
          </div>
        </div>
        <div>
          <p className='text-3xl font-black mb-2 leading-none'>
            {result.forecast_days}
          </p>
          <p className='text-sm font-medium opacity-80'>Days Forecast</p>
        </div>
      </div>

      {/* AI Model */}
      <div className='group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-700 dark:bg-gray-950/20 dark:text-gray-400 dark:border-gray-800/30 p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform shadow-lg'>
        <div className='flex items-center justify-between mb-4'>
          <div className='p-2.5 rounded-lg bg-white/60 dark:bg-black/30 shadow-sm'>
            {getModelTypeIcon(result.model_type)}
          </div>
          <div className='text-right'>
            <p className='text-xs font-semibold opacity-80'>AI Model</p>
          </div>
        </div>
        <div>
          <p className='text-xl font-bold mb-2 leading-tight'>
            {getModelTypeLabel(result.model_type)}
          </p>
          <p className='text-sm font-medium opacity-80'>Prediction Method</p>
        </div>
      </div>

      {/* Enhanced Data Cards - Only show if enhancement data exists */}
      {result.enhancement_data && (
        <>
          {/* Data Quality */}
          <div className='group relative overflow-hidden rounded-xl border-2 border-green-200 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/30 p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform shadow-lg'>
            <div className='flex items-center justify-between mb-4'>
              <div className='p-2.5 rounded-lg bg-white/60 dark:bg-black/30 shadow-sm'>
                <Globe className='h-6 w-6' />
              </div>
              <div className='text-right'>
                <p className='text-xs font-semibold opacity-80'>Data Quality</p>
              </div>
            </div>
            <div>
              <p className='text-3xl font-black mb-2 leading-none'>
                {(
                  result.enhancement_data.coverage_analysis.coverage_by_count *
                  100
                ).toFixed(0)}
                %
              </p>
              <p className='text-sm font-medium opacity-80'>Asset Coverage</p>
            </div>
          </div>

          {/* Reliability */}
          <div className='group relative overflow-hidden rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/30 p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform shadow-lg'>
            <div className='flex items-center justify-between mb-4'>
              <div className='p-2.5 rounded-lg bg-white/60 dark:bg-black/30 shadow-sm'>
                {result.enhancement_data.overall_confidence === 'high' ? (
                  <CheckCircle className='h-6 w-6 text-green-600' />
                ) : (
                  <Info className='h-6 w-6 text-yellow-600' />
                )}
              </div>
              <div className='text-right'>
                <p className='text-xs font-semibold opacity-80'>Reliability</p>
              </div>
            </div>
            <div>
              <div className='flex items-center gap-2 mb-2'>
                <p className='text-2xl font-black capitalize leading-none'>
                  {result.enhancement_data.overall_confidence}
                </p>
              </div>
              <p className='text-sm font-medium opacity-80'>Confidence Level</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
