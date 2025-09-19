'use client';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Shield,
  BarChart3,
  Target,
  Activity,
  Globe,
  Zap,
  CheckCircle,
  Info,
  Clock,
  Database,
} from 'lucide-react';
import { type PredictionResult } from '@/lib/api';

interface AdvancedDetailsTabProps {
  result: PredictionResult;
}

export default function AdvancedDetailsTab({
  result,
}: AdvancedDetailsTabProps) {
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
    <div className='space-y-6'>
      <div className='text-center space-y-2'>
        <h3 className='text-lg font-semibold text-foreground'>
          Advanced Technical Details
        </h3>
        <p className='text-sm text-muted-foreground'>
          Detailed technical metrics and model information for advanced users
        </p>
      </div>

      <Tabs defaultValue='model' className='w-full'>
        <TabsList className='grid w-full grid-cols-1 sm:grid-cols-3 mb-6'>
          <TabsTrigger value='model' className='text-xs sm:text-sm'>
            <Database className='h-4 w-4 mr-2' />
            Model Details
          </TabsTrigger>
          <TabsTrigger value='data' className='text-xs sm:text-sm'>
            <Globe className='h-4 w-4 mr-2' />
            Data Quality
          </TabsTrigger>
          <TabsTrigger value='forecast' className='text-xs sm:text-sm'>
            <Clock className='h-4 w-4 mr-2' />
            Forecast Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value='model' className='space-y-4'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {/* AI Model */}
            <div className='group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-700 dark:bg-gray-950/20 dark:text-gray-400 dark:border-gray-800/30 p-4 sm:p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform shadow-lg'>
              <div className='flex items-center justify-between mb-3 sm:mb-4'>
                <div className='p-2 sm:p-2.5 rounded-lg bg-white/60 dark:bg-black/30 shadow-sm'>
                  {getModelTypeIcon(result.model_type)}
                </div>
                <div className='text-right'>
                  <p className='text-xs font-semibold opacity-80'>AI Model</p>
                </div>
              </div>
              <div>
                <p className='text-lg sm:text-xl font-bold mb-2 leading-tight'>
                  {getModelTypeLabel(result.model_type)}
                </p>
                <p className='text-sm font-medium opacity-80'>
                  Prediction Method
                </p>
              </div>
            </div>

            {/* Model Confidence */}
            {result.enhancement_data && (
              <div className='group relative overflow-hidden rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/30 p-4 sm:p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform shadow-lg'>
                <div className='flex items-center justify-between mb-3 sm:mb-4'>
                  <div className='p-2 sm:p-2.5 rounded-lg bg-white/60 dark:bg-black/30 shadow-sm'>
                    {result.enhancement_data.overall_confidence === 'high' ? (
                      <CheckCircle className='h-5 w-5 sm:h-6 sm:w-6 text-green-600' />
                    ) : (
                      <Info className='h-5 w-5 sm:h-6 sm:w-6 text-yellow-600' />
                    )}
                  </div>
                  <div className='text-right'>
                    <p className='text-xs font-semibold opacity-80'>
                      Confidence
                    </p>
                  </div>
                </div>
                <div>
                  <div className='flex items-center gap-2 mb-2'>
                    <p className='text-lg sm:text-2xl font-black capitalize leading-none'>
                      {result.enhancement_data.overall_confidence}
                    </p>
                  </div>
                  <p className='text-sm font-medium opacity-80'>
                    Model Confidence Level
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value='data' className='space-y-4'>
          {result.enhancement_data ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {/* Data Quality */}
              <div className='group relative overflow-hidden rounded-xl border-2 border-green-200 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/30 p-4 sm:p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform shadow-lg'>
                <div className='flex items-center justify-between mb-3 sm:mb-4'>
                  <div className='p-2 sm:p-2.5 rounded-lg bg-white/60 dark:bg-black/30 shadow-sm'>
                    <Globe className='h-5 w-5 sm:h-6 sm:w-6' />
                  </div>
                  <div className='text-right'>
                    <p className='text-xs font-semibold opacity-80'>Coverage</p>
                  </div>
                </div>
                <div>
                  <p className='text-2xl sm:text-3xl font-black mb-2 leading-none'>
                    {(
                      result.enhancement_data.coverage_analysis
                        .coverage_by_count * 100
                    ).toFixed(0)}
                    %
                  </p>
                  <p className='text-sm font-medium opacity-80'>
                    Asset Coverage
                  </p>
                </div>
              </div>

              {/* Data Sources */}
              <div className='group relative overflow-hidden rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/30 p-4 sm:p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform shadow-lg'>
                <div className='flex items-center justify-between mb-3 sm:mb-4'>
                  <div className='p-2 sm:p-2.5 rounded-lg bg-white/60 dark:bg-black/30 shadow-sm'>
                    <Database className='h-5 w-5 sm:h-6 sm:w-6' />
                  </div>
                  <div className='text-right'>
                    <p className='text-xs font-semibold opacity-80'>Sources</p>
                  </div>
                </div>
                <div>
                  <p className='text-2xl sm:text-3xl font-black mb-2 leading-none'>
                    {result.enhancement_data.coverage_analysis.total_sources ||
                      'Multiple'}
                  </p>
                  <p className='text-sm font-medium opacity-80'>Data Sources</p>
                </div>
              </div>
            </div>
          ) : (
            <div className='text-center py-8 text-muted-foreground'>
              <Info className='h-8 w-8 mx-auto mb-2' />
              <p>Enhanced data analysis not available for this portfolio</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value='forecast' className='space-y-4'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {/* Time Horizon */}
            <div className='group relative overflow-hidden rounded-xl border-2 border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800/30 p-4 sm:p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform shadow-lg'>
              <div className='flex items-center justify-between mb-3 sm:mb-4'>
                <div className='p-2 sm:p-2.5 rounded-lg bg-white/60 dark:bg-black/30 shadow-sm'>
                  <Clock className='h-5 w-5 sm:h-6 sm:w-6' />
                </div>
                <div className='text-right'>
                  <p className='text-xs font-semibold opacity-80'>Horizon</p>
                </div>
              </div>
              <div>
                <p className='text-2xl sm:text-3xl font-black mb-2 leading-none'>
                  {result.forecast_days}
                </p>
                <p className='text-sm font-medium opacity-80'>Days Forecast</p>
              </div>
            </div>

            {/* Forecast Date */}
            <div className='group relative overflow-hidden rounded-xl border-2 border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-800/30 p-4 sm:p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform shadow-lg'>
              <div className='flex items-center justify-between mb-3 sm:mb-4'>
                <div className='p-2 sm:p-2.5 rounded-lg bg-white/60 dark:bg-black/30 shadow-sm'>
                  <Target className='h-5 w-5 sm:h-6 sm:w-6' />
                </div>
                <div className='text-right'>
                  <p className='text-xs font-semibold opacity-80'>Generated</p>
                </div>
              </div>
              <div>
                <p className='text-sm sm:text-base font-bold mb-2 leading-tight'>
                  {new Date().toLocaleDateString()}
                </p>
                <p className='text-sm font-medium opacity-80'>Analysis Date</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

