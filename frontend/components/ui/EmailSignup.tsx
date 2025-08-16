import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Input } from './input';
import { Button } from './button';
import { Mail, Send, CheckCircle } from 'lucide-react';
import { EmailSignupRequest, EmailSignupResponse } from '../../lib/api';

interface EmailSignupProps {
  onSubmit: (data: EmailSignupRequest) => Promise<EmailSignupResponse>;
}

export default function EmailSignup({ onSubmit }: EmailSignupProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit({
        name: name.trim() || undefined,
        email: email.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to submit email signup'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className='bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-blue-800'>
          <Mail className='h-5 w-5 text-blue-600' />
          Get Your Full Analysis Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!submitted ? (
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>
                Name <span className='text-gray-500'>(optional)</span>
              </label>
              <Input
                placeholder='Your name'
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={loading}
                className='border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              />
            </div>
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>
                Email Address <span className='text-red-500'>*</span>
              </label>
              <Input
                type='email'
                placeholder='your.email@example.com'
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                required
                className='border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              />
            </div>
            {error && (
              <div className='text-red-600 text-sm bg-red-50 p-2 rounded-md'>
                {error}
              </div>
            )}
            <div className='text-right'>
              <Button
                type='submit'
                disabled={loading}
                className='w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-4 sm:py-3 text-lg shadow-lg hover:shadow-xl active:shadow-inner transition-all duration-200 touch-manipulation select-none cursor-pointer'
                style={{ minHeight: '48px' }}
              >
                {loading ? (
                  <div className='flex items-center gap-2'>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                    Sending...
                  </div>
                ) : (
                  <div className='flex items-center gap-2'>
                    <Send className='h-5 w-5 flex-shrink-0' />
                    <span className='whitespace-nowrap'>
                      <span className='hidden sm:inline'>
                        Send Full Analysis Report
                      </span>
                      <span className='sm:hidden'>Get Full Report</span>
                    </span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className='text-center text-gray-700'>
            <div className='flex items-center justify-center gap-2 mb-2'>
              <CheckCircle className='h-6 w-6 text-green-600' />
              <p className='text-lg font-semibold text-green-800'>
                Request Submitted Successfully!
              </p>
            </div>
            <p className='text-sm text-gray-600'>
              We&apos;ll send your comprehensive portfolio analysis report to
              your email shortly.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
