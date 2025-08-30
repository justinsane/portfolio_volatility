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
  Shield,
  Lock,
  Eye,
  Zap,
  Users,
  Database,
  ArrowRight,
  Sparkles,
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

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('/api/snaptrade/register-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch('/api/snaptrade/login-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userData.userId,
          user_secret: userData.userSecret,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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
      <Card className='w-full border-red-200 bg-red-50'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-red-800'>
            <AlertCircle className='h-5 w-5 text-red-600' />
            Connection Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant='destructive' className='border-red-300 bg-red-100'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription className='font-medium'>{error}</AlertDescription>
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
      <Card className='w-full border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg'>
        <CardHeader className='pb-4'>
          <CardTitle className='flex items-center gap-3 text-xl font-bold text-green-800'>
            <div className='flex items-center justify-center w-12 h-12 bg-green-600 rounded-xl shadow-lg'>
              <CheckCircle className='h-7 w-7 text-white' />
            </div>
            Connection Successful!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='bg-white rounded-xl p-6 border border-green-200 shadow-sm'>
            <div className='flex items-center justify-center mb-6'>
              <div className='flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full'>
                <CheckCircle className='h-10 w-10 text-green-600' />
              </div>
            </div>

            <div className='text-center space-y-4'>
              <h3 className='font-bold text-green-800 text-xl'>
                Brokerage Account Connected!
              </h3>
              <p className='text-sm text-green-700 leading-relaxed'>
                Your brokerage account has been securely connected. You can now
                proceed to select an account and extract your portfolio
                positions for volatility analysis.
              </p>
            </div>

            <div className='mt-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200'>
              <h4 className='font-semibold text-green-800 mb-3 flex items-center gap-2'>
                <Sparkles className='h-4 w-4 text-green-600' />
                Next Steps
              </h4>
              <div className='space-y-3 text-sm text-green-700'>
                <div className='flex items-start gap-3'>
                  <div className='flex items-center justify-center w-6 h-6 bg-green-600 text-white text-xs font-bold rounded-full flex-shrink-0 mt-0.5'>
                    1
                  </div>
                  <span>Select your brokerage account from the list</span>
                </div>
                <div className='flex items-start gap-3'>
                  <div className='flex items-center justify-center w-6 h-6 bg-green-600 text-white text-xs font-bold rounded-full flex-shrink-0 mt-0.5'>
                    2
                  </div>
                  <span>Extract your current portfolio positions</span>
                </div>
                <div className='flex items-start gap-3'>
                  <div className='flex items-center justify-center w-6 h-6 bg-green-600 text-white text-xs font-bold rounded-full flex-shrink-0 mt-0.5'>
                    3
                  </div>
                  <span>Review and adjust your portfolio data</span>
                </div>
                <div className='flex items-start gap-3'>
                  <div className='flex items-center justify-center w-6 h-6 bg-green-600 text-white text-xs font-bold rounded-full flex-shrink-0 mt-0.5'>
                    4
                  </div>
                  <span>Run volatility analysis on your portfolio</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className='w-full border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg'>
        <CardHeader className='pb-4'>
          <CardTitle className='flex items-center gap-3 text-xl font-bold text-slate-800'>
            <div className='flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg'>
              <Building2 className='h-7 w-7 text-white' />
            </div>
            Securely Connect Your Brokerage
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {step === 'initial' && (
            <>
              <div className='space-y-6'>
                {/* Enhanced Security Section */}
                <div className='bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200'>
                  <h3 className='font-bold text-green-800 mb-4 flex items-center gap-2 text-lg'>
                    <Shield className='h-5 w-5 text-green-600' />
                    Privacy & Security First
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-3'>
                      <div className='flex items-start gap-3'>
                        <div className='flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg flex-shrink-0 mt-0.5'>
                          <Eye className='h-4 w-4 text-green-600' />
                        </div>
                        <div>
                          <p className='font-semibold text-green-800 text-sm'>
                            Read-only Access
                          </p>
                          <p className='text-xs text-green-700'>
                            We can only view your positions, never trade or
                            modify your account
                          </p>
                        </div>
                      </div>
                      <div className='flex items-start gap-3'>
                        <div className='flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg flex-shrink-0 mt-0.5'>
                          <Database className='h-4 w-4 text-green-600' />
                        </div>
                        <div>
                          <p className='font-semibold text-green-800 text-sm'>
                            No Data Storage
                          </p>
                          <p className='text-xs text-green-700'>
                            Your portfolio data is never saved to our database
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className='space-y-3'>
                      <div className='flex items-start gap-3'>
                        <div className='flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg flex-shrink-0 mt-0.5'>
                          <Lock className='h-4 w-4 text-green-600' />
                        </div>
                        <div>
                          <p className='font-semibold text-green-800 text-sm'>
                            Secure Connection
                          </p>
                          <p className='text-xs text-green-700'>
                            All data is transmitted over encrypted connections
                          </p>
                        </div>
                      </div>
                      <div className='flex items-start gap-3'>
                        <div className='flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg flex-shrink-0 mt-0.5'>
                          <Zap className='h-4 w-4 text-green-600' />
                        </div>
                        <div>
                          <p className='font-semibold text-green-800 text-sm'>
                            Instant Analysis
                          </p>
                          <p className='text-xs text-green-700'>
                            Your data is processed in real-time and immediately
                            discarded
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* How It Works Section */}
                <div className='bg-white rounded-xl p-6 border border-blue-200 shadow-sm'>
                  <h3 className='font-semibold text-blue-800 mb-4 flex items-center gap-2'>
                    <Link className='h-5 w-5 text-blue-600' />
                    How It Works
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-3'>
                      <div className='flex items-start gap-3'>
                        <div className='flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg flex-shrink-0 mt-0.5'>
                          <span className='text-sm font-bold text-blue-600'>
                            1
                          </span>
                        </div>
                        <div>
                          <p className='font-semibold text-blue-800 text-sm'>
                            Click "Connect Account"
                          </p>
                          <p className='text-xs text-blue-700'>
                            Opens the secure connection portal
                          </p>
                        </div>
                      </div>
                      <div className='flex items-start gap-3'>
                        <div className='flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg flex-shrink-0 mt-0.5'>
                          <span className='text-sm font-bold text-blue-600'>
                            2
                          </span>
                        </div>
                        <div>
                          <p className='font-semibold text-blue-800 text-sm'>
                            Select & Login
                          </p>
                          <p className='text-xs text-blue-700'>
                            Choose your brokerage and log in securely
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className='space-y-3'>
                      <div className='flex items-start gap-3'>
                        <div className='flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg flex-shrink-0 mt-0.5'>
                          <span className='text-sm font-bold text-blue-600'>
                            3
                          </span>
                        </div>
                        <div>
                          <p className='font-semibold text-blue-800 text-sm'>
                            Extract Positions
                          </p>
                          <p className='text-xs text-blue-700'>
                            We'll extract your current portfolio positions
                          </p>
                        </div>
                      </div>
                      <div className='flex items-start gap-3'>
                        <div className='flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg flex-shrink-0 mt-0.5'>
                          <span className='text-sm font-bold text-blue-600'>
                            4
                          </span>
                        </div>
                        <div>
                          <p className='font-semibold text-blue-800 text-sm'>
                            Review & Analyze
                          </p>
                          <p className='text-xs text-blue-700'>
                            Review and adjust your portfolio before analysis
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Supported Brokers */}
                <div className='bg-slate-50 rounded-xl p-6 border border-slate-200'>
                  <h3 className='font-semibold text-slate-800 mb-3 flex items-center gap-2'>
                    <Users className='h-5 w-5 text-slate-600' />
                    Supported Brokers
                  </h3>
                  <p className='text-sm text-slate-600 mb-3'>
                    Connect with major brokerage platforms including:
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    {[
                      'TD Ameritrade',
                      'Charles Schwab',
                      'Fidelity',
                      'E*TRADE',
                      'Robinhood',
                      'Vanguard',
                      'Interactive Brokers',
                      'Ally Invest',
                    ].map(broker => (
                      <span
                        key={broker}
                        className='px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-700'
                      >
                        {broker}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className='p-2 -m-2'>
                <Button
                  onClick={startConnection}
                  className='w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 text-white font-bold py-4 sm:py-4 text-lg shadow-lg hover:shadow-xl active:shadow-inner transition-all duration-200 touch-manipulation select-none cursor-pointer rounded-xl'
                  size='lg'
                  style={{ minHeight: '56px' }}
                >
                  <Link className='mr-3 h-6 w-6 flex-shrink-0' />
                  <span className='whitespace-nowrap'>
                    <span className='hidden sm:inline'>
                      Connect Brokerage Account
                    </span>
                    <span className='sm:hidden'>Connect Account</span>
                  </span>
                  <ArrowRight className='ml-3 h-5 w-5 flex-shrink-0' />
                </Button>
              </div>
            </>
          )}

          {(step === 'registering' || step === 'connecting') && (
            <>
              <div className='bg-white rounded-xl p-8 border border-blue-200 shadow-sm'>
                <div className='flex items-center justify-center mb-6'>
                  <div className='relative'>
                    <div className='flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full'>
                      <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
                    </div>
                    <div className='absolute inset-0 rounded-full border-4 border-transparent border-t-blue-400 animate-ping'></div>
                  </div>
                </div>

                <div className='text-center space-y-4'>
                  <h3 className='font-bold text-slate-800 text-lg'>
                    {step === 'registering'
                      ? 'Setting up secure connection...'
                      : 'Generating connection portal...'}
                  </h3>
                  <p className='text-sm text-slate-600'>
                    {step === 'registering'
                      ? 'Creating your secure user session with SnapTrade'
                      : 'Preparing the secure connection portal for your brokerage'}
                  </p>
                </div>

                <div className='mt-8 space-y-3'>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-slate-600 font-medium'>Progress</span>
                    <span className='font-bold text-blue-600'>{progress}%</span>
                  </div>
                  <Progress value={progress} className='w-full h-3' />
                </div>
              </div>
            </>
          )}

          {step === 'connecting' && loginUrl && (
            <>
              <div className='bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200 shadow-sm'>
                <div className='flex items-center justify-center mb-6'>
                  <div className='flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full'>
                    <CheckCircle className='h-8 w-8 text-green-600' />
                  </div>
                </div>

                <div className='text-center space-y-4'>
                  <h3 className='font-bold text-green-800 text-lg'>
                    Connection Portal Ready!
                  </h3>
                  <p className='text-sm text-green-700'>
                    Your secure connection portal is ready. Click the button
                    below to open the SnapTrade connection window and link your
                    brokerage account.
                  </p>
                </div>

                <div className='p-2 -m-2 mt-6'>
                  <Button
                    onClick={openConnectionPortal}
                    className='w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:from-green-800 active:to-emerald-800 text-white font-bold py-4 sm:py-4 text-lg shadow-lg hover:shadow-xl active:shadow-inner transition-all duration-200 touch-manipulation select-none rounded-xl'
                    size='lg'
                    style={{ minHeight: '56px' }}
                  >
                    <ExternalLink className='mr-3 h-6 w-6 flex-shrink-0' />
                    <span className='whitespace-nowrap'>
                      <span className='hidden sm:inline'>
                        Open Connection Portal
                      </span>
                      <span className='sm:hidden'>Open Portal</span>
                    </span>
                    <ArrowRight className='ml-3 h-5 w-5 flex-shrink-0' />
                  </Button>
                </div>

                <div className='mt-6 p-4 bg-white rounded-xl border border-green-200'>
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
