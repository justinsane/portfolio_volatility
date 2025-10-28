'use client';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  TrendingDown,
  Clock,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Maximize2,
  Activity,
} from 'lucide-react';
import { type CrashScenarioResult, type CrashMetrics } from './CrashTestPanel';
import { type CrashScenario } from './ScenarioSelector';
import MetricCard from './MetricCard';
import UnderwaterSparkline from '../charts/UnderwaterSparkline';
import UnderwaterChart from '../charts/UnderwaterChart';

interface ScenarioResultsProps {
  scenarios: CrashScenarioResult[];
  scenarioConfigs: CrashScenario[];
  benchmarks?: Record<
    string,
    {
      [scenarioId: string]: {
        dates: string[];
        equity: number[];
        drawdown: number[];
      };
    }
  >;
}

export default function ScenarioResults({
  scenarios,
  scenarioConfigs,
  benchmarks,
}: ScenarioResultsProps) {
  const getRiskColor = (drawdown: number) => {
    if (drawdown <= -30)
      return 'text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400';
    if (drawdown <= -20)
      return 'text-orange-600 bg-orange-50 dark:bg-orange-950/20 dark:text-orange-400';
    if (drawdown <= -10)
      return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 dark:text-yellow-400';
    return 'text-green-600 bg-green-50 dark:bg-green-950/20 dark:text-green-400';
  };

  const formatRecoveryTime = (days: number | null) => {
    if (days === null) return 'No recovery within period';
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.round(days / 30)} months`;
    return `${Math.round(days / 365)} years`;
  };

  const validScenarios = scenarios.filter(
    scenario => !scenario.error && scenario.metrics
  );
  const errorScenarios = scenarios.filter(
    scenario => scenario.error || !scenario.metrics
  );

  return (
    <div className='space-y-6'>
      {/* Valid Results */}
      {validScenarios.length > 0 && (
        <div className='space-y-6'>
          <div className='flex items-center gap-3'>
            <div className='p-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 flex-shrink-0'>
              <CheckCircle className='h-5 w-5 text-green-600 dark:text-green-400' />
            </div>
            <h3 className='text-xl font-bold text-gray-900 dark:text-gray-100'>
              Crash Test Results
            </h3>
          </div>

          <div className='grid gap-6'>
            {validScenarios.map(scenario => {
              const scenarioInfo = scenarioConfigs.find(
                s => s.id === scenario.id
              );
              return (
                <Card
                  key={scenario.id}
                  className='border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-200'
                >
                  <CardHeader className='pb-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-t-lg'>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                      <div className='flex items-center gap-3'>
                        <div
                          className={`p-2 rounded-lg ${scenarioInfo?.bgColor} ${scenarioInfo?.borderColor} flex-shrink-0`}
                        >
                          <div
                            className={scenarioInfo?.color.replace(
                              'bg-',
                              'text-'
                            )}
                          >
                            {scenarioInfo?.icon}
                          </div>
                        </div>
                        <div className='min-w-0'>
                          <CardTitle className='text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100'>
                            {scenarioInfo?.label}
                          </CardTitle>
                          <p className='text-sm text-gray-600 dark:text-gray-400'>
                            {scenarioInfo?.start} to {scenarioInfo?.end}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant='outline'
                        className='text-xs bg-white dark:bg-gray-800 flex-shrink-0'
                      >
                        {Math.round(scenario.coveragePct * 100)}% coverage
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className='p-4 sm:p-6'>
                    {/* Key Metrics Grid */}
                    <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6'>
                      <MetricCard
                        label='Cumulative Return'
                        value={`${scenario.metrics!.cumReturnPct.toFixed(1)}%`}
                        color={
                          scenario.metrics!.cumReturnPct >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }
                        icon={<TrendingDown className='h-5 w-5' />}
                        isPrimary={true}
                      />

                      <MetricCard
                        label='Max Drawdown'
                        value={`${scenario.metrics!.maxDrawdownPct.toFixed(
                          1
                        )}%`}
                        color={getRiskColor(scenario.metrics!.maxDrawdownPct)}
                        icon={<Activity className='h-5 w-5' />}
                        isPrimary={true}
                      />

                      <MetricCard
                        label='Time to Recovery'
                        value={formatRecoveryTime(
                          scenario.metrics!.timeToRecoveryDays
                        )}
                        color='text-gray-700 dark:text-gray-300'
                        icon={<Clock className='h-5 w-5' />}
                        tooltip='Time from the peak value to recovery of that same peak value (measures how long the portfolio spent underwater)'
                      />

                      <MetricCard
                        label='Worst Day'
                        value={`${scenario.metrics!.worstDayPct.toFixed(1)}%`}
                        color='text-red-600 dark:text-red-400'
                        icon={<AlertTriangle className='h-5 w-5' />}
                      />
                    </div>

                    {/* Secondary Metrics */}
                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6'>
                      <div className='text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
                        <div className='text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100'>
                          {scenario.metrics!.annVolPct.toFixed(1)}%
                        </div>
                        <div className='text-sm text-gray-600 dark:text-gray-400'>
                          Annual Volatility
                        </div>
                      </div>

                      <div className='text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
                        <div className='text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100'>
                          {scenario.metrics!.sharpeLite.toFixed(2)}
                        </div>
                        <div className='text-sm text-gray-600 dark:text-gray-400'>
                          Sharpe Ratio
                        </div>
                      </div>

                      <div className='text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
                        <div className='text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100'>
                          {scenario.metrics!.worstMonthPct.toFixed(1)}%
                        </div>
                        <div className='text-sm text-gray-600 dark:text-gray-400'>
                          Worst Month
                        </div>
                      </div>
                    </div>

                    {/* Underwater Chart */}
                    {scenario.series && (
                      <div className='border-t border-gray-200 dark:border-gray-700 pt-6'>
                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4'>
                          <h4 className='text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2'>
                            <BarChart3 className='h-5 w-5 text-blue-600 flex-shrink-0' />
                            Drawdown Over Time
                          </h4>
                          <div className='text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1'>
                            <Maximize2 className='h-4 w-4 flex-shrink-0' />
                            Click to expand
                          </div>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <div
                              className='w-full cursor-pointer hover:opacity-90 transition-opacity border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900 touch-manipulation'
                              aria-label={`Underwater chart showing drawdown during the ${scenarioInfo?.label}`}
                            >
                              <UnderwaterSparkline
                                dates={scenario.series!.dates}
                                values={scenario.series!.drawdown}
                                coveragePct={scenario.coveragePct}
                              />
                            </div>
                          </DialogTrigger>
                          <DialogContent className='sm:max-w-4xl max-h-[90vh] overflow-y-auto'>
                            <DialogHeader>
                              <DialogTitle>
                                {scenarioInfo?.label} - Portfolio Performance
                              </DialogTitle>
                            </DialogHeader>
                            <UnderwaterChart
                              dates={scenario.series!.dates}
                              drawdown={scenario.series!.drawdown}
                              equity={scenario.series!.equity}
                              benchmarks={benchmarks}
                              scenarioName={scenarioInfo?.label || ''}
                              coveragePct={scenario.coveragePct}
                              scenarioId={scenario.id}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Scenarios */}
      {errorScenarios.length > 0 && (
        <div className='space-y-6 mt-6'>
          <div className='flex items-center gap-3'>
            <div className='p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/30 flex-shrink-0'>
              <AlertTriangle className='h-5 w-5 text-orange-600 dark:text-orange-400' />
            </div>
            <h3 className='text-xl font-bold text-orange-700 dark:text-orange-400'>
              Scenarios with Limited Data
            </h3>
          </div>

          <div className='grid gap-6'>
            {errorScenarios.map(scenario => {
              const scenarioInfo = scenarioConfigs.find(
                s => s.id === scenario.id
              );
              return (
                <Card
                  key={scenario.id}
                  className='border-2 border-orange-200 dark:border-orange-800 shadow-sm'
                >
                  <CardHeader className='pb-4'>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                      <div className='flex items-center gap-3'>
                        <div
                          className={`p-2 rounded-lg ${scenarioInfo?.bgColor} ${scenarioInfo?.borderColor} flex-shrink-0`}
                        >
                          <div
                            className={scenarioInfo?.color.replace(
                              'bg-',
                              'text-'
                            )}
                          >
                            {scenarioInfo?.icon}
                          </div>
                        </div>
                        <div className='min-w-0'>
                          <CardTitle className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                            {scenarioInfo?.label}
                          </CardTitle>
                          <p className='text-sm text-gray-600 dark:text-gray-400'>
                            {scenarioInfo?.start} to {scenarioInfo?.end}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant='outline'
                        className='text-xs bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 border-orange-200 dark:border-orange-800 flex-shrink-0'
                      >
                        Limited data
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <Alert className='border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20'>
                      <AlertTriangle className='h-4 w-4 text-orange-600' />
                      <AlertDescription className='text-orange-800 dark:text-orange-200'>
                        {scenario.error ||
                          'Insufficient historical data available for this scenario. Some assets may not have been trading during this period.'}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}













