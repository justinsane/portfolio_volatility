'use client';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Shield } from 'lucide-react';
import { type CrashScenarioResult } from './CrashTestPanel';

interface BenchmarkComparisonProps {
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
}

export default function BenchmarkComparison({
  scenarios,
  benchmarks,
}: BenchmarkComparisonProps) {
  if (!benchmarks || Object.keys(benchmarks).length === 0) {
    return null;
  }

  const validScenarios = scenarios.filter(
    scenario => !scenario.error && scenario.metrics
  );

  if (validScenarios.length === 0) {
    return null;
  }

  return (
    <Card className='border border-gray-200 dark:border-gray-800 shadow-sm'>
      <CardHeader>
        <CardTitle className='text-lg font-semibold flex items-center gap-2'>
          <Shield className='h-5 w-5 text-blue-600 flex-shrink-0' />
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
              {validScenarios.map(scenario => (
                <tr
                  key={scenario.id}
                  className='border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                >
                  <td className='p-3 font-medium text-gray-900 dark:text-gray-100'>
                    {scenario.id
                      .replace('_', ' ')
                      .replace(/\b\w/g, l => l.toUpperCase())}
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
                    const benchmarkData = benchmarks[benchmark]?.[scenario.id];
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
  );
}



