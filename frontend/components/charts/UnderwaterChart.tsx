'use client';
import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  Tooltip,
  ResponsiveContainer,
  YAxis,
  XAxis,
  ReferenceLine,
  ReferenceArea,
  CartesianGrid,
} from 'recharts';
import { Badge } from '../ui/badge';
import { TrendingDown, Calendar, Target } from 'lucide-react';
import { useState } from 'react';

interface UnderwaterChartProps {
  dates: string[];
  drawdown: number[];
  equity?: number[];
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
  scenarioName: string;
  coveragePct: number;
  scenarioId?: string;
}

export default function UnderwaterChart({
  dates,
  drawdown,
  equity,
  benchmarks,
  scenarioName,
  coveragePct,
  scenarioId,
}: UnderwaterChartProps) {
  const [showEquity, setShowEquity] = useState(false);

  const chartData = useMemo(() => {
    return dates.map((date, i) => {
      const spyData = benchmarks?.SPY?.[scenarioId || ''];
      const aggData = benchmarks?.AGG?.[scenarioId || ''];
      const sixtyFortyData = benchmarks?.['60_40']?.[scenarioId || ''];

      return {
        date,
        drawdown: drawdown[i],
        equity: equity ? equity[i] : undefined,
        SPY:
          spyData?.drawdown && spyData.drawdown[i] !== undefined
            ? spyData.drawdown[i]
            : undefined,
        AGG:
          aggData?.drawdown && aggData.drawdown[i] !== undefined
            ? aggData.drawdown[i]
            : undefined,
        '60_40':
          sixtyFortyData?.drawdown && sixtyFortyData.drawdown[i] !== undefined
            ? sixtyFortyData.drawdown[i]
            : undefined,
      };
    });
  }, [dates, drawdown, equity, benchmarks, scenarioId]);

  const keyPoints = useMemo(() => {
    const peakIdx = drawdown.indexOf(0);
    const troughIdx = drawdown.indexOf(Math.min(...drawdown));
    const troughDate = dates[troughIdx];
    const mdd = drawdown[troughIdx];

    // Find recovery point (first index after trough where drawdown >= 0)
    let recoveryIdx = null;
    for (let i = troughIdx + 1; i < drawdown.length; i++) {
      if (drawdown[i] >= 0) {
        recoveryIdx = i;
        break;
      }
    }

    return {
      peakIdx,
      troughIdx,
      troughDate,
      mdd,
      recoveryIdx,
      recoveryDate: recoveryIdx ? dates[recoveryIdx] : null,
    };
  }, [dates, drawdown]);

  const minDrawdown = Math.min(...drawdown, -0.01);
  const maxEquity = equity ? Math.max(...equity) : 1;

  return (
    <div className='space-y-4'>
      {/* Stats Bar */}
      <div className='flex items-center justify-between p-4 bg-muted/30 rounded-lg'>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <TrendingDown className='h-4 w-4 text-red-600' />
            <span className='text-sm font-medium'>Max Drawdown:</span>
            <Badge variant='destructive'>{keyPoints.mdd.toFixed(1)}%</Badge>
          </div>
          <div className='flex items-center gap-2'>
            <Calendar className='h-4 w-4 text-muted-foreground' />
            <span className='text-sm font-medium'>Trough:</span>
            <span className='text-sm'>
              {new Date(keyPoints.troughDate).toLocaleDateString()}
            </span>
          </div>
          {keyPoints.recoveryDate && (
            <div className='flex items-center gap-2'>
              <Target className='h-4 w-4 text-green-600' />
              <span className='text-sm font-medium'>Recovery:</span>
              <span className='text-sm'>
                {new Date(keyPoints.recoveryDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <div className='flex items-center gap-2'>
          <button
            onClick={() => setShowEquity(!showEquity)}
            className={`px-3 py-1 text-xs rounded ${
              showEquity
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {showEquity ? 'Show Drawdown' : 'Show Equity'}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className='h-80 w-full'>
        <ResponsiveContainer>
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id='uw-main' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor='#ef4444' stopOpacity={0.6} />
                <stop offset='100%' stopColor='#ef4444' stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id='equity-main' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor='#10b981' stopOpacity={0.6} />
                <stop offset='100%' stopColor='#10b981' stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id='benchmark-spy' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor='#3b82f6' stopOpacity={0.3} />
                <stop offset='100%' stopColor='#3b82f6' stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id='benchmark-agg' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor='#8b5cf6' stopOpacity={0.3} />
                <stop offset='100%' stopColor='#8b5cf6' stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id='benchmark-6040' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor='#f59e0b' stopOpacity={0.3} />
                <stop offset='100%' stopColor='#f59e0b' stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />

            <XAxis
              dataKey='date'
              tickFormatter={value => new Date(value).toLocaleDateString()}
              tick={{ fontSize: 12 }}
            />

            <YAxis
              domain={showEquity ? [0, maxEquity * 1.1] : [minDrawdown, 0]}
              tickFormatter={value =>
                showEquity ? `${value.toFixed(0)}%` : `${value.toFixed(0)}%`
              }
              tick={{ fontSize: 12 }}
            />

            <Tooltip
              formatter={(value: number, name: string) => [
                `${value.toFixed(1)}%`,
                name === 'drawdown'
                  ? 'Drawdown'
                  : name === 'equity'
                  ? 'Equity'
                  : name === 'SPY'
                  ? 'SPY'
                  : name === 'AGG'
                  ? 'AGG'
                  : name === '60_40'
                  ? '60/40'
                  : name,
              ]}
              labelFormatter={label => new Date(label).toLocaleDateString()}
            />

            {/* Baseline reference line */}
            <ReferenceLine y={0} stroke='#6b7280' strokeDasharray='3 3' />

            {/* Trough marker */}
            <ReferenceLine
              x={keyPoints.troughDate}
              stroke='#ef4444'
              strokeWidth={2}
              label={{
                value: `Trough: ${keyPoints.mdd.toFixed(1)}%`,
                position: 'top',
                fill: '#ef4444',
                fontSize: 12,
              }}
            />

            {/* Recovery marker */}
            {keyPoints.recoveryDate && (
              <ReferenceLine
                x={keyPoints.recoveryDate}
                stroke='#10b981'
                strokeWidth={2}
                label={{
                  value: 'Recovery',
                  position: 'bottom',
                  fill: '#10b981',
                  fontSize: 12,
                }}
              />
            )}

            {/* Main portfolio line */}
            <Area
              type='monotone'
              dataKey={showEquity ? 'equity' : 'drawdown'}
              fill={showEquity ? 'url(#equity-main)' : 'url(#uw-main)'}
              stroke={showEquity ? '#10b981' : '#ef4444'}
              strokeWidth={2}
              name={showEquity ? 'equity' : 'drawdown'}
            />

            {/* Benchmark lines */}
            {benchmarks?.SPY?.[scenarioId || ''] && (
              <Area
                type='monotone'
                dataKey='SPY'
                fill='url(#benchmark-spy)'
                stroke='#3b82f6'
                strokeWidth={1}
                strokeDasharray='3 3'
                name='SPY'
              />
            )}

            {benchmarks?.AGG?.[scenarioId || ''] && (
              <Area
                type='monotone'
                dataKey='AGG'
                fill='url(#benchmark-agg)'
                stroke='#8b5cf6'
                strokeWidth={1}
                strokeDasharray='3 3'
                name='AGG'
              />
            )}

            {benchmarks?.['60_40']?.[scenarioId || ''] && (
              <Area
                type='monotone'
                dataKey='60_40'
                fill='url(#benchmark-6040)'
                stroke='#f59e0b'
                strokeWidth={1}
                strokeDasharray='3 3'
                name='60_40'
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className='flex items-center justify-center gap-6 text-sm'>
        <div className='flex items-center gap-2'>
          <div className='w-3 h-3 bg-red-500 rounded'></div>
          <span>Your Portfolio</span>
        </div>
        {benchmarks?.SPY?.[scenarioId || ''] && (
          <div className='flex items-center gap-2'>
            <div className='w-3 h-3 bg-blue-500 rounded'></div>
            <span>SPY</span>
          </div>
        )}
        {benchmarks?.AGG?.[scenarioId || ''] && (
          <div className='flex items-center gap-2'>
            <div className='w-3 h-3 bg-purple-500 rounded'></div>
            <span>AGG</span>
          </div>
        )}
        {benchmarks?.['60_40']?.[scenarioId || ''] && (
          <div className='flex items-center gap-2'>
            <div className='w-3 h-3 bg-amber-500 rounded'></div>
            <span>60/40</span>
          </div>
        )}
      </div>
    </div>
  );
}
