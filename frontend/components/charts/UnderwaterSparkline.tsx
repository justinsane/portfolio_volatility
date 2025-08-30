'use client';
import {
  AreaChart,
  Area,
  Tooltip,
  ResponsiveContainer,
  YAxis,
  XAxis,
  ReferenceLine,
} from 'recharts';

export default function UnderwaterSparkline({
  dates,
  values,
  coveragePct = 1,
}: {
  dates: string[];
  values: number[];
  coveragePct?: number;
}) {
  const data = dates.map((d, i) => ({ d, v: values[i] })); // v ≤ 0
  const min = Math.min(...values, -0.01); // ensure small negative

  return (
    <div className='h-14 w-full relative group'>
      {coveragePct < 0.7 && (
        <div className='absolute top-0 right-0 z-10'>
          <div className='bg-orange-100 text-orange-700 text-xs px-1 py-0.5 rounded'>
            Limited data
          </div>
        </div>
      )}
      <div className='absolute inset-0 bg-blue-50 dark:bg-blue-950/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded pointer-events-none' />
      <ResponsiveContainer>
        <AreaChart
          data={data}
          margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
          className={`${
            coveragePct < 0.7 ? 'opacity-60' : ''
          } transition-transform duration-200 group-hover:scale-[1.02]`}
        >
          <defs>
            <linearGradient id='uw' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='0%' stopColor='#ef4444' stopOpacity={0.6} />
              <stop offset='100%' stopColor='#ef4444' stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id='uw-dim' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='0%' stopColor='#6b7280' stopOpacity={0.4} />
              <stop offset='100%' stopColor='#6b7280' stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis dataKey='d' hide />
          <YAxis
            domain={[min, 0]}
            tickFormatter={x => `${x.toFixed(0)}%`}
            hide
          />
          <ReferenceLine
            y={0}
            stroke='#6b7280'
            strokeDasharray='2 2'
            strokeWidth={0.5}
          />
          <Area
            type='monotone'
            dataKey='v'
            isAnimationActive={false}
            fill={coveragePct < 0.7 ? 'url(#uw-dim)' : 'url(#uw)'}
            stroke={coveragePct < 0.7 ? '#6b7280' : '#ef4444'}
            strokeWidth={1}
          />
          <Tooltip
            formatter={(v: number) => [`${v.toFixed(1)}%`, 'Drawdown']}
            labelFormatter={l => new Date(l).toLocaleDateString()}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
