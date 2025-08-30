import React, { useState, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Upload,
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
  Calculator,
  FileSpreadsheet,
  Edit3,
  Building2,
  ChevronDown,
  Shield,
  Lock,
  Link,
  Zap,
  Users,
  Database,
  Eye,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  predictVolatility,
  getSampleDownloadUrl,
  PredictionResult,
} from '@/lib/api';
import { validateCSVFile, CSVValidationResult } from '@/lib/csvValidator';
import {
  validateManualPortfolio,
  validateManualPortfolioWithAPI,
  ManualPortfolioValidationResult,
  PortfolioAsset,
} from '@/lib/portfolioValidator';
import PortfolioResults from './PortfolioResults';
import SnapTradeConnection from './SnapTradeConnection';
import AccountSelector from './AccountSelector';
import PositionExtractor from './PositionExtractor';
import ValidationResults from './ValidationResults';
import ManualPortfolioSection from './ManualPortfolioSection';

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
  const [validationResult, setValidationResult] = useState<
    CSVValidationResult | ManualPortfolioValidationResult | null
  >(null);
  const [showValidation, setShowValidation] = useState(false);
  const isPredictingRef = useRef(false);
  const lastPredictTimeRef = useRef(0);

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
  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setError(null);
    setResult(null);
    setValidationResult(null);
    setShowValidation(false);

    // Validate the file
    try {
      const validation = await validateCSVFile(file);
      setValidationResult(validation);

      if (validation.isValid) {
        // If validation passes, we can proceed
        setShowValidation(false);
      } else {
        // Show validation results for errors
        setShowValidation(true);
      }
    } catch (err) {
      setError('Error validating file. Please try again.');
      console.error('Validation error:', err);
    }
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

  const validateManualPortfolioLocal = useCallback(async () => {
    try {
      // Try API-based validation first
      return await validateManualPortfolioWithAPI(manualAssets);
    } catch (error) {
      console.warn(
        'API validation failed, falling back to local validation:',
        error
      );
      // Fall back to local validation if API fails
      return validateManualPortfolio(manualAssets);
    }
  }, [manualAssets]);

  const handleManualValidate = useCallback(async () => {
    const validation = await validateManualPortfolioLocal();
    setValidationResult(validation);
    setShowValidation(true);
  }, [validateManualPortfolioLocal]);

  // Prediction Handler
  const handlePredict = useCallback(async () => {
    const now = Date.now();

    // Prevent multiple calls within 2 seconds
    if (now - lastPredictTimeRef.current < 2000) {
      return;
    }

    if (isLoading || isPredictingRef.current) {
      return; // Prevent multiple simultaneous calls
    }

    lastPredictTimeRef.current = now;
    isPredictingRef.current = true;
    setIsLoading(true);
    setError(null);
    setShowValidation(false);

    try {
      let data: PredictionResult;

      if (activeTab === 'csv' && selectedFile) {
        // Check if validation passed before making API call
        if (validationResult && !validationResult.isValid) {
          setError('Please fix validation issues before proceeding');
          setIsLoading(false);
          return;
        }
        data = await predictVolatility(selectedFile);
      } else if (activeTab === 'manual') {
        const validation = await validateManualPortfolioLocal();
        if (!validation.isValid) {
          setError(validation.errors[0]?.message || 'Validation failed');
          setIsLoading(false);
          return;
        }

        // Convert manual assets to CSV format and send
        const csvContent = validation
          .parsedData!.assets.map(asset => `${asset.ticker},${asset.weight}`)
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
      isPredictingRef.current = false;
    }
  }, [
    isLoading,
    activeTab,
    selectedFile,
    validationResult,
    validateManualPortfolioLocal,
  ]);

  const handleValidationProceed = useCallback(() => {
    if (isLoading || isPredictingRef.current) return; // Prevent multiple calls while loading
    setShowValidation(false);
    // Add a small delay to prevent rapid successive clicks
    setTimeout(() => {
      handlePredict();
    }, 100);
  }, [isLoading, handlePredict]);

  const handleValidationClose = useCallback(() => {
    setShowValidation(false);
    setValidationResult(null);
    setSelectedFile(null); // Clear the selected file when validation is closed
  }, []);

  const handleShowValidation = useCallback(() => {
    setShowValidation(true);
    // Smooth scroll to validation results after a short delay to ensure they're rendered
    setTimeout(() => {
      const validationElement = document.querySelector(
        '[data-validation-results]'
      );
      if (validationElement) {
        validationElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 100);
  }, []);

  const handleManualEntry = useCallback((data: any) => {
    // Convert validation data to manual assets format
    const convertedAssets = data.assets.map((asset: any) => ({
      ticker: asset.ticker,
      weight: asset.weight,
    }));
    setManualAssets(convertedAssets);
    setActiveTab('manual');
    setShowValidation(false);
    setValidationResult(null);
  }, []);

  const downloadSample = useCallback(() => {
    const link = document.createElement('a');
    link.href = getSampleDownloadUrl();
    link.download = 'sample_portfolio.csv';
    link.click();
  }, []);

  const getTotalWeight = useCallback(() => {
    return manualAssets
      .filter(asset => asset.ticker.trim() && asset.weight > 0)
      .reduce((sum, asset) => sum + asset.weight, 0);
  }, [manualAssets]);

  const getWeightColor = useCallback((total: number) => {
    if (Math.abs(total - 100) <= 1) return 'text-green-600';
    if (total > 100) return 'text-red-600';
    return 'text-yellow-600';
  }, []);

  // Check if portfolio is ready for prediction
  const isPortfolioReady = () => {
    if (activeTab === 'csv') {
      return selectedFile && validationResult && validationResult.isValid;
    } else if (activeTab === 'manual') {
      const totalWeight = getTotalWeight();
      return totalWeight > 0 && Math.abs(totalWeight - 100) <= 1;
    }
    return false;
  };

  return (
    <div className='space-y-8'>
      {/* Enhanced Portfolio Input Section */}
      <div className='bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-slate-200 shadow-lg overflow-hidden'>
        <div className='bg-gradient-to-r from-slate-800 to-blue-800 text-white p-6'>
          <div className='flex items-center gap-3 mb-2'>
            <div className='flex items-center justify-center w-10 h-10 bg-white/20 rounded-lg'>
              <Calculator className='h-6 w-6' />
            </div>
            <h2 className='text-2xl font-bold'>Portfolio Input</h2>
          </div>
          <p className='text-slate-200 text-sm'>
            Choose your preferred method to input your portfolio data for
            volatility analysis
          </p>
        </div>

        <div className='p-6'>
          {/* Enhanced Tab Navigation */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className='w-full'
          >
            <TabsList className='grid w-full grid-cols-3 bg-slate-100 p-1 rounded-xl h-auto'>
              <TabsTrigger
                value='snaptrade'
                className='flex flex-col items-center gap-2 py-4 px-3 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 rounded-lg transition-all duration-200'
              >
                <div className='flex items-center gap-2'>
                  <Building2 className='h-5 w-5' />
                  <span className='font-semibold'>Easy Connection</span>
                </div>
                <span className='text-xs text-slate-600'>API Integration</span>
              </TabsTrigger>
              <TabsTrigger
                value='csv'
                className='flex flex-col items-center gap-2 py-4 px-3 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 rounded-lg transition-all duration-200'
              >
                <div className='flex items-center gap-2'>
                  <FileSpreadsheet className='h-5 w-5' />
                  <span className='font-semibold'>CSV Upload</span>
                </div>
                <span className='text-xs text-slate-600'>File Import</span>
              </TabsTrigger>
              <TabsTrigger
                value='manual'
                className='flex flex-col items-center gap-2 py-4 px-3 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 rounded-lg transition-all duration-200'
              >
                <div className='flex items-center gap-2'>
                  <Edit3 className='h-5 w-5' />
                  <span className='font-semibold'>Manual Entry</span>
                </div>
                <span className='text-xs text-slate-600'>Direct Input</span>
              </TabsTrigger>
            </TabsList>

            {/* Easy Connection (API) - Enhanced */}
            <TabsContent value='snaptrade' className='mt-6 min-h-[600px]'>
              <div className='space-y-6'>
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
                    <Alert className='border-green-200 bg-green-50'>
                      <CheckCircle className='h-4 w-4 text-green-600' />
                      <AlertDescription>
                        Your portfolio positions have been extracted and loaded
                        into the manual adjustment form. You can now review and
                        modify the data before running the volatility analysis.
                      </AlertDescription>
                    </Alert>
                    <Button
                      onClick={() => setActiveTab('manual')}
                      className='w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                      size='lg'
                    >
                      <Edit3 className='mr-2 h-4 w-4' />
                      Go to Manual Adjustment
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* CSV Upload Tab - Enhanced */}
            <TabsContent value='csv' className='mt-6 min-h-[600px]'>
              <div className='space-y-6'>
                {/* Enhanced Drag & Drop Area */}
                <div
                  className={`relative border-3 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                    isDragOver
                      ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                      : 'border-slate-300 hover:border-slate-400 bg-white'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className='absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl opacity-0 transition-opacity duration-300 pointer-events-none'></div>

                  <div className='relative z-10'>
                    <div className='flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full'>
                      <Upload className='h-8 w-8 text-blue-600' />
                    </div>

                    <h3 className='text-xl font-semibold mb-2 text-slate-800'>
                      Upload Your Portfolio CSV
                    </h3>
                    <p className='text-slate-600 mb-4'>
                      Drag and drop your CSV file here or click to browse
                    </p>

                    <div className='bg-blue-50 rounded-lg p-3 mb-4 inline-block'>
                      <p className='text-sm font-medium text-blue-800'>
                        Required columns:{' '}
                        <code className='bg-blue-100 px-2 py-1 rounded'>
                          Ticker, Weight
                        </code>
                      </p>
                    </div>

                    <input
                      type='file'
                      accept='.csv'
                      onChange={handleFileInput}
                      className='hidden'
                      id='file-input'
                    />
                    <label htmlFor='file-input'>
                      <Button
                        asChild
                        className='bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                      >
                        <span>
                          <FileText className='h-4 w-4 mr-2' />
                          Choose File
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>

                {/* File Status */}
                {selectedFile && (
                  <div className='p-4 bg-green-50 border border-green-200 rounded-xl'>
                    <div className='flex items-center gap-3'>
                      <div className='flex items-center justify-center w-10 h-10 bg-green-100 rounded-full'>
                        <CheckCircle className='h-5 w-5 text-green-600' />
                      </div>
                      <div>
                        <div className='font-semibold text-green-800'>
                          {selectedFile.name}
                        </div>
                        <div className='text-sm text-green-600'>
                          Size: {(selectedFile.size / 1024).toFixed(2)} KB
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Validation Actions */}
                {selectedFile && validationResult && (
                  <div className='flex gap-3'>
                    <Button
                      variant='outline'
                      onClick={handleShowValidation}
                      disabled={isLoading}
                      className='flex items-center gap-2'
                    >
                      <CheckCircle className='h-4 w-4' />
                      View Validation Details
                      <ChevronDown className='h-4 w-4' />
                    </Button>
                  </div>
                )}

                {/* Sample Download */}
                <div className='text-center'>
                  <Button
                    variant='outline'
                    onClick={downloadSample}
                    size='sm'
                    className='border-slate-300 hover:border-slate-400'
                  >
                    <Download className='h-4 w-4 mr-2' />
                    Download Sample Portfolio CSV
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Manual Entry Tab - Enhanced */}
            <TabsContent value='manual' className='mt-6 min-h-[600px]'>
              <div className='space-y-6'>
                <ManualPortfolioSection
                  manualAssets={manualAssets}
                  onUpdateAssets={setManualAssets}
                  onValidate={handleManualValidate}
                  getTotalWeight={getTotalWeight}
                  getWeightColor={getWeightColor}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Enhanced Predict Button */}
          {isPortfolioReady() && (
            <div className='mt-8 text-center'>
              <Button
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePredict();
                }}
                disabled={isLoading}
                size='lg'
                type='button'
                className='bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200'
              >
                {isLoading ? (
                  <>
                    <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3'></div>
                    Analyzing Portfolio...
                  </>
                ) : (
                  <>
                    <Sparkles className='mr-2 h-5 w-5' />
                    Predict Volatility
                    <ArrowRight className='ml-2 h-5 w-5' />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Loading State - Enhanced */}
      {isLoading && (
        <Card className='border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50'>
          <CardContent className='p-8'>
            <div className='text-center space-y-4'>
              <div className='flex items-center justify-center'>
                <div className='relative'>
                  <div className='animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600'></div>
                  <div className='absolute inset-0 rounded-full border-4 border-transparent border-t-blue-400 animate-ping'></div>
                </div>
              </div>
              <div>
                <h3 className='text-lg font-semibold text-slate-800 mb-2'>
                  Analyzing Your Portfolio
                </h3>
                <p className='text-slate-600'>
                  Processing your data and generating volatility forecast...
                </p>
              </div>
              <Progress value={undefined} className='w-full h-2' />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display - Enhanced */}
      {error && (
        <Alert variant='destructive' className='border-red-200 bg-red-50'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription className='font-medium'>{error}</AlertDescription>
        </Alert>
      )}

      {/* Validation Results */}
      {showValidation && validationResult && (
        <div data-validation-results>
          <ValidationResults
            result={validationResult}
            onClose={handleValidationClose}
            onProceed={handleValidationProceed}
            onManualEntry={handleManualEntry}
            isManualPortfolio={activeTab === 'manual'}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Results Display */}
      {result && <PortfolioResults result={result} />}
    </div>
  );
}
