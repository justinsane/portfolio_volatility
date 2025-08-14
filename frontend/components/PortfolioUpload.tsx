import React, { useState, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Upload,
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  Calculator,
  FileSpreadsheet,
  Edit3,
  Building2,
} from 'lucide-react';
import {
  predictVolatility,
  getSampleDownloadUrl,
  PredictionResult,
} from '@/lib/api';
import PortfolioResults from './PortfolioResults';
import SnapTradeConnection from './SnapTradeConnection';
import AccountSelector from './AccountSelector';
import PositionExtractor from './PositionExtractor';

interface PortfolioAsset {
  ticker: string;
  weight: number;
}

interface ValidationResult {
  isValid: boolean;
  error: string;
  assets?: PortfolioAsset[];
}

export default function PortfolioUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [manualAssets, setManualAssets] = useState<PortfolioAsset[]>([
    { ticker: '', weight: 0 },
  ]);
  const [activeTab, setActiveTab] = useState('snaptrade');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const tickerRefs = useRef<Array<HTMLInputElement | null>>([]);
  const weightRefs = useRef<Array<HTMLInputElement | null>>([]);

  // SnapTrade state
  const [snapTradeStep, setSnapTradeStep] = useState<
    'connection' | 'account' | 'positions' | 'manual'
  >('connection');
  const [snapTradeUserData, setSnapTradeUserData] = useState<{
    userId: string;
    userSecret: string;
  } | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // CSV Upload Handlers
  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }
    setSelectedFile(file);
    setError(null);
    setResult(null);
  }, []);

  const handleFileInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragOver(false);

      const files = event.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  // Manual Entry Handlers
  const addAsset = useCallback(() => {
    setManualAssets(prev => [...prev, { ticker: '', weight: 0 }]);
  }, []);

  // SnapTrade Handlers
  const handleSnapTradeConnectionSuccess = useCallback(
    (userData: { userId: string; userSecret: string }) => {
      setSnapTradeUserData(userData);
      setSnapTradeStep('account');
      setError(null);
    },
    []
  );

  const handleSnapTradeError = useCallback((error: string) => {
    setError(error);
  }, []);

  const handleAccountSelect = useCallback((accountId: string) => {
    setSelectedAccountId(accountId);
    setSnapTradeStep('positions');
  }, []);

  const handlePositionsExtracted = useCallback(
    (portfolioAssets: Array<{ Ticker: string; Weight: number }>) => {
      // Convert to manual assets format and populate the manual entry form
      const convertedAssets = portfolioAssets.map(asset => ({
        ticker: asset.Ticker,
        weight: asset.Weight,
      }));
      setManualAssets(convertedAssets);
      setSnapTradeStep('manual');
      setActiveTab('manual');
    },
    []
  );

  const removeAsset = useCallback((index: number) => {
    setManualAssets(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateAsset = useCallback(
    (index: number, field: keyof PortfolioAsset, value: string | number) => {
      setManualAssets(prev =>
        prev.map((asset, i) =>
          i === index ? { ...asset, [field]: value } : asset
        )
      );
    },
    []
  );

  const validateManualPortfolio = useCallback((): ValidationResult => {
    const validAssets = manualAssets.filter(
      asset => asset.ticker.trim() && asset.weight > 0
    );

    if (validAssets.length === 0) {
      return { isValid: false, error: 'Please add at least one asset' };
    }

    const totalWeight = validAssets.reduce(
      (sum, asset) => sum + asset.weight,
      0
    );

    if (Math.abs(totalWeight - 100) > 1) {
      return {
        isValid: false,
        error: `Total weight must equal 100%. Current total: ${totalWeight.toFixed(
          1
        )}%`,
      };
    }

    return { isValid: true, assets: validAssets, error: '' };
  }, [manualAssets]);

  // Helpers: weights management
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
    setManualAssets(rounded);
  }, [manualAssets]);

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
    setManualAssets(next);
  }, [manualAssets]);

  const clearAllAssets = useCallback(() => {
    setManualAssets([{ ticker: '', weight: 0 }]);
  }, []);

  const loadDemoETF = useCallback(() => {
    setManualAssets([
      { ticker: 'VTI', weight: 40 },
      { ticker: 'VXUS', weight: 20 },
      { ticker: 'BND', weight: 20 },
      { ticker: 'VNQ', weight: 10 },
      { ticker: 'GLD', weight: 5 },
      { ticker: 'TLT', weight: 5 },
    ]);
  }, []);

  const loadDemoMutualFunds = useCallback(() => {
    setManualAssets([
      { ticker: 'VTSAX', weight: 50 },
      { ticker: 'VTIAX', weight: 20 },
      { ticker: 'VBTLX', weight: 20 },
      { ticker: 'VGSLX', weight: 10 },
    ]);
  }, []);

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

  // Prediction Handler
  const handlePredict = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let data: PredictionResult;

      if (activeTab === 'csv' && selectedFile) {
        data = await predictVolatility(selectedFile);
      } else if (activeTab === 'manual') {
        const validation = validateManualPortfolio();
        if (!validation.isValid) {
          setError(validation.error || 'Validation failed');
          setIsLoading(false);
          return;
        }

        // Convert manual assets to CSV format and send
        const csvContent = validation
          .assets!.map(asset => `${asset.ticker},${asset.weight}`)
          .join('\n');

        const csvBlob = new Blob([`Ticker,Weight\n${csvContent}`], {
          type: 'text/csv',
        });

        const csvFile = new File([csvBlob], 'manual_portfolio.csv', {
          type: 'text/csv',
        });

        data = await predictVolatility(csvFile);
      } else {
        setError('Please provide portfolio data');
        setIsLoading(false);
        return;
      }

      setResult(data);
    } catch (err) {
      console.error('Prediction error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadSample = () => {
    const link = document.createElement('a');
    link.href = getSampleDownloadUrl();
    link.download = 'sample_portfolio.csv';
    link.click();
  };

  const getTotalWeight = () => {
    return manualAssets
      .filter(asset => asset.ticker.trim() && asset.weight > 0)
      .reduce((sum, asset) => sum + asset.weight, 0);
  };

  const getWeightColor = (total: number) => {
    if (Math.abs(total - 100) <= 1) return 'text-green-600';
    if (total > 100) return 'text-red-600';
    return 'text-yellow-600';
  };

  return (
    <div className='space-y-6'>
      {/* Portfolio Upload Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Calculator className='h-5 w-5' />
            Portfolio Input
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className='w-full'
          >
            <TabsList className='flex flex-col sm:flex-row w-full gap-1'>
              <TabsTrigger
                value='snaptrade'
                className='flex items-center justify-center gap-2 py-3 sm:py-1.5 text-sm w-full sm:w-auto'
              >
                <Building2 className='h-4 w-4' />
                SnapTrade
              </TabsTrigger>
              <TabsTrigger
                value='csv'
                className='flex items-center justify-center gap-2 py-3 sm:py-1.5 text-sm w-full sm:w-auto'
              >
                <FileSpreadsheet className='h-4 w-4' />
                CSV Upload
              </TabsTrigger>
              <TabsTrigger
                value='manual'
                className='flex items-center justify-center gap-2 py-3 sm:py-1.5 text-sm w-full sm:w-auto'
              >
                <Edit3 className='h-4 w-4' />
                Manual Entry
              </TabsTrigger>
            </TabsList>

            {/* SnapTrade Tab */}
            <TabsContent value='snaptrade' className='space-y-4'>
              {snapTradeStep === 'connection' && (
                <SnapTradeConnection
                  onConnectionSuccess={handleSnapTradeConnectionSuccess}
                  onError={handleSnapTradeError}
                />
              )}

              {snapTradeStep === 'account' && snapTradeUserData && (
                <AccountSelector
                  userData={snapTradeUserData}
                  onAccountSelect={handleAccountSelect}
                  onError={handleSnapTradeError}
                />
              )}

              {snapTradeStep === 'positions' &&
                snapTradeUserData &&
                selectedAccountId && (
                  <PositionExtractor
                    userData={snapTradeUserData}
                    accountId={selectedAccountId}
                    onPositionsExtracted={handlePositionsExtracted}
                    onError={handleSnapTradeError}
                  />
                )}

              {snapTradeStep === 'manual' && (
                <div className='space-y-4'>
                  <Alert>
                    <CheckCircle className='h-4 w-4' />
                    <AlertDescription>
                      Your portfolio positions have been extracted and loaded
                      into the manual adjustment form. You can now review and
                      modify the data before running the volatility analysis.
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={() => setActiveTab('manual')}
                    className='w-full'
                    size='lg'
                  >
                    <Edit3 className='mr-2 h-4 w-4' />
                    Go to Manual Adjustment
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* CSV Upload Tab */}
            <TabsContent value='csv' className='space-y-4'>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className='h-12 w-12 mx-auto mb-4 text-gray-400' />
                <p className='text-lg font-medium mb-2'>
                  Drag and drop your CSV file here
                </p>
                <p className='text-sm text-gray-600 mb-4'>or click to browse</p>
                <p className='text-xs text-gray-500 mb-4'>
                  Required columns: Ticker, Weight
                </p>

                <input
                  type='file'
                  accept='.csv'
                  onChange={handleFileInput}
                  className='hidden'
                  id='file-input'
                />
                <label htmlFor='file-input'>
                  <Button asChild>
                    <span>
                      <FileText className='h-4 w-4 mr-2' />
                      Choose File
                    </span>
                  </Button>
                </label>
              </div>

              {selectedFile && (
                <div className='p-3 bg-green-50 border border-green-200 rounded-lg'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle className='h-4 w-4 text-green-600' />
                    <span className='text-sm font-medium text-green-800'>
                      Selected: {selectedFile.name}
                    </span>
                  </div>
                  <p className='text-xs text-green-600 mt-1'>
                    Size: {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}

              <div className='text-center'>
                <Button variant='outline' onClick={downloadSample} size='sm'>
                  <Download className='h-4 w-4 mr-2' />
                  Download Sample Portfolio CSV
                </Button>
              </div>
            </TabsContent>

            {/* Manual Entry Tab */}
            <TabsContent value='manual' className='space-y-4'>
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
                            updateAsset(
                              index,
                              'ticker',
                              e.target.value.toUpperCase()
                            )
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
                            onKeyDown={e =>
                              handleWeightKeyDown(index, asset, e)
                            }
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
                      className={`text-lg font-bold ${getWeightColor(
                        getTotalWeight()
                      )}`}
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
                  <h4 className='text-sm font-medium mb-2'>
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
                          setManualAssets([quickAsset]);
                        }}
                        className='text-xs'
                      >
                        {quickAsset.ticker} ({quickAsset.weight}%)
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Predict Button */}
          {((activeTab === 'csv' && selectedFile) ||
            (activeTab === 'manual' && getTotalWeight() > 0)) && (
            <div className='mt-6 text-center'>
              <Button onClick={handlePredict} disabled={isLoading} size='lg'>
                {isLoading ? 'Analyzing...' : 'Predict Volatility'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className='p-6'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
              <p className='text-gray-600'>
                Analyzing portfolio and generating forecast...
              </p>
              <Progress value={undefined} className='mt-4' />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Display */}
      {result && <PortfolioResults result={result} />}
    </div>
  );
}
