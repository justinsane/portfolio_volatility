import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import {
  TrendingUp,
  Shield,
  BarChart3,
  Zap,
  Lock,
  FileSpreadsheet,
  Edit3,
  Cpu,
  Activity,
  Database,
  EyeOff,
  HelpCircle,
  Link as LinkIcon,
  RefreshCw,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About • Portfolio Volatility Predictor</title>
      </Head>
      <main className='min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4'>
        <div className='mx-auto max-w-5xl space-y-6'>
          {/* Hero */}
          <Card className='bg-white/95'>
            <CardHeader>
              <div className='flex items-start justify-between gap-4'>
                <div>
                  <CardTitle className='flex items-center gap-3'>
                    <TrendingUp className='h-6 w-6 text-blue-600' />
                    Portfolio Volatility Predictor
                  </CardTitle>
                  <p className='mt-2 text-sm text-gray-600'>
                    Instant volatility forecasts, risk diagnostics, and
                    diversification insights powered by historical data and
                    machine learning.
                  </p>
                </div>
                <Badge className='bg-blue-600/10 text-blue-700'>Beta</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                <div className='rounded-lg border p-4'>
                  <div className='mb-2 flex items-center gap-2 text-gray-900'>
                    <Activity className='h-4 w-4 text-blue-600' />
                    <span className='text-sm font-semibold'>Volatility</span>
                  </div>
                  <p className='text-sm text-gray-600'>
                    Consolidated annualized volatility estimate with methodology
                    labels and ML adjustment context.
                  </p>
                </div>
                <div className='rounded-lg border p-4'>
                  <div className='mb-2 flex items-center gap-2 text-gray-900'>
                    <Shield className='h-4 w-4 text-emerald-600' />
                    <span className='text-sm font-semibold'>
                      Risk Profiling
                    </span>
                  </div>
                  <p className='text-sm text-gray-600'>
                    Concentration, correlations, diversification score, and
                    prioritized recommendations.
                  </p>
                </div>
                <div className='rounded-lg border p-4'>
                  <div className='mb-2 flex items-center gap-2 text-gray-900'>
                    <Zap className='h-4 w-4 text-purple-600' />
                    <span className='text-sm font-semibold'>
                      Fast & Private
                    </span>
                  </div>
                  <p className='text-sm text-gray-600'>
                    Connect via SnapTrade or upload CSV. Your data is processed
                    for the session only—no persistent storage by default.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How it works */}
          <Card className='bg-white/95'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <BarChart3 className='h-5 w-5 text-gray-700' />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                <div className='rounded-lg border p-4'>
                  <div className='mb-2 flex items-center gap-2'>
                    <LinkIcon className='h-4 w-4 text-gray-700' />
                    <span className='text-sm font-semibold'>
                      1) Connect Portfolio
                    </span>
                  </div>
                  <p className='text-sm text-gray-600'>
                    Connect your brokerage account via SnapTrade API for instant
                    portfolio data, or upload a CSV with <strong>Ticker</strong>{' '}
                    and <strong>Weight</strong> columns.
                  </p>
                </div>
                <div className='rounded-lg border p-4'>
                  <div className='mb-2 flex items-center gap-2'>
                    <Cpu className='h-4 w-4 text-gray-700' />
                    <span className='text-sm font-semibold'>2) Analyze</span>
                  </div>
                  <p className='text-sm text-gray-600'>
                    We match assets to known categories, pull historical
                    behavior (where available), and estimate covariance.
                  </p>
                </div>
                <div className='rounded-lg border p-4'>
                  <div className='mb-2 flex items-center gap-2'>
                    <TrendingUp className='h-4 w-4 text-gray-700' />
                    <span className='text-sm font-semibold'>3) Forecast</span>
                  </div>
                  <p className='text-sm text-gray-600'>
                    Multiple methods produce a consolidated volatility forecast
                    with risk diagnostics and actionable insights.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Model overview */}
          <Card className='bg-white/95'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Zap className='h-5 w-5 text-purple-700' />
                Models & Methodology
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                <div className='rounded-lg border p-4'>
                  <p className='mb-1 text-sm font-semibold text-gray-900'>
                    Enhanced Multi-Source
                  </p>
                  <p className='text-sm text-gray-600'>
                    Blends historical signals, asset metadata, and
                    cross-sectional priors to improve coverage and stability.
                  </p>
                </div>
                <div className='rounded-lg border p-4'>
                  <p className='mb-1 text-sm font-semibold text-gray-900'>
                    Historical Random Forest
                  </p>
                  <p className='text-sm text-gray-600'>
                    Learns mappings from asset features and market regimes to
                    realized volatility estimates.
                  </p>
                </div>
                <div className='rounded-lg border p-4'>
                  <p className='mb-1 text-sm font-semibold text-gray-900'>
                    Asset-Based Estimation
                  </p>
                  <p className='text-sm text-gray-600'>
                    Uses category-level priors and conservative assumptions when
                    history is sparse.
                  </p>
                </div>
              </div>
              <div className='mt-4 rounded-lg border p-4'>
                <div className='mb-2 flex items-center gap-2 text-gray-900'>
                  <Database className='h-4 w-4 text-indigo-600' />
                  <span className='text-sm font-semibold'>
                    Risk Diagnostics
                  </span>
                </div>
                <p className='text-sm text-gray-600'>
                  We compute HHI concentration, pairwise correlations (where
                  data allows), diversification score, and summarize key
                  concerns with prioritized recommendations.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card className='bg-white/95'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Lock className='h-5 w-5 text-emerald-700' />
                Data & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div className='rounded-lg border p-4'>
                  <p className='mb-1 text-sm font-semibold text-gray-900'>
                    Zero Data Retention
                  </p>
                  <p className='text-sm text-gray-600'>
                    Inputs are processed to generate results and are not
                    persisted by default. Clear the page to remove them from the
                    session.
                  </p>
                </div>
                <div className='rounded-lg border p-4'>
                  <p className='mb-1 text-sm font-semibold text-gray-900'>
                    Transparent Processing
                  </p>
                  <p className='text-sm text-gray-600'>
                    Where possible, the UI surfaces model type, window labels,
                    and confidence indicators so you can evaluate outputs.
                  </p>
                </div>
                <div className='rounded-lg border p-4'>
                  <p className='mb-1 text-sm font-semibold text-gray-900'>
                    Secure SnapTrade Integration
                  </p>
                  <p className='text-sm text-gray-600'>
                    SnapTrade connections are read-only and temporary. We never
                    store your brokerage credentials or account details.
                  </p>
                </div>
                <div className='rounded-lg border p-4'>
                  <p className='mb-1 text-sm font-semibold text-gray-900'>
                    Limitations
                  </p>
                  <p className='text-sm text-gray-600'>
                    Forecasts are estimates, not guarantees. Use them alongside
                    your own judgement and professional advice.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card className='bg-white/95'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <HelpCircle className='h-5 w-5 text-gray-700' />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type='single' collapsible className='w-full'>
                <AccordionItem value='snaptrade-privacy'>
                  <AccordionTrigger>
                    How does SnapTrade integration work and what data do you
                    access?
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className='space-y-3 text-sm text-gray-600'>
                      <p>
                        <strong>Read-Only Access:</strong> SnapTrade provides
                        read-only access to your portfolio positions and
                        weights. We cannot make any trades or changes to your
                        account.
                      </p>
                      <p>
                        <strong>No Credential Storage:</strong> We never see or
                        store your brokerage login credentials. SnapTrade
                        handles all authentication securely.
                      </p>
                      <p>
                        <strong>Temporary Connection:</strong> The connection is
                        temporary and expires automatically. We only access your
                        portfolio data during the analysis session.
                      </p>
                      <p>
                        <strong>Zero Retention:</strong> We do not store any of
                        your portfolio data, account information, or personal
                        details. Everything is processed in memory and discarded
                        after generating your volatility report.
                      </p>
                      <p>
                        <strong>Supported Brokers:</strong> SnapTrade supports
                        major brokers including Fidelity, Charles Schwab,
                        Robinhood, E*TRADE, and many others.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value='what-is-vol'>
                  <AccordionTrigger>
                    What exactly is the volatility you report?
                  </AccordionTrigger>
                  <AccordionContent>
                    We report an annualized volatility estimate of portfolio
                    returns, based on a blend of historical and model-based
                    approaches. Where available, we use realized covariances;
                    otherwise we fall back to category-level priors.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value='why-three-models'>
                  <AccordionTrigger>
                    Why multiple models instead of a single approach?
                  </AccordionTrigger>
                  <AccordionContent>
                    Different data regimes benefit from different methods. The
                    ensemble improves coverage (when history is sparse) and
                    stability (when markets shift), yielding more robust
                    estimates.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value='my-weights'>
                  <AccordionTrigger>
                    Do I need weights in percent or decimals?
                  </AccordionTrigger>
                  <AccordionContent>
                    Either is fine. CSVs and manual entry accept percentages.
                    Internally we normalize and handle rounding safely.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value='privacy'>
                  <AccordionTrigger>
                    Do you store my portfolio?
                  </AccordionTrigger>
                  <AccordionContent>
                    By default, no. Inputs are used to compute the forecast for
                    your session. You can remove them by refreshing or
                    navigating away.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value='limitations'>
                  <AccordionTrigger>
                    What are the key limitations I should know?
                  </AccordionTrigger>
                  <AccordionContent>
                    Coverage constraints for niche assets, regime shifts, sparse
                    history, and data quality can affect accuracy. Treat results
                    as decision support, not advice.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className='bg-white/95'>
            <CardContent className='flex flex-col items-start gap-3 p-6 md:flex-row md:items-center md:justify-between'>
              <div>
                <p className='text-lg font-semibold text-gray-900'>
                  Ready to estimate risk?
                </p>
                <p className='text-sm text-gray-600'>
                  Connect your brokerage account via SnapTrade or upload a CSV
                  to get started.
                </p>
              </div>
              <Button asChild>
                <Link href='/' className='no-underline'>
                  Get Started
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
