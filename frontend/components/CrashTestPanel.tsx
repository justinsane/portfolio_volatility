'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import {
  TrendingDown,
  Clock,
  AlertTriangle,
  BarChart3,
  Target,
  Activity,
  Calendar,
  CheckCircle,
  Info,
  Download,
  RefreshCw,
} from 'lucide-react';
import { type PredictionResult } from '@/lib/api';

// Types for crash test data
export type CrashMetrics = {
  cumReturnPct: number;
  maxDrawdownPct: number;
  timeToRecoveryDays: number | null;
  worstDayPct: number;
  worstMonthPct: number;
  annVolPct: number;
  sharpeLite: number;
};

export type CrashScenarioResult = {
  id: string;
  metrics?: CrashMetrics;
  series?: { dates: string[]; equity: number[]; drawdown: number[] };
  coveragePct: number;
  error?: string;
};

export type CrashTestResult = {
  portfolioCoverage: {
    overall: number;
    byTicker: Record<string, number>;
  };
  scenarios: CrashScenarioResult[];
  benchmarks?: Record<string, CrashScenarioResult[]>;
};

interface CrashTestPanelProps {
  portfolio: Array<{ Ticker: string; Weight: number }>;
  onResults?: (results: CrashTestResult) => void;
}

const CRASH_SCENARIOS = [
  {
    id: 'gfc',
    label: 'Global Financial Crisis',
    start: '2007-10-09',
    end: '2013-03-28',
    description: 'The 2008 financial crisis and recovery period',
  },
  {
    id: 'pandemic',
    label: 'Pandemic Crash',
    start: '2020-02-19',
    end: '2021-08-20',
    description: 'COVID-19 market crash and recovery',
  },
  {
    id: 'dot_com',
    label: 'Dot-Com Bust',
    start: '2000-03-24',
    end: '2007-10-09',
    description: 'The dot-com bubble burst and recovery',
  },
  {
    id: 'rate_shock_2022',
    label: '2022 Rate Shock',
    start: '2022-01-01',
    end: '2024-01-01',
    description: 'Rising interest rates and market adjustment',
  },
];

