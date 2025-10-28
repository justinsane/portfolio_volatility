'use client';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Target, CheckCircle } from 'lucide-react';

export interface CrashScenario {
  id: string;
  label: string;
  start: string;
  end: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface ScenarioSelectorProps {
  scenarios: CrashScenario[];
  selectedScenarios: string[];
  onToggleScenario: (scenarioId: string) => void;
}

export default function ScenarioSelector({
  scenarios,
  selectedScenarios,
  onToggleScenario,
}: ScenarioSelectorProps) {
  return (
    <Card className='border border-gray-200 dark:border-gray-800 shadow-sm'>
      <CardHeader className='pb-4'>
        <CardTitle className='text-lg font-semibold flex items-center gap-2'>
          <Target className='h-5 w-5 text-blue-600 flex-shrink-0' />
          Select Scenarios to Test
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {scenarios.map(scenario => {
            const isSelected = selectedScenarios.includes(scenario.id);
            return (
              <div
                key={scenario.id}
                onClick={() => onToggleScenario(scenario.id)}
                className={`relative cursor-pointer transition-all duration-200 hover:scale-105 touch-manipulation ${
                  isSelected
                    ? 'ring-2 ring-blue-500 shadow-lg'
                    : 'hover:shadow-md'
                }`}
                role='button'
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleScenario(scenario.id);
                  }
                }}
                aria-label={`${isSelected ? 'Deselect' : 'Select'} ${
                  scenario.label
                } scenario`}
              >
                <Card
                  className={`h-full border-2 transition-all duration-200 min-h-[120px] ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <CardContent className='p-4 h-full flex flex-col'>
                    <div className='flex items-start gap-3 flex-1'>
                      <div
                        className={`p-2 rounded-lg ${scenario.bgColor} ${scenario.borderColor} flex-shrink-0`}
                      >
                        <div className={scenario.color.replace('bg-', 'text-')}>
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
                        <p className='text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-2'>
                          {scenario.description}
                        </p>
                        <div className='text-xs text-gray-500 dark:text-gray-500'>
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
  );
}













