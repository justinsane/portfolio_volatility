'use client';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { TrendingDown, BarChart3, RefreshCw } from 'lucide-react';

interface CrashTestHeaderProps {
  onRunTest: () => void;
  loading: boolean;
  hasPortfolio: boolean;
}

export default function CrashTestHeader({
  onRunTest,
  loading,
  hasPortfolio,
}: CrashTestHeaderProps) {
  return (
    <Card className='border-0 shadow-sm bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20'>
      <CardHeader className='pb-4'>
        <div className='flex flex-col gap-4'>
          <div className='flex items-center gap-4'>
            <div className='p-3 rounded-xl bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800/30 flex-shrink-0'>
              <TrendingDown className='h-6 w-6 text-red-600 dark:text-red-400' />
            </div>
            <div className='min-w-0 flex-1'>
              <CardTitle className='text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100'>
                Crash Test Analysis
              </CardTitle>
              <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                How your portfolio would have performed during major market
                crashes
              </p>
            </div>
          </div>

          <div className='flex justify-center sm:justify-end'>
            <Button
              onClick={onRunTest}
              disabled={loading || !hasPortfolio}
              className='w-full sm:w-auto bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-4 sm:py-3 px-6 text-lg shadow-lg hover:shadow-xl active:shadow-inner transition-all duration-200 touch-manipulation select-none cursor-pointer min-h-[48px]'
              size='lg'
            >
              {loading ? (
                <RefreshCw className='h-5 w-5 mr-3 animate-spin flex-shrink-0' />
              ) : (
                <BarChart3 className='h-5 w-5 mr-3 flex-shrink-0' />
              )}
              <span className='whitespace-nowrap'>
                {loading ? 'Running...' : 'Run Crash Test'}
              </span>
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
