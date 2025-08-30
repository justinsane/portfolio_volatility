'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
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
  Maximize2,
  Zap,
  DollarSign,
  Shield,
  HelpCircle,
  Biohazard,
} from 'lucide-react';
import { type PredictionResult } from '@/lib/api';
import UnderwaterSparkline from './charts/UnderwaterSparkline';
import UnderwaterChart from './charts/UnderwaterChart';

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
  series?: {
    dates: string[];
    equity: number[];
    drawdown: number[];
  };
  coveragePct: number;
  error?: string;
};

export type CrashTestResult = {
  portfolioCoverage: {
    overall: number;
    byTicker: Record<string, number>;
  };
  scenarios: CrashScenarioResult[];
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
    icon: <TrendingDown className='h-5 w-5' />,
    color: 'bg-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-200 dark:border-red-800/30',
  },
  {
    id: 'pandemic',
    label: 'Pandemic Crash',
    start: '2020-02-19',
    end: '2021-08-20',
    description: 'COVID-19 market crash and recovery',
    icon: <Biohazard className='h-5 w-5' />,
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-200 dark:border-orange-800/30',
  },
  {
    id: 'dot_com',
    label: 'Dot-Com Bust',
    start: '2000-03-24',
    end: '2007-10-09',
    description: 'The dot-com bubble burst and recovery',
    icon: <Zap className='h-5 w-5' />,
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800/30',
  },
  {
    id: 'rate_shock_2022',
    label: '2022 Rate Shock',
    start: '2022-01-01',
    end: '2024-01-01',
    description: 'Rising interest rates and market adjustment',
    icon: <DollarSign className='h-5 w-5' />,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-200 dark:border-purple-800/30',
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
  const [selectedChartScenario, setSelectedChartScenario] = useState<
    string | null
  >(null);

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

  const toggleScenario = (scenarioId: string) => {
    if (selectedScenarios.includes(scenarioId)) {
      setSelectedScenarios(selectedScenarios.filter(id => id !== scenarioId));
    } else {
      setSelectedScenarios([...selectedScenarios, scenarioId]);
    }
  };

  return (
    <div className='w-full space-y-6'>
      {/* Header Section */}
      <Card className='border-0 shadow-sm bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20'>
        <CardHeader className='pb-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <div className='p-3 rounded-xl bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800/30'>
                <TrendingDown className='h-6 w-6 text-red-600 dark:text-red-400' />
              </div>
              <div>
                <CardTitle className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                  Crash Test Analysis
                </CardTitle>
                <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                  How your portfolio would have performed during major market
                  crashes
                </p>
              </div>
            </div>
            <Button
              onClick={runCrashTest}
              disabled={loading || portfolio.length === 0}
              className='flex items-center gap-2 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg'
              size='lg'
            >
              {loading ? (
                <RefreshCw className='h-5 w-5 animate-spin' />
              ) : (
                <BarChart3 className='h-5 w-5' />
              )}
              {loading ? 'Running...' : 'Run Crash Test'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Scenario Selection Section */}
      <Card className='border border-gray-200 dark:border-gray-800 shadow-sm'>
        <CardHeader className='pb-4'>
          <CardTitle className='text-lg font-semibold flex items-center gap-2'>
            <Target className='h-5 w-5 text-blue-600' />
            Select Scenarios to Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {CRASH_SCENARIOS.map(scenario => {
              const isSelected = selectedScenarios.includes(scenario.id);
              return (
                <div
                  key={scenario.id}
                  onClick={() => toggleScenario(scenario.id)}
                  className={`relative cursor-pointer transition-all duration-200 hover:scale-105 ${
                    isSelected
                      ? 'ring-2 ring-blue-500 shadow-lg'
                      : 'hover:shadow-md'
                  }`}
                >
                  <Card
                    className={`h-full border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <CardContent className='p-4'>
                      <div className='flex items-start gap-3'>
                        <div
                          className={`p-2 rounded-lg ${scenario.bgColor} ${scenario.borderColor}`}
                        >
                          <div
                            className={scenario.color.replace('bg-', 'text-')}
                          >
                            {scenario.icon}
                          </div>
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2 mb-1'>
                            <h3 className='font-semibold text-sm text-gray-900 dark:text-gray-100 truncate'>
                              {scenario.label}
                            </h3>
                            {isSelected && (
                              <CheckCircle className='h-4 w-4 text-blue-600 flex-shrink-0' />
                            )}
                          </div>
                          <p className='text-xs text-gray-600 dark:text-gray-400 leading-relaxed'>
                            {scenario.description}
                          </p>
                          <div className='text-xs text-gray-500 dark:text-gray-500 mt-2'>
                            {scenario.start} - {scenario.end}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert
          variant='destructive'
          className='border-red-200 dark:border-red-800'
        >
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Coverage Information */}
      {results && (
        <Card className='border border-gray-200 dark:border-gray-800 shadow-sm'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30'>
                  <Info className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                    Data Coverage:{' '}
                    {Math.round(results.portfolioCoverage.overall * 100)}%
                  </span>
                  <div className='relative group'>
                    <HelpCircle className='h-4 w-4 text-gray-400 cursor-help' />
                    <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10'>
                      Percentage of portfolio assets with sufficient historical
                      data
                      <div className='absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900'></div>
                    </div>
                  </div>
                </div>
              </div>
              {results.portfolioCoverage.overall < 0.9 && (
                <Badge
                  variant='outline'
                  className='bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
                >
                  <AlertTriangle className='h-3 w-3 mr-1' />
                  Limited Data
                </Badge>
              )}
            </div>

            {results.portfolioCoverage.overall < 0.9 && (
              <Alert className='mt-3 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20'>
                <AlertTriangle className='h-4 w-4 text-yellow-600' />
                <AlertDescription className='text-yellow-800 dark:text-yellow-200'>
                  Some assets have limited historical data. Results may not be
                  fully representative.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {results && results.scenarios.length > 0 && (
        <div className='space-y-6'>
          {/* Show scenarios with valid data first */}
          {results.scenarios.filter(
            scenario => !scenario.error && scenario.metrics
          ).length > 0 && (
            <div className='space-y-6'>
              <div className='flex items-center gap-3'>
                <div className='p-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30'>
                  <CheckCircle className='h-5 w-5 text-green-600 dark:text-green-400' />
                </div>
                <h3 className='text-xl font-bold text-gray-900 dark:text-gray-100'>
                  Crash Test Results
                </h3>
              </div>

              <div className='grid gap-6'>
                {results.scenarios
                  .filter(scenario => !scenario.error && scenario.metrics)
                  .map(scenario => {
                    const scenarioInfo = CRASH_SCENARIOS.find(
                      s => s.id === scenario.id
                    );
                    return (
                      <Card
                        key={scenario.id}
                        className='border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-200'
                      >
                        <CardHeader className='pb-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-t-lg'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <div
                                className={`p-2 rounded-lg ${scenarioInfo?.bgColor} ${scenarioInfo?.borderColor}`}
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
                              <div>
                                <CardTitle className='text-xl font-bold text-gray-900 dark:text-gray-100'>
                                  {scenarioInfo?.label}
                                </CardTitle>
                                <p className='text-sm text-gray-600 dark:text-gray-400'>
                                  {scenarioInfo?.start} to {scenarioInfo?.end}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant='outline'
                              className='text-xs bg-white dark:bg-gray-800'
                            >
                              {Math.round(scenario.coveragePct * 100)}% coverage
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent className='p-6'>
                          {/* Key Metrics Grid */}
                          <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
                            <MetricCard
                              label='Cumulative Return'
                              value={`${scenario.metrics!.cumReturnPct.toFixed(
                                1
                              )}%`}
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
                              color={getRiskColor(
                                scenario.metrics!.maxDrawdownPct
                              )}
                              icon={<Activity className='h-5 w-5' />}
                              isPrimary={true}
                            />

                            <div title='Time from the peak value to recovery of that same peak value (measures how long the portfolio spent underwater)'>
                              <MetricCard
                                label='Time to Recovery'
                                value={formatRecoveryTime(
                                  scenario.metrics!.timeToRecoveryDays
                                )}
                                color='text-gray-700 dark:text-gray-300'
                                icon={<Clock className='h-5 w-5' />}
                              />
                            </div>

                            <MetricCard
                              label='Worst Day'
                              value={`${scenario.metrics!.worstDayPct.toFixed(
                                1
                              )}%`}
                              color='text-red-600 dark:text-red-400'
                              icon={<AlertTriangle className='h-5 w-5' />}
                            />
                          </div>

                          {/* Secondary Metrics */}
                          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                            <div className='text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
                              <div className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                                {scenario.metrics!.annVolPct.toFixed(1)}%
                              </div>
                              <div className='text-sm text-gray-600 dark:text-gray-400'>
                                Annual Volatility
                              </div>
                            </div>

                            <div className='text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
                              <div className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                                {scenario.metrics!.sharpeLite.toFixed(2)}
                              </div>
                              <div className='text-sm text-gray-600 dark:text-gray-400'>
                                Sharpe Ratio
                              </div>
                            </div>

                            <div className='text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
                              <div className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
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
                              <div className='flex items-center justify-between mb-4'>
                                <h4 className='text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2'>
                                  <BarChart3 className='h-5 w-5 text-blue-600' />
                                  Drawdown Over Time
                                </h4>
                                <div className='text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1'>
                                  <Maximize2 className='h-4 w-4' />
                                  Click to expand
                                </div>
                              </div>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <div
                                    className='w-full cursor-pointer hover:opacity-90 transition-opacity border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900'
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
                                      {scenarioInfo?.label} - Portfolio
                                      Performance
                                    </DialogTitle>
                                  </DialogHeader>
                                  <UnderwaterChart
                                    dates={scenario.series!.dates}
                                    drawdown={scenario.series!.drawdown}
                                    equity={scenario.series!.equity}
                                    benchmarks={results.benchmarks}
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

          {/* Show scenarios with errors */}
          {results.scenarios.filter(
            scenario => scenario.error || !scenario.metrics
          ).length > 0 && (
            <div className='space-y-6 mt-6'>
              <div className='flex items-center gap-3'>
                <div className='p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/30'>
                  <AlertTriangle className='h-5 w-5 text-orange-600 dark:text-orange-400' />
                </div>
                <h3 className='text-xl font-bold text-orange-700 dark:text-orange-400'>
                  Scenarios with Limited Data
                </h3>
              </div>

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
                        className='border-2 border-orange-200 dark:border-orange-800 shadow-sm'
                      >
                        <CardHeader className='pb-4'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <div
                                className={`p-2 rounded-lg ${scenarioInfo?.bgColor} ${scenarioInfo?.borderColor}`}
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
                              <div>
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
                              className='text-xs bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 border-orange-200 dark:border-orange-800'
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

          {/* Benchmark Comparison */}
          {results.benchmarks && Object.keys(results.benchmarks).length > 0 && (
            <Card className='border border-gray-200 dark:border-gray-800 shadow-sm'>
              <CardHeader>
                <CardTitle className='text-lg font-semibold flex items-center gap-2'>
                  <Shield className='h-5 w-5 text-blue-600' />
                  Benchmark Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b border-gray-200 dark:border-gray-700'>
                        <th className='text-left p-3 font-semibold text-gray-900 dark:text-gray-100'>
                          Scenario
                        </th>
                        <th className='text-left p-3 font-semibold text-gray-900 dark:text-gray-100'>
                          Your Portfolio
                        </th>
                        <th className='text-left p-3 font-semibold text-gray-900 dark:text-gray-100'>
                          SPY
                        </th>
                        <th className='text-left p-3 font-semibold text-gray-900 dark:text-gray-100'>
                          AGG
                        </th>
                        <th className='text-left p-3 font-semibold text-gray-900 dark:text-gray-100'>
                          60/40
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.scenarios
                        .filter(scenario => !scenario.error && scenario.metrics)
                        .map(scenario => (
                          <tr
                            key={scenario.id}
                            className='border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          >
                            <td className='p-3 font-medium text-gray-900 dark:text-gray-100'>
                              {
                                CRASH_SCENARIOS.find(s => s.id === scenario.id)
                                  ?.label
                              }
                            </td>
                            <td className='p-3'>
                              {scenario.metrics ? (
                                <span
                                  className={
                                    scenario.metrics.cumReturnPct >= 0
                                      ? 'text-green-600 dark:text-green-400 font-medium'
                                      : 'text-red-600 dark:text-red-400 font-medium'
                                  }
                                >
                                  {scenario.metrics.cumReturnPct.toFixed(1)}%
                                </span>
                              ) : (
                                <span className='text-gray-400 dark:text-gray-500'>
                                  -
                                </span>
                              )}
                            </td>
                            {['SPY', 'AGG', '60_40'].map(benchmark => {
                              const benchmarkData =
                                results.benchmarks?.[benchmark]?.[scenario.id];
                              return (
                                <td key={benchmark} className='p-3'>
                                  {benchmarkData ? (
                                    <span className='text-gray-600 dark:text-gray-400'>
                                      Available
                                    </span>
                                  ) : (
                                    <span className='text-gray-400 dark:text-gray-500'>
                                      -
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
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
  icon,
  isPrimary = false,
}: {
  label: string;
  value: string;
  color: string;
  icon: React.ReactNode;
  isPrimary?: boolean;
}) {
  return (
    <div
      className={`text-center p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
        isPrimary
          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800/30'
          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className='flex items-center justify-center gap-2 mb-3'>
        <div
          className={`p-1.5 rounded-md ${
            isPrimary
              ? 'bg-blue-100 dark:bg-blue-900/30'
              : 'bg-gray-100 dark:bg-gray-800'
          }`}
        >
          {icon}
        </div>
        <div
          className={`text-xs font-medium ${
            isPrimary
              ? 'text-blue-700 dark:text-blue-300'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {label}
        </div>
      </div>
      <div
        className={`text-xl font-bold ${color} ${isPrimary ? 'text-2xl' : ''}`}
      >
        {value}
      </div>
    </div>
  );
}
