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
      <Card className='w-full border-2 border-green-100 bg-gradient-to-br from-green-50 to-emerald-50'>
        <CardHeader className='pb-4'>
          <CardTitle className='flex items-center gap-3 text-xl font-bold text-green-800'>
            <div className='flex items-center justify-center w-10 h-10 bg-green-600 rounded-lg'>
              <CheckCircle className='h-6 w-6 text-white' />
            </div>
            Connection Successful!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='bg-white rounded-lg p-6 border border-green-200'>
            <div className='flex items-center justify-center mb-4'>
              <div className='flex items-center justify-center w-16 h-16 bg-green-100 rounded-full'>
                <CheckCircle className='h-8 w-8 text-green-600' />
              </div>
            </div>

            <div className='text-center space-y-3'>
              <h3 className='font-semibold text-green-800 text-lg'>
                Brokerage Account Connected!
              </h3>
              <p className='text-sm text-green-700 leading-relaxed'>
                Your brokerage account has been connected successfully. You can
                now proceed to select an account and extract your portfolio
                positions for volatility analysis.
              </p>
            </div>

            <div className='mt-6 p-4 bg-green-50 rounded-lg border border-green-200'>
              <h4 className='font-semibold text-green-800 mb-2 flex items-center gap-2'>
                <CheckCircle className='h-4 w-4 text-green-600' />
                Next Steps
              </h4>
              <div className='space-y-2 text-sm text-green-700'>
                <p className='flex items-start gap-2'>
                  <span className='text-green-600 mt-0.5'>1.</span>
                  <span>Select your brokerage account from the list</span>
                </p>
                <p className='flex items-start gap-2'>
                  <span className='text-green-600 mt-0.5'>2.</span>
                  <span>Extract your current portfolio positions</span>
                </p>
                <p className='flex items-start gap-2'>
                  <span className='text-green-600 mt-0.5'>3.</span>
                  <span>Review and adjust your portfolio data</span>
                </p>
                <p className='flex items-start gap-2'>
                  <span className='text-green-600 mt-0.5'>4.</span>
                  <span>Run volatility analysis on your portfolio</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className='w-full border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 touch-manipulation'>
        <CardHeader className='pb-4'>
          <CardTitle className='flex items-center gap-3 text-xl font-bold text-gray-800'>
            <div className='flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg'>
              <Building2 className='h-6 w-6 text-white' />
            </div>
            Connect Your Brokerage Account
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {step === 'initial' && (
            <>
              <div className='space-y-4'>
                <div className='bg-white rounded-lg p-4 border border-blue-200'>
                  <h3 className='font-semibold text-gray-800 mb-2 flex items-center gap-2'>
                    <Link className='h-4 w-4 text-blue-600' />
                    Secure Connection Portal
                  </h3>
                  <p className='text-sm text-gray-600 leading-relaxed'>
                    Connect your brokerage account to automatically extract your
                    portfolio positions. Our secure connection portal uses
                    industry-standard encryption to protect your data.
                  </p>
                </div>

                <div className='bg-green-50 rounded-lg p-4 border border-green-200'>
                  <h3 className='font-semibold text-green-800 mb-2 flex items-center gap-2'>
                    <CheckCircle className='h-4 w-4 text-green-600' />
                    Privacy & Security
                  </h3>
                  <div className='space-y-2 text-sm text-green-700'>
                    <p className='flex items-start gap-2'>
                      <span className='text-green-600 mt-0.5'>•</span>
                      <span>
                        <strong>Read-only access:</strong> We can only view your
                        positions, never trade or modify your account
                      </span>
                    </p>
                    <p className='flex items-start gap-2'>
                      <span className='text-green-600 mt-0.5'>•</span>
                      <span>
                        <strong>No data storage:</strong> Your portfolio data is
                        never saved to our database
                      </span>
                    </p>
                    <p className='flex items-start gap-2'>
                      <span className='text-green-600 mt-0.5'>•</span>
                      <span>
                        <strong>Secure connection:</strong> All data is
                        transmitted over encrypted connections
                      </span>
                    </p>
                    <p className='flex items-start gap-2'>
                      <span className='text-green-600 mt-0.5'>•</span>
                      <span>
                        <strong>Instant analysis:</strong> Your data is
                        processed in real-time and immediately discarded
                      </span>
                    </p>
                  </div>
                </div>

                <div className='bg-blue-50 rounded-lg p-4 border border-blue-200'>
                  <h3 className='font-semibold text-blue-800 mb-2 flex items-center gap-2'>
                    <ExternalLink className='h-4 w-4 text-blue-600' />
                    How It Works
                  </h3>
                  <div className='space-y-2 text-sm text-blue-700'>
                    <p className='flex items-start gap-2'>
                      <span className='text-blue-600 mt-0.5'>1.</span>
                      <span>
                        Click "Connect Account" to open the secure portal
                      </span>
                    </p>
                    <p className='flex items-start gap-2'>
                      <span className='text-blue-600 mt-0.5'>2.</span>
                      <span>Select your brokerage and log in securely</span>
                    </p>
                    <p className='flex items-start gap-2'>
                      <span className='text-blue-600 mt-0.5'>3.</span>
                      <span>
                        We'll extract your current portfolio positions
                      </span>
                    </p>
                    <p className='flex items-start gap-2'>
                      <span className='text-blue-600 mt-0.5'>4.</span>
                      <span>
                        Review and adjust your portfolio before analysis
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className='p-2 -m-2'>
                <Button
                  onClick={startConnection}
                  className='w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-4 sm:py-3 text-lg shadow-lg hover:shadow-xl active:shadow-inner transition-all duration-200 touch-manipulation select-none'
                  size='lg'
                  style={{ minHeight: '48px' }}
                >
                  <Link className='mr-3 h-5 w-5 flex-shrink-0' />
                  <span className='whitespace-nowrap'>
                    <span className='hidden sm:inline'>
                      Connect Brokerage Account
                    </span>
                    <span className='sm:hidden'>Connect</span>
                  </span>
                </Button>
              </div>
            </>
          )}

          {(step === 'registering' || step === 'connecting') && (
            <>
              <div className='bg-white rounded-lg p-6 border border-blue-200'>
                <div className='flex items-center justify-center mb-4'>
                  <div className='flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full'>
                    <Loader2 className='h-6 w-6 animate-spin text-blue-600' />
                  </div>
                </div>

                <div className='text-center space-y-3'>
                  <h3 className='font-semibold text-gray-800'>
                    {step === 'registering'
                      ? 'Setting up secure connection...'
                      : 'Generating connection portal...'}
                  </h3>
                  <p className='text-sm text-gray-600'>
                    {step === 'registering'
                      ? 'Creating your secure user session with SnapTrade'
                      : 'Preparing the secure connection portal for your brokerage'}
                  </p>
                </div>

                <div className='mt-6 space-y-2'>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-gray-600'>Progress</span>
                    <span className='font-semibold text-blue-600'>
                      {progress}%
                    </span>
                  </div>
                  <Progress value={progress} className='w-full h-2' />
                </div>
              </div>
            </>
          )}

          {step === 'connecting' && loginUrl && (
            <>
              <div className='bg-green-50 rounded-lg p-6 border border-green-200'>
                <div className='flex items-center justify-center mb-4'>
                  <div className='flex items-center justify-center w-12 h-12 bg-green-100 rounded-full'>
                    <CheckCircle className='h-6 w-6 text-green-600' />
                  </div>
                </div>

                <div className='text-center space-y-3'>
                  <h3 className='font-semibold text-green-800'>
                    Connection Portal Ready!
                  </h3>
                  <p className='text-sm text-green-700'>
                    Your secure connection portal is ready. Click the button
                    below to open the SnapTrade connection window and link your
                    brokerage account.
                  </p>
                </div>

                <div className='p-2 -m-2 mt-4'>
                  <Button
                    onClick={openConnectionPortal}
                    className='w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-4 sm:py-3 text-lg shadow-lg hover:shadow-xl active:shadow-inner transition-all duration-200 touch-manipulation select-none'
                    size='lg'
                    style={{ minHeight: '48px' }}
                  >
                    <ExternalLink className='mr-3 h-5 w-5 flex-shrink-0' />
                    <span className='whitespace-nowrap'>
                      <span className='hidden sm:inline'>
                        Open Connection Portal
                      </span>
                      <span className='sm:hidden'>Open Portal</span>
                    </span>
                  </Button>
                </div>

                <div className='mt-4 p-3 bg-white rounded-lg border border-green-200'>
                  <p className='text-xs text-green-700 text-center'>
                    <strong>Note:</strong> After connecting your account, the
                    modal will automatically close and you can continue with
                    portfolio analysis.
                  </p>
                </div>
              </div>
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
