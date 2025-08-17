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

  // Prediction Handler
  const handlePredict = async () => {
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
    }
  };

  const handleValidationProceed = () => {
    setShowValidation(false);
    handlePredict();
  };

  const handleValidationClose = () => {
    setShowValidation(false);
    setValidationResult(null);
    setSelectedFile(null); // Clear the selected file when validation is closed
  };

  const handleShowValidation = () => {
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
  };

  const handleManualEntry = (data: any) => {
    // Convert validation data to manual assets format
    const convertedAssets = data.assets.map((asset: any) => ({
      ticker: asset.ticker,
      weight: asset.weight,
    }));
    setManualAssets(convertedAssets);
    setActiveTab('manual');
    setShowValidation(false);
    setValidationResult(null);
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
                Easy Connection (API)
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

            {/* Easy Connection (API) */}
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

              {selectedFile && validationResult && validationResult.isValid && (
                <div className='mt-4 flex gap-2'>
                  <Button onClick={handlePredict} disabled={isLoading}>
                    {isLoading ? 'Analyzing...' : 'Predict Volatility'}
                  </Button>
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

              {selectedFile &&
                validationResult &&
                !validationResult.isValid && (
                  <div className='mt-4 flex gap-2'>
                    <Button
                      variant='outline'
                      onClick={handleShowValidation}
                      disabled={isLoading}
                      className='flex items-center gap-2 bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                    >
                      <AlertCircle className='h-4 w-4' />
                      View Validation Issues
                      <ChevronDown className='h-4 w-4' />
                    </Button>
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
              <ManualPortfolioSection
                manualAssets={manualAssets}
                onUpdateAssets={setManualAssets}
                onValidate={async () => {
                  const validation = await validateManualPortfolioLocal();
                  setValidationResult(validation);
                  setShowValidation(true);
                }}
                getTotalWeight={getTotalWeight}
                getWeightColor={getWeightColor}
              />
            </TabsContent>
          </Tabs>

          {/* Predict Button */}
          {((activeTab === 'csv' &&
            selectedFile &&
            validationResult &&
            validationResult.isValid) ||
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

      {/* Validation Results */}
      {showValidation && validationResult && (
        <div data-validation-results>
          <ValidationResults
            result={validationResult}
            onClose={handleValidationClose}
            onProceed={handleValidationProceed}
            onManualEntry={handleManualEntry}
            isManualPortfolio={activeTab === 'manual'}
          />
        </div>
      )}

      {/* Results Display */}
      {result && <PortfolioResults result={result} />}
    </div>
  );
}
