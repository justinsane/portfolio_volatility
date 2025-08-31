import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  X,
  Save,
  RotateCcw,
} from 'lucide-react';

interface PortfolioAsset {
  ticker: string;
  weight: number;
  originalWeight?: string;
}

interface ManualPortfolioEntryProps {
  initialData?: {
    assets: PortfolioAsset[];
    totalWeight: number;
    unknownSymbols: string[];
  };
  onSave: (data: PortfolioAsset[]) => void;
  onCancel: () => void;
}

export default function ManualPortfolioEntry({
  initialData,
  onSave,
  onCancel,
}: ManualPortfolioEntryProps) {
  const [assets, setAssets] = useState<PortfolioAsset[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      setAssets(initialData.assets);
    } else {
      setAssets([{ ticker: '', weight: 0 }]);
    }
  }, [initialData]);

  const addAsset = () => {
    setAssets([...assets, { ticker: '', weight: 0 }]);
  };

  const removeAsset = (index: number) => {
    if (assets.length > 1) {
      setAssets(assets.filter((_, i) => i !== index));
    }
  };

  const updateAsset = (
    index: number,
    field: 'ticker' | 'weight',
    value: string | number
  ) => {
    const newAssets = [...assets];
    newAssets[index] = { ...newAssets[index], [field]: value };
    setAssets(newAssets);
  };

  const validatePortfolio = (): string[] => {
    const newErrors: string[] = [];

    // Check for empty tickers
    const emptyTickers = assets.filter(asset => !asset.ticker.trim());
    if (emptyTickers.length > 0) {
      newErrors.push('All tickers must be filled in');
    }

    // Check for duplicate tickers
    const tickers = assets.map(asset => asset.ticker.trim().toUpperCase());
    const duplicates = tickers.filter(
      (ticker, index) => tickers.indexOf(ticker) !== index
    );
    if (duplicates.length > 0) {
      newErrors.push('Duplicate tickers found');
    }

    // Check for invalid weights
    const invalidWeights = assets.filter(
      asset => asset.weight < 0 || asset.weight > 100
    );
    if (invalidWeights.length > 0) {
      newErrors.push('Weights must be between 0% and 100%');
    }

    // Check total weight
    const totalWeight = assets.reduce((sum, asset) => sum + asset.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      newErrors.push(
        `Total weight is ${totalWeight.toFixed(2)}%. It should be 100%.`
      );
    }

    return newErrors;
  };

  const handleSave = () => {
    const validationErrors = validatePortfolio();
    setErrors(validationErrors);

    if (validationErrors.length === 0) {
      onSave(assets);
    }
  };

  const resetToOriginal = () => {
    if (initialData) {
      setAssets(initialData.assets);
      setErrors([]);
    }
  };

  const totalWeight = assets.reduce((sum, asset) => sum + asset.weight, 0);
  const hasWarnings = Math.abs(totalWeight - 100) > 0.01;

  return (
    <Card className='w-full max-w-4xl mx-auto'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <CheckCircle className='h-5 w-5 text-blue-600' />
            Manual Portfolio Entry
          </CardTitle>
          <Button
            variant='ghost'
            size='sm'
            onClick={onCancel}
            className='h-8 w-8 p-0'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
        <p className='text-sm text-gray-600'>
          Edit your portfolio data below. Make sure all weights add up to 100%.
        </p>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Portfolio Summary */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          <div className='p-3 bg-gray-50 rounded-lg'>
            <div className='text-sm text-gray-600'>Total Assets</div>
            <div className='text-xl font-bold text-gray-900'>
              {assets.length}
            </div>
          </div>
          <div className='p-3 bg-gray-50 rounded-lg'>
            <div className='text-sm text-gray-600'>Total Weight</div>
            <div
              className={`text-xl font-bold ${
                hasWarnings ? 'text-yellow-600' : 'text-green-600'
              }`}
            >
              {totalWeight.toFixed(2)}%
            </div>
          </div>
          <div className='p-3 bg-gray-50 rounded-lg'>
            <div className='text-sm text-gray-600'>Status</div>
            <div className='text-xl font-bold'>
              {hasWarnings ? (
                <Badge
                  variant='secondary'
                  className='bg-yellow-100 text-yellow-800'
                >
                  Needs Adjustment
                </Badge>
              ) : (
                <Badge
                  variant='secondary'
                  className='bg-green-100 text-green-800'
                >
                  Ready
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Weight Warning - Mobile Optimized */}
        {hasWarnings && (
          <Alert className='border-yellow-200 bg-yellow-50 p-3 sm:p-4'>
            <AlertTriangle className='h-4 w-4 text-yellow-600' />
            <AlertDescription className='text-sm sm:text-base'>
              <strong>Weights don&apos;t add up to 100%</strong>
              <br />
              Current total: {totalWeight.toFixed(2)}%. Please adjust weights to
              reach exactly 100%.
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Errors */}
        {errors.length > 0 && (
          <Alert variant='destructive'>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>
              <div className='space-y-1'>
                {errors.map((error, index) => (
                  <div key={index} className='font-medium'>
                    • {error}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Assets List */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold'>Portfolio Assets</h3>
            <Button
              variant='outline'
              size='sm'
              onClick={addAsset}
              className='flex items-center gap-2'
            >
              <Plus className='h-4 w-4' />
              Add Asset
            </Button>
          </div>

          <div className='space-y-3'>
            {assets.map((asset, index) => (
              <div
                key={index}
                className='flex items-center gap-3 p-3 border rounded-lg'
              >
                <div className='flex-1'>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Ticker {index + 1}
                  </label>
                  <Input
                    type='text'
                    value={asset.ticker}
                    onChange={e =>
                      updateAsset(index, 'ticker', e.target.value.toUpperCase())
                    }
                    placeholder='e.g., AAPL'
                    className='uppercase'
                  />
                </div>
                <div className='flex-1'>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Weight (%)
                  </label>
                  <Input
                    type='number'
                    value={asset.weight || ''}
                    onChange={e =>
                      updateAsset(
                        index,
                        'weight',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder='25.5'
                    min='0'
                    max='100'
                    step='0.1'
                  />
                </div>
                <div className='flex items-end'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => removeAsset(index)}
                    disabled={assets.length === 1}
                    className='h-11 w-11 sm:h-10 sm:w-10 p-0 text-red-600 hover:text-red-700'
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex flex-col sm:flex-row gap-3 pt-4 border-t'>
          {initialData && (
            <Button
              variant='outline'
              onClick={resetToOriginal}
              className='flex items-center gap-2'
            >
              <RotateCcw className='h-4 w-4' />
              Reset to Original
            </Button>
          )}

          <Button
            variant='ghost'
            onClick={onCancel}
            className='flex items-center gap-2'
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            disabled={errors.length > 0 || hasWarnings}
            className='flex items-center gap-2 ml-auto'
          >
            <Save className='h-4 w-4' />
            Save & Continue
          </Button>
        </div>

        {/* Help Text */}
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <div className='text-sm text-blue-700 space-y-1'>
            <p>
              <strong>Tips:</strong>
            </p>
            <p>• Enter stock symbols in uppercase (e.g., AAPL, SPY, VTI)</p>
            <p>• Weights must add up to exactly 100%</p>
            <p>• You can use decimal values (e.g., 25.5 for 25.5%)</p>
            <p>• Each ticker should appear only once</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
