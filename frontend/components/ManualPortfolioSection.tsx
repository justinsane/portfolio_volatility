import React, { useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Plus, Trash2, CheckCircle, ChevronDown } from 'lucide-react';
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

  const addAsset = useCallback(() => {
    onUpdateAssets([...manualAssets, { ticker: '', weight: 0 }]);
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

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Portfolio Assets</h3>
        <Button onClick={addAsset} size='sm' variant='outline'>
          <Plus className='h-4 w-4 mr-2' />
          Add Asset
        </Button>
      </div>

      <div className='space-y-3'>
        {manualAssets.map((asset, index) => (
          <div
            key={index}
            className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'
          >
            <div className='flex-1'>
              <Input
                placeholder='Ticker (e.g., AAPL)'
                value={asset.ticker}
                ref={el => {
                  tickerRefs.current[index] = el;
                }}
                onChange={e =>
                  updateAsset(index, 'ticker', e.target.value.toUpperCase())
                }
                onKeyDown={e => handleTickerKeyDown(index, asset, e)}
                className='mb-2'
              />
              <div className='flex items-center gap-2'>
                <Input
                  type='number'
                  placeholder='Weight %'
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
                <span className='text-sm text-gray-500'>%</span>
              </div>
            </div>
            {manualAssets.length > 1 && (
              <Button
                onClick={() => removeAsset(index)}
                size='sm'
                variant='ghost'
                className='text-red-500 hover:text-red-700'
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Weight Summary */}
      <div className='p-3 bg-blue-50 rounded-lg'>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium text-blue-800'>
            Total Weight:
          </span>
          <span
            className={`text-lg font-bold ${getWeightColor(getTotalWeight())}`}
          >
            {Math.round(getTotalWeight())}%
          </span>
        </div>
        {Math.abs(getTotalWeight() - 100) > 1 && (
          <p className='text-xs text-blue-600 mt-1'>
            Total weight should equal 100%
          </p>
        )}
        <div className='mt-3 space-y-2 sm:space-y-0'>
          <div className='flex flex-wrap gap-2'>
            <Button
              size='sm'
              className='h-7 px-2 text-xs'
              variant='outline'
              onClick={normalizeWeights}
            >
              Normalize to 100%
            </Button>
            <Button
              size='sm'
              className='h-7 px-2 text-xs'
              variant='outline'
              onClick={evenSplitWeights}
            >
              Even Split
            </Button>
            <Button
              size='sm'
              className='h-7 px-2 text-xs'
              variant='ghost'
              onClick={clearAllAssets}
            >
              Clear All
            </Button>
          </div>
          <div className='flex flex-col sm:flex-row gap-2'>
            <Button
              size='sm'
              className='h-7 px-2 text-xs w-full sm:w-auto'
              variant='secondary'
              onClick={loadDemoETF}
            >
              Load Diversified ETF Demo
            </Button>
            <Button
              size='sm'
              className='h-7 px-2 text-xs w-full sm:w-auto'
              variant='secondary'
              onClick={loadDemoMutualFunds}
            >
              Load Mutual Funds Demo
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Add Common Assets */}
      <div className='p-3 bg-gray-50 rounded-lg'>
        <h4 className='text-sm font-medium mb-2'>Quick Add Common Assets</h4>
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
              className='text-xs'
            >
              {quickAsset.ticker} ({quickAsset.weight}%)
            </Button>
          ))}
        </div>
      </div>

      {/* Manual Portfolio Validation */}
      {getTotalWeight() > 0 && (
        <div className='mt-4 flex gap-2'>
          <Button
            variant='outline'
            onClick={onValidate}
            className='flex items-center gap-2'
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