export default function CrashTestPanel({
  portfolio,
  onResults,
}: CrashTestPanelProps) {
  const [results, setResults] = useState<CrashTestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([
    'gfc',
    'pandemic',
  ]);

  const runCrashTest = async () => {
    if (!portfolio || portfolio.length === 0) {
      setError('No portfolio data available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert portfolio format and normalize weights to decimals (0-1)
      const portfolioData = portfolio.map(asset => ({
        ticker: asset.Ticker,
        weight: asset.Weight / 100, // Convert percentage to decimal
      }));

      // Get selected scenarios
      const scenarios = CRASH_SCENARIOS.filter(scenario =>
        selectedScenarios.includes(scenario.id)
      );

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        }/api/crash_test`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            portfolio: portfolioData,
            scenarios: scenarios,
            options: {
              rebalance: 'none',
              driftHandling: 'renormDaily',
              currency: 'USD',
              benchmarks: ['SPY', 'AGG', '60_40'],
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run crash test');
      }

      const crashTestResults = await response.json();
      setResults(crashTestResults);

      if (onResults) {
        onResults(crashTestResults);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <Card className='w-full'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30'>
              <TrendingDown className='h-5 w-5 text-red-600' />
            </div>
            <div>
              <CardTitle className='text-xl'>Crash Test Analysis</CardTitle>
              <p className='text-sm text-muted-foreground'>
                How your portfolio would have performed during major market
                crashes
              </p>
            </div>
          </div>
          <Button
            onClick={runCrashTest}
            disabled={loading || portfolio.length === 0}
            className='flex items-center gap-2'
          >
            {loading ? (
              <RefreshCw className='h-4 w-4 animate-spin' />
            ) : (
              <BarChart3 className='h-4 w-4' />
            )}
            {loading ? 'Running...' : 'Run Crash Test'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Scenario Selection */}
        <div>
          <h4 className='text-sm font-medium mb-3'>
            Select Scenarios to Test:
          </h4>
          <div className='grid grid-cols-2 gap-3'>
            {CRASH_SCENARIOS.map(scenario => (
              <label
                key={scenario.id}
                className='flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors'
              >
                <input
                  type='checkbox'
                  checked={selectedScenarios.includes(scenario.id)}
                  onChange={e => {
                    if (e.target.checked) {
                      setSelectedScenarios([...selectedScenarios, scenario.id]);
                    } else {
                      setSelectedScenarios(
                        selectedScenarios.filter(id => id !== scenario.id)
                      );
                    }
                  }}
                  className='rounded'
                />
                <div>
                  <div className='font-medium text-sm'>{scenario.label}</div>
                  <div className='text-xs text-muted-foreground'>
                    {scenario.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant='destructive'>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Coverage Information */}
        {results && (
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <Info className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm text-muted-foreground'>
                Data Coverage:{' '}
                {Math.round(results.portfolioCoverage.overall * 100)}%
              </span>
            </div>

            {results.portfolioCoverage.overall < 0.9 && (
              <Alert>
                <AlertTriangle className='h-4 w-4' />
                <AlertDescription>
                  Some assets have limited historical data. Results may not be
                  fully representative.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Results Display */}
        {results && results.scenarios.length > 0 && (
          <>
            {/* Show scenarios with valid data first */}
            {results.scenarios.filter(
              scenario => !scenario.error && scenario.metrics
            ).length > 0 && (
              <div className='space-y-6'>
                <h3 className='text-lg font-semibold'>Crash Test Results</h3>
                <div className='grid gap-6'>
                  {results.scenarios
                    .filter(scenario => !scenario.error && scenario.metrics)
                    .map(scenario => {
                      const scenarioInfo = CRASH_SCENARIOS.find(
                        s => s.id === scenario.id
                      );
                      return (
                        <Card key={scenario.id} className='border-2'>
                          <CardHeader className='pb-4'>
                            <div className='flex items-center justify-between'>
                              <div>
                                <CardTitle className='text-lg'>
                                  {scenarioInfo?.label}
                                </CardTitle>
                                <p className='text-sm text-muted-foreground'>
                                  {scenarioInfo?.start} to {scenarioInfo?.end}
                                </p>
                              </div>
                              <Badge variant='outline' className='text-xs'>
                                {Math.round(scenario.coveragePct * 100)}%
                                coverage
                              </Badge>
                            </div>
                          </CardHeader>

                          <CardContent>
                            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                              <MetricCard
                                label='Cumulative Return'
                                value={`${scenario.metrics!.cumReturnPct.toFixed(
                                  1
                                )}%`}
                                color={
                                  scenario.metrics!.cumReturnPct >= 0
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }
                                icon={<TrendingDown className='h-4 w-4' />}
                              />

                              <MetricCard
                                label='Max Drawdown'
                                value={`${scenario.metrics!.maxDrawdownPct.toFixed(
                                  1
                                )}%`}
                                color={getRiskColor(
                                  scenario.metrics!.maxDrawdownPct
                                )}
                                icon={<Activity className='h-4 w-4' />}
                              />

                              <div title='Time from the peak value to recovery of that same peak value (measures how long the portfolio spent underwater)'>
                                <MetricCard
                                  label='Time to Recovery'
                                  value={formatRecoveryTime(
                                    scenario.metrics!.timeToRecoveryDays
                                  )}
                                  color='text-muted-foreground'
                                  icon={<Clock className='h-4 w-4' />}
                                />
                              </div>

                              <MetricCard
                                label='Worst Day'
                                value={`${scenario.metrics!.worstDayPct.toFixed(
                                  1
                                )}%`}
                                color='text-red-600'
                                icon={<AlertTriangle className='h-4 w-4' />}
                              />
                            </div>

                            <div className='grid grid-cols-2 md:grid-cols-3 gap-4 mt-4'>
                              <div className='text-center p-3 bg-muted/30 rounded-lg'>
                                <div className='text-2xl font-bold text-foreground'>
                                  {scenario.metrics!.annVolPct.toFixed(1)}%
                                </div>
                                <div className='text-xs text-muted-foreground'>
                                  Annual Volatility
                                </div>
                              </div>

                              <div className='text-center p-3 bg-muted/30 rounded-lg'>
                                <div className='text-2xl font-bold text-foreground'>
                                  {scenario.metrics!.sharpeLite.toFixed(2)}
                                </div>
                                <div className='text-xs text-muted-foreground'>
                                  Sharpe Ratio
                                </div>
                              </div>

                              <div className='text-center p-3 bg-muted/30 rounded-lg'>
                                <div className='text-2xl font-bold text-foreground'>
                                  {scenario.metrics!.worstMonthPct.toFixed(1)}%
                                </div>
                                <div className='text-xs text-muted-foreground'>
                                  Worst Month
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Show scenarios with errors */}
            {results.scenarios.filter(
              scenario => scenario.error || !scenario.metrics
            ).length > 0 && (
              <div className='space-y-6 mt-6'>
                <h3 className='text-lg font-semibold text-orange-700 dark:text-orange-400'>
                  Scenarios with Limited Data
                </h3>
                <div className='grid gap-6'>
                  {results.scenarios
                    .filter(scenario => scenario.error || !scenario.metrics)
                    .map(scenario => {
                      const scenarioInfo = CRASH_SCENARIOS.find(
                        s => s.id === scenario.id
                      );
                      return (
                        <Card
                          key={scenario.id}
                          className='border-2 border-orange-200 dark:border-orange-800'
                        >
                          <CardHeader className='pb-4'>
                            <div className='flex items-center justify-between'>
                              <div>
                                <CardTitle className='text-lg'>
                                  {scenarioInfo?.label}
                                </CardTitle>
                                <p className='text-sm text-muted-foreground'>
                                  {scenarioInfo?.start} to {scenarioInfo?.end}
                                </p>
                              </div>
                              <Badge
                                variant='outline'
                                className='text-xs bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400'
                              >
                                Limited data
                              </Badge>
                            </div>
                          </CardHeader>

                          <CardContent>
                            <Alert>
                              <AlertTriangle className='h-4 w-4' />
                              <AlertDescription>
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

            {/* Benchmark Comparison */}
            {results.benchmarks &&
              Object.keys(results.benchmarks).length > 0 && (
                <div className='mt-8'>
                  <h3 className='text-lg font-semibold mb-4'>
                    Benchmark Comparison
                  </h3>
                  <div className='overflow-x-auto'>
                    <table className='w-full text-sm'>
                      <thead>
                        <tr className='border-b'>
                          <th className='text-left p-2'>Scenario</th>
                          <th className='text-left p-2'>Your Portfolio</th>
                          <th className='text-left p-2'>SPY</th>
                          <th className='text-left p-2'>AGG</th>
                          <th className='text-left p-2'>60/40</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.scenarios
                          .filter(
                            scenario => !scenario.error && scenario.metrics
                          )
                          .map(scenario => (
                            <tr key={scenario.id} className='border-b'>
                              <td className='p-2 font-medium'>
                                {
                                  CRASH_SCENARIOS.find(
                                    s => s.id === scenario.id
                                  )?.label
                                }
                              </td>
                              <td className='p-2'>
                                {scenario.metrics ? (
                                  <span
                                    className={
                                      scenario.metrics.cumReturnPct >= 0
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                    }
                                  >
                                    {scenario.metrics.cumReturnPct.toFixed(1)}%
                                  </span>
                                ) : (
                                  <span className='text-muted-foreground'>
                                    -
                                  </span>
                                )}
                              </td>
                              {['SPY', 'AGG', '60_40'].map(benchmark => {
                                const benchmarkData = results.benchmarks?.[
                                  benchmark
                                ]?.find(b => b.id === scenario.id);
                                return (
                                  <td key={benchmark} className='p-2'>
                                    {benchmarkData &&
                                    benchmarkData.metrics &&
                                    !benchmarkData.error ? (
                                      <span
                                        className={
                                          benchmarkData.metrics.cumReturnPct >=
                                          0
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                        }
                                      >
                                        {benchmarkData.metrics.cumReturnPct.toFixed(
                                          1
                                        )}
                                        %
                                      </span>
                                    ) : (
                                      <span className='text-muted-foreground'>
                                        {benchmarkData?.error ? 'No data' : '-'}
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className='text-center p-3 border rounded-lg'>
      <div className='flex items-center justify-center gap-2 mb-2'>
        {icon}
        <div className='text-xs text-muted-foreground'>{label}</div>
      </div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}
