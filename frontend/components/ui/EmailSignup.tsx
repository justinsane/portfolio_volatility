'use client';
import { useState } from 'react';
import type React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Mail, Send, CheckCircle } from 'lucide-react';
import type { EmailSignupRequest, EmailSignupResponse } from '@/lib/api';

interface EmailSignupProps {
  onSubmit: (data: EmailSignupRequest) => Promise<EmailSignupResponse>;
}

export default function EmailSignup({ onSubmit }: EmailSignupProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      setError('Email address is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        name: formData.name.trim() || undefined,
        email: formData.email.trim(),
      });
      setIsSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to submit. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className='border-2 border-green-200 bg-green-50 dark:bg-green-950/20'>
        <CardContent className='pt-6'>
          <div className='flex items-center gap-3 text-green-700 dark:text-green-400'>
            <CheckCircle className='h-6 w-6' />
            <div>
              <h3 className='font-semibold'>Thank you!</h3>
              <p className='text-sm'>
                Your full analysis report will be sent to your email shortly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='border-2 border-border/50'>
      <CardHeader>
        <CardTitle className='flex items-center gap-3'>
          <div className='p-2 rounded-lg bg-primary/10 border border-primary/20'>
            <Mail className='h-5 w-5 text-primary' />
          </div>
          Get Your Full Analysis Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Name (optional)</Label>
              <Input
                id='name'
                type='text'
                placeholder='Your name'
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                disabled={isSubmitting}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email Address *</Label>
              <Input
                id='email'
                type='email'
                placeholder='your.email@example.com'
                value={formData.email}
                onChange={e =>
                  setFormData(prev => ({ ...prev, email: e.target.value }))
                }
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          {error && (
            <div className='text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg'>
              {error}
            </div>
          )}

          <Button
            type='submit'
            disabled={isSubmitting || !formData.email.trim()}
            className='w-full md:w-auto'
          >
            {isSubmitting ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' />
                Sending...
              </>
            ) : (
              <>
                <Send className='h-4 w-4 mr-2' />
                Send Full Analysis Report
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
