'use client';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Info, HelpCircle, AlertTriangle } from 'lucide-react';

interface CoverageInfoProps {
  overallCoverage: number;
  byTicker: Record<string, number>;
}

export default function CoverageInfo({
  overallCoverage,
  byTicker,
}: CoverageInfoProps) {
  const hasLimitedData = overallCoverage < 0.9;
  const coveragePercentage = Math.round(overallCoverage * 100);

  return (
    <Card className='border border-gray-200 dark:border-gray-800 shadow-sm'>
      <CardContent className='p-4'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <div className='p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 flex-shrink-0'>
              <Info className='h-4 w-4 text-blue-600 dark:text-blue-400' />
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                Data Coverage: {coveragePercentage}%
              </span>
              <div className='relative group'>
                <HelpCircle className='h-4 w-4 text-gray-400 cursor-help flex-shrink-0' />
                <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10'>
                  Percentage of portfolio assets with sufficient historical data
                  <div className='absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900'></div>
                </div>
              </div>
            </div>
          </div>

          {hasLimitedData && (
            <Badge
              variant='outline'
              className='bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 flex-shrink-0'
            >
              <AlertTriangle className='h-3 w-3 mr-1' />
              Limited Data
            </Badge>
          )}
        </div>

        {hasLimitedData && (
          <Alert className='mt-3 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20'>
            <AlertTriangle className='h-4 w-4 text-yellow-600' />
            <AlertDescription className='text-yellow-800 dark:text-yellow-200'>
              Some assets have limited historical data. Results may not be fully
              representative.
            </AlertDescription>
          </Alert>
        )}

        {/* Show individual ticker coverage if there are issues */}
        {hasLimitedData && Object.keys(byTicker).length > 0 && (
          <div className='mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
            <h4 className='text-sm font-medium text-gray-900 dark:text-gray-100 mb-2'>
              Asset Coverage Details:
            </h4>
            <div className='grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs'>
              {Object.entries(byTicker).map(([ticker, coverage]) => (
                <div
                  key={ticker}
                  className={`flex justify-between items-center p-2 rounded ${
                    coverage < 0.9
                      ? 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-200'
                      : 'bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-200'
                  }`}
                >
                  <span className='font-medium'>{ticker}</span>
                  <span>{Math.round(coverage * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



