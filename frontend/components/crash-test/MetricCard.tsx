'use client';
import { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  color: string;
  icon: ReactNode;
  isPrimary?: boolean;
  tooltip?: string;
}

export default function MetricCard({
  label,
  value,
  color,
  icon,
  isPrimary = false,
  tooltip,
}: MetricCardProps) {
  return (
    <div
      className={`text-center p-4 rounded-lg border transition-all duration-200 hover:shadow-md min-h-[100px] ${
        isPrimary
          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800/30'
          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
      }`}
      title={tooltip}
    >
      <div className='flex items-center justify-center gap-2 mb-3'>
        <div
          className={`p-1.5 rounded-md flex-shrink-0 ${
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

