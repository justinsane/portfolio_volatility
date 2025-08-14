import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  Calculator,
  ArrowRight,
} from 'lucide-react';

interface PositionExtractorProps {
  userData: { userId: string; userSecret: string };
  accountId: string;
  onPositionsExtracted: (
    portfolioAssets: Array<{ Ticker: string; Weight: number }>
  ) => void;
  onError: (error: string) => void;
}

interface Position {
  symbol: string;
  quantity: number;
  price: number;
  securityType: string;
}

interface PortfolioAsset {
  Ticker: string;
  Weight: number;
  Quantity: number;
  Price: number;
  MarketValue: number;
  AssetType: string;
}

export default function PositionExtractor({
  userData,
  accountId,
  onPositionsExtracted,
  onError,
}: PositionExtractorProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [portfolioAssets, setPortfolioAssets] = useState<PortfolioAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Fetch positions from SnapTrade
  const fetchPositions = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Fetching positions for account:', accountId);
      console.log('User data:', userData);

      // First refresh holdings to get latest data
      console.log('Refreshing holdings...');
      const refreshResponse = await fetch('/api/snaptrade/refresh-holdings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userData.userId,
          user_secret: userData.userSecret,
          account_id: accountId,
        }),
      });

      console.log('Refresh holdings response status:', refreshResponse.status);
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        console.log('Refresh holdings response:', refreshData);

        // Add a small delay to ensure refresh completes
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Then fetch positions
      console.log('Fetching positions...');
      const response = await fetch('/api/snaptrade/positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userData.userId,
          user_secret: userData.userSecret,
          account_id: accountId,
        }),
      });

      console.log('Positions API response status:', response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Positions API response data:', data);

      if (data.success) {
        console.log('Raw positions:', data.positions);
        console.log('Portfolio assets:', data.portfolio_assets);
        setPositions(data.positions || []);
        setPortfolioAssets(data.portfolio_assets || []);
      } else {
        throw new Error(data.error || 'Failed to fetch positions');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch positions';
      console.error('Error fetching positions:', err);
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load positions on component mount
  useEffect(() => {
    fetchPositions();
  }, [userData, accountId]);

  const handleContinue = () => {
    if (portfolioAssets.length > 0) {
      // Convert to the format expected by the manual adjustment component
      const formattedAssets = portfolioAssets.map(asset => ({
        Ticker: asset.Ticker,
        Weight: asset.Weight,
      }));
      onPositionsExtracted(formattedAssets);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <Card className='w-full'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Loader2 className='h-5 w-5 animate-spin' />
            Extracting Positions...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='h-8 w-8 animate-spin' />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='w-full'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <AlertCircle className='h-5 w-5 text-red-500' />
            Error Extracting Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchPositions} className='mt-4' variant='outline'>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (portfolioAssets.length === 0) {
    return (
      <Card className='w-full'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <FileSpreadsheet className='h-5 w-5' />
            No Positions Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              No portfolio positions were found in this account. This could mean
              the account is empty or the positions are not accessible.
            </AlertDescription>
          </Alert>
          <Button onClick={fetchPositions} className='mt-4' variant='outline'>
            Refresh Positions
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <FileSpreadsheet className='h-5 w-5' />
          Portfolio Positions ({portfolioAssets.length} assets)
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <p className='text-sm text-gray-600'>
          Review your extracted portfolio positions. You can make adjustments in
          the next step.
        </p>

        <div className='space-y-3'>
          {portfolioAssets.map((asset, index) => (
            <div key={index} className='p-4 border border-gray-200 rounded-lg'>
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-1'>
                    <h3 className='font-medium'>{asset.Ticker}</h3>
                    <Badge variant='outline'>{asset.AssetType}</Badge>
                  </div>
                  <div className='grid grid-cols-2 gap-4 text-sm text-gray-600'>
                    <div>
                      <span className='font-medium'>Weight:</span>{' '}
                      {formatPercentage(asset.Weight)}
                    </div>
                    <div>
                      <span className='font-medium'>Quantity:</span>{' '}
                      {asset.Quantity.toLocaleString()}
                    </div>
                    <div>
                      <span className='font-medium'>Price:</span>{' '}
                      {formatCurrency(asset.Price)}
                    </div>
                    <div>
                      <span className='font-medium'>Value:</span>{' '}
                      {formatCurrency(asset.MarketValue)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Alert>
          <Calculator className='h-4 w-4' />
          <AlertDescription>
            Total portfolio value:{' '}
            {formatCurrency(
              portfolioAssets.reduce((sum, asset) => sum + asset.MarketValue, 0)
            )}
          </AlertDescription>
        </Alert>

        <Button onClick={handleContinue} className='w-full' size='lg'>
          <ArrowRight className='mr-2 h-4 w-4' />
          Continue to Manual Adjustment
        </Button>
      </CardContent>
    </Card>
  );
}
