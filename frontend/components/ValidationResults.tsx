import React from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  Download,
  FileText,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import {
  CSVValidationResult,
  ValidationError,
  ValidationWarning,
  getValidationSummary,
} from '@/lib/csvValidator';
import {
  ManualPortfolioValidationResult,
  getPortfolioValidationSummary,
} from '@/lib/portfolioValidator';
import { getSampleDownloadUrl } from '@/lib/api';

interface ValidationResultsProps {
  result: CSVValidationResult | ManualPortfolioValidationResult;
  onClose?: () => void;
  onProceed?: () => void;
  onManualEntry?: (data: any) => void;
  isManualPortfolio?: boolean;
}

export default function ValidationResults({
  result,
  onClose,
  onProceed,
  onManualEntry,
  isManualPortfolio = false,
}: ValidationResultsProps) {
  const summary = isManualPortfolio
    ? getPortfolioValidationSummary(result)
    : getValidationSummary(result);

  const getIcon = (type: 'success' | 'warning' | 'error') => {
    switch (type) {
      case 'success':
        return <CheckCircle className='h-5 w-5 text-green-600' />;
      case 'warning':
        return <AlertTriangle className='h-5 w-5 text-yellow-600' />;
      case 'error':
        return <AlertCircle className='h-5 w-5 text-red-600' />;
    }
  };

  const downloadSample = () => {
    const link = document.createElement('a');
    link.href = getSampleDownloadUrl();
    link.download = 'sample_portfolio.csv';
    link.click();
  };

  const handleManualEntry = () => {
    if (result.parsedData && onManualEntry) {
      // Convert parsed data to format expected by manual entry
      const manualData = {
        assets: result.parsedData.assets.map(asset => ({
          ticker: asset.ticker,
          weight: asset.weight,
          originalWeight: asset.originalWeight,
        })),
        totalWeight: result.parsedData.totalWeight,
        unknownSymbols: result.parsedData.unknownSymbols,
      };
      onManualEntry(manualData);
    }
  };

  const handleEditPortfolio = () => {
    if (result.parsedData && onManualEntry) {
      // For manual portfolio validation, this allows editing the current portfolio
      const manualData = {
        assets: result.parsedData.assets.map(asset => ({
          ticker: asset.ticker,
          weight: asset.weight,
          originalWeight: asset.originalWeight,
        })),
        totalWeight: result.parsedData.totalWeight,
        unknownSymbols: result.parsedData.unknownSymbols,
      };
      onManualEntry(manualData);
    }
  };

  return (
    <Card className='w-full max-w-4xl mx-auto'>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-lg'>
            {getIcon(summary.type)}
            {summary.title}
          </CardTitle>
          {onClose && (
            <Button
              variant='ghost'
              size='sm'
              onClick={onClose}
              className='h-8 w-8 p-0'
            >
              <X className='h-4 w-4' />
            </Button>
          )}
        </div>
        <p className='text-sm text-gray-600'>{summary.message}</p>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Errors Section */}
        {result.errors.length > 0 && (
          <div className='space-y-3'>
            <h3 className='text-lg font-semibold text-red-700 flex items-center gap-2'>
              <AlertCircle className='h-5 w-5' />
              Errors ({result.errors.length})
            </h3>
            <div className='space-y-3'>
              {result.errors.map((error, index) => (
                <Alert
                  key={index}
                  variant='destructive'
                  className='border-red-200 bg-red-50'
                >
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription className='space-y-2'>
                    <div className='font-semibold'>{error.message}</div>
                    {error.details && (
                      <div className='text-sm opacity-90'>{error.details}</div>
                    )}
                    {error.suggestion && (
                      <div className='text-sm font-medium text-red-800 bg-red-100 p-2 rounded'>
                        💡 {error.suggestion}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Warnings Section */}
        {result.warnings.length > 0 && (
          <div className='space-y-3'>
            <h3 className='text-lg font-semibold text-yellow-700 flex items-center gap-2'>
              <AlertTriangle className='h-5 w-5' />
              Warnings ({result.warnings.length})
            </h3>
            <div className='space-y-3'>
              {result.warnings.map((warning, index) => (
                <Alert key={index} className='border-yellow-200 bg-yellow-50'>
                  <AlertTriangle className='h-4 w-4 text-yellow-600' />
                  <AlertDescription className='space-y-2'>
                    <div className='font-semibold text-yellow-800'>
                      {warning.message}
                    </div>
                    {warning.details && (
                      <div className='text-sm text-yellow-700'>
                        {warning.details}
                      </div>
                    )}
                    {warning.suggestion && (
                      <div className='text-sm font-medium text-yellow-800 bg-yellow-100 p-2 rounded'>
                        💡 {warning.suggestion}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio Summary */}
        {result.parsedData && (
          <div className='space-y-3'>
            <h3 className='text-lg font-semibold text-gray-700 flex items-center gap-2'>
              <FileText className='h-5 w-5' />
              Portfolio Summary
            </h3>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
              <div className='p-3 bg-gray-50 rounded-lg'>
                <div className='text-sm text-gray-600'>Total Assets</div>
                <div className='text-xl font-bold text-gray-900'>
                  {result.parsedData.assets.length}
                </div>
              </div>
              <div className='p-3 bg-gray-50 rounded-lg'>
                <div className='text-sm text-gray-600'>Total Weight</div>
                <div className='text-xl font-bold text-gray-900'>
                  {result.parsedData.totalWeight.toFixed(2)}%
                </div>
              </div>
              <div className='p-3 bg-gray-50 rounded-lg'>
                <div className='text-sm text-gray-600'>Known Symbols</div>
                <div className='text-xl font-bold text-green-600'>
                  {result.parsedData.knownSymbols.length}
                </div>
              </div>
              <div className='p-3 bg-gray-50 rounded-lg'>
                <div className='text-sm text-gray-600'>Unknown Symbols</div>
                <div className='text-xl font-bold text-yellow-600'>
                  {result.parsedData.unknownSymbols.length}
                </div>
              </div>
            </div>

            {/* Asset List */}
            <div className='mt-4'>
              <h4 className='text-md font-semibold text-gray-700 mb-3'>
                Assets
              </h4>
              <div className='max-h-60 overflow-y-auto border rounded-lg'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3'>
                  {result.parsedData.assets.map((asset, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-2 bg-white border rounded'
                    >
                      <div className='flex items-center gap-2'>
                        <span className='font-medium text-sm'>
                          {asset.ticker}
                        </span>
                        {result.parsedData!.unknownSymbols.includes(
                          asset.ticker
                        ) && (
                          <Badge variant='secondary' className='text-xs'>
                            Unknown
                          </Badge>
                        )}
                      </div>
                      <span className='text-sm text-gray-600'>
                        {asset.weight.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className='pt-4 border-t'>
          {/* Primary Action Row - Proceed Button */}
          {result.isValid && onProceed && (
            <div className='flex justify-center mb-4'>
              <Button
                onClick={onProceed}
                className='flex items-center gap-2 w-full sm:w-auto px-8'
              >
                <ExternalLink className='h-4 w-4' />
                Proceed with Analysis
              </Button>
            </div>
          )}

          {/* Secondary Actions Row */}
          <div className='flex flex-col sm:flex-row gap-3 justify-center sm:justify-start'>
            {/* Download Sample Button */}
            <Button
              variant='outline'
              onClick={downloadSample}
              className='flex items-center gap-2'
            >
              <Download className='h-4 w-4' />
              Download Sample CSV
            </Button>

            {/* Manual Entry Button - Show if weights don't add to 100% */}
            {result.parsedData &&
              Math.abs(result.parsedData.totalWeight - 100) > 0.01 &&
              onManualEntry &&
              !isManualPortfolio && (
                <Button
                  variant='outline'
                  onClick={handleManualEntry}
                  className='flex items-center gap-2'
                >
                  <HelpCircle className='h-4 w-4' />
                  Continue with Manual Entry
                </Button>
              )}

            {/* Edit Portfolio Button - For manual portfolio validation */}
            {isManualPortfolio && onManualEntry && (
              <Button
                variant='outline'
                onClick={handleEditPortfolio}
                className='flex items-center gap-2'
              >
                <HelpCircle className='h-4 w-4' />
                Edit Portfolio
              </Button>
            )}

            {/* Close Button */}
            {onClose && (
              <Button
                variant='ghost'
                onClick={onClose}
                className='flex items-center gap-2'
              >
                Close
              </Button>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <div className='flex items-start gap-3'>
            <Info className='h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0' />
            <div className='space-y-2'>
              <h4 className='font-semibold text-blue-800'>Need Help?</h4>
              <div className='text-sm text-blue-700 space-y-1'>
                {isManualPortfolio ? (
                  <>
                    <p>
                      • Enter stock symbols in uppercase (e.g., AAPL, SPY, VTI)
                    </p>
                    <p>• Weights should be numbers (e.g., 25.5 for 25.5%)</p>
                    <p>• Each ticker should appear only once</p>
                    <p>• Weights should ideally add up to 100%</p>
                    <p>
                      • Use the weight adjustment tools to normalize your
                      portfolio
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      • Your CSV should have exactly two columns:{' '}
                      <code className='bg-blue-100 px-1 rounded'>Ticker</code>{' '}
                      and{' '}
                      <code className='bg-blue-100 px-1 rounded'>Weight</code>
                    </p>
                    <p>• Weights should be numbers (e.g., 25.5 for 25.5%)</p>
                    <p>• Each ticker should appear only once</p>
                    <p>• Weights should ideally add up to 100%</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
