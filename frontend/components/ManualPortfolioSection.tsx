import React, { useCallback, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Plus,
  Trash2,
  CheckCircle,
  ChevronDown,
  Calculator,
  Target,
  Zap,
  Sparkles,
} from 'lucide-react';
import { PortfolioAsset } from '@/lib/portfolioValidator';

interface ManualPortfolioSectionProps {
  manualAssets: PortfolioAsset[];
  onUpdateAssets: (assets: PortfolioAsset[]) => void;
  onValidate: () => void;
  getTotalWeight: () => number;
  getWeightColor: (total: number) => string;
}

export default function ManualPortfolioSection({
  manualAssets,
  onUpdateAssets,
  onValidate,
  getTotalWeight,
  getWeightColor,
}: ManualPortfolioSectionProps) {
  const tickerRefs = useRef<Array<HTMLInputElement | null>>([]);
  const weightRefs = useRef<Array<HTMLInputElement | null>>([]);
  const assetCardsRef = useRef<HTMLDivElement>(null);

  const addAsset = useCallback(() => {
    const newAssets = [...manualAssets, { ticker: '', weight: 0 }];
    onUpdateAssets(newAssets);

    // Use setTimeout to ensure the DOM has updated before scrolling and focusing
    setTimeout(() => {
      const newIndex = newAssets.length - 1;
      const newTickerInput = tickerRefs.current[newIndex];

      if (newTickerInput && assetCardsRef.current) {
        // Smooth scroll to the new asset card
        newTickerInput.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });

        // Focus on the new ticker input after a brief delay to ensure scroll completes
        setTimeout(() => {
          newTickerInput.focus();
        }, 300);
      }
    }, 100);
  }, [manualAssets, onUpdateAssets]);

  const removeAsset = useCallback(
    (index: number) => {
      onUpdateAssets(manualAssets.filter((_, i) => i !== index));
    },
    [manualAssets, onUpdateAssets]
  );

  const updateAsset = useCallback(
    (index: number, field: keyof PortfolioAsset, value: string | number) => {
      onUpdateAssets(
        manualAssets.map((asset, i) =>
          i === index ? { ...asset, [field]: value } : asset
        )
      );
    },
    [manualAssets, onUpdateAssets]
  );

  // Weight management helpers
  const normalizeWeights = useCallback(() => {
    const validAssets = manualAssets.filter(
      a => a.ticker.trim() && a.weight > 0
    );
    const total = validAssets.reduce((s, a) => s + a.weight, 0);
    if (total === 0) return;
    const scaled = manualAssets.map(a => {
      if (!a.ticker.trim() || a.weight <= 0) return { ...a, weight: 0 };
      return { ...a, weight: (a.weight / total) * 100 };
    });
    // Round to 1 decimal and fix rounding drift on the last valid asset
    const rounded = scaled.map(a => ({
      ...a,
      weight: Math.round(a.weight * 10) / 10,
    }));
    const drift =
      100 -
      rounded
        .filter(a => a.ticker.trim() && a.weight > 0)
        .reduce((s, a) => s + a.weight, 0);
    if (Math.abs(drift) > 0.0001) {
      for (let i = rounded.length - 1; i >= 0; i -= 1) {
        if (rounded[i].ticker.trim() && rounded[i].weight > 0) {
          rounded[i] = {
            ...rounded[i],
            weight: Math.round((rounded[i].weight + drift) * 10) / 10,
          };
          break;
        }
      }
    }
    onUpdateAssets(rounded);
  }, [manualAssets, onUpdateAssets]);

  const evenSplitWeights = useCallback(() => {
    const count = manualAssets.filter(a => a.ticker.trim()).length;
    if (count === 0) return;
    const base = Math.floor(1000 / count) / 10; // 1-dec place
    let remaining = Math.round(1000 - base * 10 * (count - 1)) / 10;
    const next = manualAssets.map(a => {
      if (!a.ticker.trim()) return { ...a, weight: 0 };
      const w = remaining !== null ? (remaining as number) : base;
      const assigned = remaining;
      remaining = base;
      return { ...a, weight: assigned };
    });
    onUpdateAssets(next);
  }, [manualAssets, onUpdateAssets]);

  const clearAllAssets = useCallback(() => {
    onUpdateAssets([{ ticker: '', weight: 0 }]);
  }, [onUpdateAssets]);

  const loadDemoETF = useCallback(() => {
    onUpdateAssets([
      { ticker: 'VTI', weight: 40 },
      { ticker: 'VXUS', weight: 20 },
      { ticker: 'BND', weight: 20 },
      { ticker: 'VNQ', weight: 10 },
      { ticker: 'GLD', weight: 5 },
      { ticker: 'TLT', weight: 5 },
    ]);
  }, [onUpdateAssets]);

  const loadDemoMutualFunds = useCallback(() => {
    onUpdateAssets([
      { ticker: 'VTSAX', weight: 50 },
      { ticker: 'VTIAX', weight: 20 },
      { ticker: 'VBTLX', weight: 20 },
      { ticker: 'VGSLX', weight: 10 },
    ]);
  }, [onUpdateAssets]);

  // Keyboard navigation & Enter-to-add
  const handleTickerKeyDown = useCallback(
    (
      index: number,
      asset: PortfolioAsset,
      e: React.KeyboardEvent<HTMLInputElement>
    ) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (asset.ticker.trim() && asset.weight > 0) {
          if (index === manualAssets.length - 1) {
            addAsset();
            setTimeout(() => {
              const nextEl = tickerRefs.current[index + 1];
              nextEl?.focus();
            }, 0);
          } else {
            weightRefs.current[index + 1]?.focus();
          }
        } else {
          weightRefs.current[index]?.focus();
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        tickerRefs.current[index + 1]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        tickerRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowRight') {
        // move to weight on same row
        if (
          (e.currentTarget.selectionStart || 0) === e.currentTarget.value.length
        ) {
          weightRefs.current[index]?.focus();
        }
      }
    },
    [addAsset, manualAssets.length]
  );

  const handleWeightKeyDown = useCallback(
    (
      index: number,
      asset: PortfolioAsset,
      e: React.KeyboardEvent<HTMLInputElement>
    ) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (asset.ticker.trim() && (asset.weight || 0) > 0) {
          if (index === manualAssets.length - 1) {
            addAsset();
            setTimeout(() => {
              const nextEl = tickerRefs.current[index + 1];
              nextEl?.focus();
            }, 0);
          } else {
            tickerRefs.current[index + 1]?.focus();
          }
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        weightRefs.current[index + 1]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        weightRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowLeft') {
        // move to ticker on same row when caret at start
        if ((e.currentTarget.selectionStart || 0) === 0) {
          tickerRefs.current[index]?.focus();
        }
      }
    },
    [addAsset, manualAssets.length]
  );

  const totalWeight = getTotalWeight();
  const isWeightValid = Math.abs(totalWeight - 100) <= 1;
  const hasAssets = manualAssets.some(a => a.ticker.trim() && a.weight > 0);

  return (
    <div className='space-y-6'>
      {/* Header with Total Weight Display */}
      <div className='bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 border border-slate-200'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg'>
              <Calculator className='h-5 w-5 text-blue-600' />
            </div>
            <h3 className='text-xl font-bold text-slate-800'>
              Portfolio Assets
            </h3>
          </div>
          <Button
            onClick={addAsset}
            size='sm'
            className='bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
          >
            <Plus className='h-4 w-4 mr-2' />
            Add Asset
          </Button>
        </div>

        {/* Enhanced Total Weight Display */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='bg-white rounded-lg p-4 border border-slate-200 shadow-sm'>
            <div className='flex items-center gap-2 mb-1'>
              <Target className='h-4 w-4 text-slate-600' />
              <span className='text-sm font-medium text-slate-600'>
                Total Weight
              </span>
            </div>
            <div
              className={`text-2xl font-bold ${getWeightColor(totalWeight)}`}
            >
              {totalWeight.toFixed(1)}%
            </div>
            <div className='text-xs text-slate-500 mt-1'>Target: 100%</div>
          </div>

          <div className='bg-white rounded-lg p-4 border border-slate-200 shadow-sm'>
            <div className='flex items-center gap-2 mb-1'>
              <Zap className='h-4 w-4 text-slate-600' />
              <span className='text-sm font-medium text-slate-600'>Assets</span>
            </div>
            <div className='text-2xl font-bold text-slate-800'>
              {manualAssets.filter(a => a.ticker.trim() && a.weight > 0).length}
            </div>
            <div className='text-xs text-slate-500 mt-1'>Active positions</div>
          </div>

          <div className='bg-white rounded-lg p-4 border border-slate-200 shadow-sm'>
            <div className='flex items-center gap-2 mb-1'>
              <CheckCircle className='h-4 w-4 text-slate-600' />
              <span className='text-sm font-medium text-slate-600'>Status</span>
            </div>
            <div className='text-lg font-bold'>
              {isWeightValid ? (
                <Badge className='bg-green-100 text-green-800 border-green-200'>
                  <CheckCircle className='h-3 w-3 mr-1' />
                  Ready
                </Badge>
              ) : hasAssets ? (
                <Badge className='bg-yellow-100 text-yellow-800 border-yellow-200'>
                  Needs Adjustment
                </Badge>
              ) : (
                <Badge className='bg-slate-100 text-slate-600 border-slate-200'>
                  No Assets
                </Badge>
              )}
            </div>
            <div className='text-xs text-slate-500 mt-1'>
              {isWeightValid
                ? 'Portfolio ready for analysis'
                : 'Adjust weights to 100%'}
            </div>
          </div>
        </div>

        {/* Weight Warning */}
        {hasAssets && !isWeightValid && (
          <div className='mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
            <div className='flex items-start gap-3'>
              <div className='flex items-center justify-center w-6 h-6 bg-yellow-100 rounded-full flex-shrink-0 mt-0.5'>
                <Target className='h-3 w-3 text-yellow-600' />
              </div>
              <div>
                <p className='font-medium text-yellow-800'>
                  Weights don't add up to 100%
                </p>
                <p className='text-sm text-yellow-700 mt-1'>
                  Current total: {totalWeight.toFixed(1)}%. Please adjust
                  weights to reach exactly 100%.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assets List */}
      <div className='space-y-4' ref={assetCardsRef}>
        <div className='flex items-center justify-between'>
          <h4 className='text-lg font-semibold text-slate-800'>
            Asset Positions
          </h4>
          <div className='text-sm text-slate-500'>
            {manualAssets.filter(a => a.ticker.trim() && a.weight > 0).length}{' '}
            of {manualAssets.length} assets
          </div>
        </div>

        <div className='space-y-3'>
          {manualAssets.map((asset, index) => (
            <div
              key={index}
              className='bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200'
            >
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-2'>
                    Ticker Symbol
                  </label>
                  <Input
                    placeholder='e.g., AAPL, SPY, VTI'
                    value={asset.ticker}
                    ref={el => {
                      tickerRefs.current[index] = el;
                    }}
                    onChange={e =>
                      updateAsset(index, 'ticker', e.target.value.toUpperCase())
                    }
                    onKeyDown={e => handleTickerKeyDown(index, asset, e)}
                    className='uppercase font-medium'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-2'>
                    Weight (%)
                  </label>
                  <div className='flex items-center gap-2'>
                    <Input
                      type='number'
                      placeholder='25.5'
                      value={asset.weight || ''}
                      ref={el => {
                        weightRefs.current[index] = el;
                      }}
                      onChange={e =>
                        updateAsset(
                          index,
                          'weight',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      onKeyDown={e => handleWeightKeyDown(index, asset, e)}
                      className='flex-1'
                      min='0'
                      max='100'
                      step='0.1'
                    />
                    <span className='text-sm text-slate-500 font-medium'>
                      %
                    </span>
                    {manualAssets.length > 1 && (
                      <Button
                        onClick={() => removeAsset(index)}
                        size='sm'
                        variant='ghost'
                        className='text-red-500 hover:text-red-700 hover:bg-red-50'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weight Management Tools */}
      <div className='bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200'>
        <h4 className='font-semibold text-blue-800 mb-4 flex items-center gap-2'>
          <Sparkles className='h-5 w-5 text-blue-600' />
          Portfolio Tools
        </h4>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='space-y-3'>
            <h5 className='text-sm font-medium text-blue-700'>
              Weight Management
            </h5>
            <div className='flex flex-wrap gap-2'>
              <Button
                size='sm'
                className='h-8 px-3 text-xs bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
                variant='outline'
                onClick={normalizeWeights}
              >
                Normalize to 100%
              </Button>
              <Button
                size='sm'
                className='h-8 px-3 text-xs bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
                variant='outline'
                onClick={evenSplitWeights}
              >
                Even Split
              </Button>
              <Button
                size='sm'
                className='h-8 px-3 text-xs bg-white border-red-200 text-red-700 hover:bg-red-50'
                variant='outline'
                onClick={clearAllAssets}
              >
                Clear All
              </Button>
            </div>
          </div>

          <div className='space-y-3'>
            <h5 className='text-sm font-medium text-blue-700'>
              Quick Templates
            </h5>
            <div className='flex flex-col gap-2'>
              <Button
                size='sm'
                className='h-8 px-3 text-xs bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
                variant='outline'
                onClick={loadDemoETF}
              >
                Load Diversified ETF Demo
              </Button>
              <Button
                size='sm'
                className='h-8 px-3 text-xs bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
                variant='outline'
                onClick={loadDemoMutualFunds}
              >
                Load Mutual Funds Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Common Assets */}
      <div className='bg-slate-50 rounded-xl p-6 border border-slate-200'>
        <h4 className='text-sm font-medium text-slate-700 mb-3'>
          Quick Add Common Assets
        </h4>
        <div className='flex flex-wrap gap-2'>
          {[
            { ticker: 'SPY', weight: 60 },
            { ticker: 'QQQ', weight: 30 },
            { ticker: 'BND', weight: 10 },
          ].map((quickAsset, index) => (
            <Button
              key={index}
              size='sm'
              variant='outline'
              onClick={() => {
                onUpdateAssets([quickAsset]);
              }}
              className='text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            >
              {quickAsset.ticker} ({quickAsset.weight}%)
            </Button>
          ))}
        </div>
      </div>

      {/* Manual Portfolio Validation */}
      {hasAssets && (
        <div className='flex gap-3'>
          <Button
            variant='outline'
            onClick={onValidate}
            className='flex items-center gap-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          >
            <CheckCircle className='h-4 w-4' />
            Validate Portfolio
            <ChevronDown className='h-4 w-4' />
          </Button>
        </div>
      )}
    </div>
  );
}
