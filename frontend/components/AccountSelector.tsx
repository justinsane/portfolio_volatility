import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  CreditCard,
  DollarSign,
  Building2,
} from 'lucide-react';

interface AccountSelectorProps {
  userData: { userId: string; userSecret: string };
  onAccountSelect: (accountId: string) => void;
  onError: (error: string) => void;
}

interface Account {
  id: string;
  name: string;
  number: string;
  institution: string;
  type: string;
  meta?: {
    totalValue?: number;
    positionsCount?: number;
  };
}

export default function AccountSelector({
  userData,
  onAccountSelect,
  onError,
}: AccountSelectorProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');

  // Fetch accounts from SnapTrade
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/snaptrade/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userData.userId,
          user_secret: userData.userSecret,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch accounts: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log('Accounts API response:', data.accounts);
        setAccounts(data.accounts || []);
      } else {
        throw new Error(data.error || 'Failed to fetch accounts');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch accounts';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load accounts on component mount
  useEffect(() => {
    fetchAccounts();
  }, [userData]);

  const handleAccountSelect = (accountId: string) => {
    setSelectedAccount(accountId);
  };

  const handleContinue = () => {
    if (selectedAccount) {
      onAccountSelect(selectedAccount);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className='w-full'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Loader2 className='h-5 w-5 animate-spin' />
            Loading Accounts...
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
            Error Loading Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchAccounts} className='mt-4' variant='outline'>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card className='w-full'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Building2 className='h-5 w-5' />
            No Accounts Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              No brokerage accounts were found. Please make sure you have
              successfully connected your brokerage account in the previous
              step.
            </AlertDescription>
          </Alert>
          <Button onClick={fetchAccounts} className='mt-4' variant='outline'>
            Refresh Accounts
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <CreditCard className='h-5 w-5' />
          Select Account ({accounts.length} found)
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <p className='text-sm text-gray-600'>
          Choose the brokerage account you'd like to analyze for portfolio
          volatility.
        </p>

        <div className='space-y-3'>
          {accounts.map(account => (
            <div
              key={account.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedAccount === account.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleAccountSelect(account.id)}
            >
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-1'>
                    <h3 className='font-medium'>
                      {account.name || 'Unnamed Account'}
                    </h3>
                    <Badge variant='outline'>{account.type}</Badge>
                  </div>
                  <p className='text-sm text-gray-600'>
                    {account.institution} • {account.number}
                  </p>
                  {account.meta?.totalValue && (
                    <p className='text-sm font-medium text-green-600 mt-1'>
                      <DollarSign className='inline h-3 w-3 mr-1' />
                      {formatCurrency(account.meta.totalValue)}
                    </p>
                  )}
                </div>
                {selectedAccount === account.id && (
                  <CheckCircle className='h-5 w-5 text-blue-500' />
                )}
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={handleContinue}
          disabled={!selectedAccount}
          className='w-full'
          size='lg'
        >
          Continue with Selected Account
        </Button>
      </CardContent>
    </Card>
  );
}
