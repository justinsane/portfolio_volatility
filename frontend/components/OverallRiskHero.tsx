'use client';
import { Shield, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import {
  calculateDynamicRiskLevel,
  getRiskColors,
  getRiskIcon,
} from '@/lib/riskCalculations';
import { type PredictionResult } from '@/lib/api';

interface OverallRiskHeroProps {
  result: PredictionResult;
}

export default function OverallRiskHero({ result }: OverallRiskHeroProps) {
  // Calculate dynamic risk level
  const riskInfo = calculateDynamicRiskLevel(result);
  const colors = getRiskColors(riskInfo.level);
  const riskIcon = getRiskIcon(riskInfo.level);

  return (
    <div className='w-full'>
      {/* Hero Risk Assessment Card */}
      <Card
        className={`border-0 shadow-2xl overflow-hidden ${colors.bg} ${colors.text}`}
      >
        <CardContent className='p-6 sm:p-8 lg:p-12'>
          <div className='text-center space-y-6'>
            {/* Risk Level Badge */}
            <div className='flex justify-center'>
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${colors.badge} backdrop-blur-sm`}
              >
                <span className='text-2xl'>{riskIcon}</span>
                <span className='text-sm font-semibold'>
                  Portfolio Risk Assessment
                </span>
              </div>
            </div>

            {/* Main Risk Level Display */}
            <div className='space-y-4'>
              <h1 className='text-4xl sm:text-5xl lg:text-6xl font-black leading-tight'>
                {riskInfo.level}
              </h1>

              {/* Risk Score */}
              <div className='flex items-center justify-center gap-3'>
                <div className='text-2xl sm:text-3xl font-bold'>
                  {riskInfo.score}/100
                </div>
                <div className='text-sm sm:text-base opacity-90'>
                  Risk Score
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className='max-w-2xl mx-auto'>
              <p className='text-lg sm:text-xl opacity-90 leading-relaxed'>
                {riskInfo.explanation}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
