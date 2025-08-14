import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import {
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  Building2,
  Link,
} from 'lucide-react';
import { SnapTradeReact } from 'snaptrade-react';

interface SnapTradeConnectionProps {
  onConnectionSuccess: (userData: {
    userId: string;
    userSecret: string;
  }) => void;
  onError: (error: string) => void;
}

interface UserData {
  userId: string;
  userSecret: string;
}

export default function SnapTradeConnection({
  onConnectionSuccess,
  onError,
}: SnapTradeConnectionProps) {
  const [step, setStep] = useState<
    'initial' | 'registering' | 'connecting' | 'success' | 'error'
  >('initial');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loginUrl, setLoginUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Register user with SnapTrade
  const registerUser = async () => {
    try {
      setStep('registering');
      setProgress(25);

      const response = await fetch('/api/snaptrade/register-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`Registration failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const newUserData = {
          userId: data.user_id,
          userSecret: data.user_secret,
        };
        setUserData(newUserData);
        setProgress(50);

        // Generate login URL
        await generateLoginUrl(newUserData);
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      setStep('error');
      onError(errorMessage);
    }
  };

  // Generate login URL
  const generateLoginUrl = async (userData: UserData) => {
    try {
      setProgress(75);

      const response = await fetch('/api/snaptrade/login-url', {
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
        throw new Error(`Login URL generation failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log('Login URL generated successfully:', data.redirect_uri);
        setLoginUrl(data.redirect_uri);
        setStep('connecting');
        setProgress(100);
        // Open the modal automatically
        console.log('Opening SnapTrade modal...');
        setIsModalOpen(true);
      } else {
        throw new Error(data.error || 'Login URL generation failed');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Login URL generation failed';
      setError(errorMessage);
      setStep('error');
      onError(errorMessage);
    }
  };

  // Handle connection success from SnapTrade modal
  const handleConnectionSuccess = (authorizationId: string) => {
    console.log('SnapTrade connection successful:', authorizationId);
    console.log('User data at success:', userData);
    if (userData) {
      setStep('success');
      setIsModalOpen(false);
      onConnectionSuccess(userData);
    } else {
      console.error('No user data available at connection success');
      setError('Connection successful but user data is missing');
      setStep('error');
      setIsModalOpen(false);
      onError('Connection successful but user data is missing');
    }
  };

  // Handle connection error from SnapTrade modal
  const handleConnectionError = (errorData: any) => {
    console.error('SnapTrade connection error:', errorData);
    const errorMessage =
      errorData?.description || errorData?.message || 'Connection failed';
    console.error('Error message:', errorMessage);
    setError(errorMessage);
    setStep('error');
    setIsModalOpen(false);
    onError(errorMessage);
  };

  // Handle modal exit
  const handleModalExit = () => {
    console.log('SnapTrade modal exited');
    setIsModalOpen(false);
    // Don't change step here, let user try again
  };

  // Handle modal close
  const handleModalClose = () => {
    console.log('SnapTrade modal closed');
    setIsModalOpen(false);
    // Don't change step here, let user try again
  };

  const startConnection = () => {
    registerUser();
  };

  const openConnectionPortal = () => {
    if (loginUrl) {
      setIsModalOpen(true);
    }
  };

  if (step === 'error') {
    return (
      <Card className='w-full'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <AlertCircle className='h-5 w-5 text-red-500' />
            Connection Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={startConnection} className='mt-4' variant='outline'>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'success') {
    return (
      <Card className='w-full'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-green-600'>
            <CheckCircle className='h-5 w-5' />
            Connection Successful!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle className='h-4 w-4' />
            <AlertDescription>
              Your brokerage account has been connected successfully. You can
              now proceed to select an account and extract your portfolio
              positions.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className='w-full'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Building2 className='h-5 w-5' />
            Connect Your Brokerage Account
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {step === 'initial' && (
            <>
              <p className='text-sm text-gray-600'>
                Connect your brokerage account to automatically extract your
                portfolio positions. This will open a secure connection portal
                where you can link your account.
              </p>
              <Button onClick={startConnection} className='w-full' size='lg'>
                <Link className='mr-2 h-4 w-4' />
                Connect Brokerage Account
              </Button>
            </>
          )}

          {(step === 'registering' || step === 'connecting') && (
            <>
              <div className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span>
                    {step === 'registering'
                      ? 'Registering user...'
                      : 'Generating connection portal...'}
                  </span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className='w-full' />
              </div>

              <div className='flex items-center justify-center py-4'>
                <Loader2 className='h-6 w-6 animate-spin' />
              </div>
            </>
          )}

          {step === 'connecting' && loginUrl && (
            <>
              <Alert>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>
                  Connection portal ready! Click the button below to open the
                  secure connection window.
                </AlertDescription>
              </Alert>

              <Button
                onClick={openConnectionPortal}
                className='w-full'
                size='lg'
              >
                <ExternalLink className='mr-2 h-4 w-4' />
                Open Connection Portal
              </Button>

              <p className='text-xs text-gray-500 text-center'>
                After connecting your account, the modal will automatically
                close and you can continue.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* SnapTrade React Modal */}
      {loginUrl && (
        <>
          {console.log('Rendering SnapTrade modal with URL:', loginUrl)}
          {console.log('Modal open state:', isModalOpen)}
          <SnapTradeReact
            loginLink={loginUrl}
            isOpen={isModalOpen}
            close={handleModalClose}
            onSuccess={handleConnectionSuccess}
            onError={handleConnectionError}
            onExit={handleModalExit}
            contentLabel='Connect Account via SnapTrade'
            style={{
              overlay: {
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1000,
              },
            }}
          />
        </>
      )}
    </>
  );
}
