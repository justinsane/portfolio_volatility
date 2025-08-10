import React, { useState } from 'react';
import Head from 'next/head';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export default function FeedbackPage() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <Head>
        <title>Feedback • Portfolio Volatility Predictor</title>
      </Head>
      <main className='min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4'>
        <div className='mx-auto max-w-4xl'>
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
                    />
                  </div>
                  <div className='text-right'>
                    <Button type='submit'>Submit</Button>
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
        </div>
      </main>
    </>
  );
}
