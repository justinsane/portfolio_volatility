import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { submitFeedback } from '../lib/api';

export default function FeedbackPage() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await submitFeedback({
        name: name.trim() || undefined,
        message: message.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to submit feedback'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Feedback • Portfolio Volatility Predictor</title>
      </Head>
      <main className='min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4'>
        <div className='mx-auto max-w-4xl space-y-6'>
          <Card className='bg-white/95'>
            <CardHeader>
              <CardTitle>Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              {!submitted ? (
                <form onSubmit={handleSubmit} className='space-y-4'>
                  <div>
                    <label className='mb-1 block text-sm font-medium text-gray-700'>
                      Name
                    </label>
                    <Input
                      placeholder='Your name (optional)'
                      value={name}
                      onChange={e => setName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className='mb-1 block text-sm font-medium text-gray-700'>
                      Message
                    </label>
                    <textarea
                      className='min-h-[120px] w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                      placeholder='Tell us what you think...'
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  {error && <div className='text-red-600 text-sm'>{error}</div>}
                  <div className='text-right'>
                    <Button type='submit' disabled={loading}>
                      {loading ? 'Submitting...' : 'Submit'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className='text-center text-gray-700'>
                  <p className='text-lg font-semibold'>
                    Thanks for the feedback!
                  </p>
                  <p className='mt-1 text-sm'>
                    We appreciate you taking the time.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CTA for returning to the app */}
          {submitted && (
            <Card className='bg-white/95'>
              <CardContent className='flex flex-col items-start gap-3 p-6 md:flex-row md:items-center md:justify-between'>
                <div>
                  <p className='text-lg font-semibold text-gray-900'>
                    Ready to estimate risk?
                  </p>
                  <p className='text-sm text-gray-600'>
                    Head back to the home page to upload a CSV or enter your
                    portfolio manually.
                  </p>
                </div>
                <Button asChild>
                  <Link href='/' className='no-underline'>
                    Get Started
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
