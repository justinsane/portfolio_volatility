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
    phone: '',
    preferred_contact_time: '',
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
        phone: formData.phone.trim() || undefined,
        preferred_contact_time:
          formData.preferred_contact_time.trim() || undefined,
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
      <Card className='border-2 border-green-200 bg-green-50 dark:bg-green-950/20 mx-2 sm:mx-0'>
        <CardContent className='pt-6 pb-6 px-4 sm:px-6'>
          <div className='text-center space-y-4'>
            {/* Large success icon */}
            <div className='flex justify-center'>
              <div className='p-4 sm:p-5 rounded-full bg-green-100 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-800'>
                <CheckCircle className='h-8 w-8 sm:h-10 sm:w-10 text-green-600 dark:text-green-400' />
              </div>
            </div>

            {/* Success message */}
            <div className='space-y-3'>
              <h3 className='text-lg sm:text-xl font-bold text-green-700 dark:text-green-400'>
                Thank you!
              </h3>
              <p className='text-sm sm:text-base text-green-600 dark:text-green-300 leading-relaxed max-w-md mx-auto'>
                A financial advisor will contact you within 24 hours to discuss
                your portfolio analysis and personalized recommendations.
              </p>
            </div>

            {/* Additional visual element */}
            <div className='flex justify-center pt-2'>
              <div className='w-12 h-1 bg-green-300 dark:bg-green-600 rounded-full'></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='border-2 border-border/50 mx-2 sm:mx-0'>
      <CardHeader className='pb-4 px-4 sm:px-6'>
        <CardTitle className='flex flex-col sm:flex-row items-start sm:items-center gap-3 text-lg sm:text-xl'>
          <div className='p-3 rounded-lg bg-primary/10 border border-primary/20 flex-shrink-0'>
            <Mail className='h-5 w-5 sm:h-6 sm:w-6 text-primary' />
          </div>
          <span className='leading-tight'>Unlock Your Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent className='pt-0 px-4 sm:px-6'>
        <form onSubmit={handleSubmit} className='space-y-5'>
          <div className='grid grid-cols-1 gap-5'>
            <div className='space-y-2'>
              <Label
                htmlFor='name'
                className='text-sm sm:text-base font-medium'
              >
                Name (optional)
              </Label>
              <Input
                id='name'
                type='text'
                placeholder='Your name'
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                disabled={isSubmitting}
                className='h-12 text-base'
              />
            </div>
            <div className='space-y-2'>
              <Label
                htmlFor='email'
                className='text-sm sm:text-base font-medium'
              >
                Email Address *
              </Label>
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
                className='h-12 text-base'
              />
            </div>
            <div className='space-y-2'>
              <Label
                htmlFor='phone'
                className='text-sm sm:text-base font-medium'
              >
                Phone Number (optional)
              </Label>
              <Input
                id='phone'
                type='tel'
                placeholder='(555) 123-4567'
                value={formData.phone}
                onChange={e =>
                  setFormData(prev => ({ ...prev, phone: e.target.value }))
                }
                disabled={isSubmitting}
                className='h-12 text-base'
              />
            </div>
            <div className='space-y-2'>
              <Label
                htmlFor='preferred_contact_time'
                className='text-sm sm:text-base font-medium'
              >
                Preferred Contact Time (optional)
              </Label>
              <select
                id='preferred_contact_time'
                value={formData.preferred_contact_time}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    preferred_contact_time: e.target.value,
                  }))
                }
                disabled={isSubmitting}
                className='flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              >
                <option value=''>Select preferred time</option>
                <option value='morning'>Morning (9 AM - 12 PM)</option>
                <option value='afternoon'>Afternoon (12 PM - 5 PM)</option>
                <option value='evening'>Evening (5 PM - 8 PM)</option>
                <option value='anytime'>Anytime</option>
              </select>
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
            size='mobile'
            className='w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-lg hover:shadow-xl active:shadow-inner transition-all duration-200 touch-manipulation select-none cursor-pointer'
          >
            {isSubmitting ? (
              <>
                <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3' />
                <span className='whitespace-nowrap'>
                  <span className='hidden sm:inline'>Sending...</span>
                  <span className='sm:hidden'>Sending...</span>
                </span>
              </>
            ) : (
              <>
                <Send className='h-5 w-5 mr-3 flex-shrink-0' />
                <span className='whitespace-nowrap'>
                  <span className='hidden sm:inline'>
                    Unlock Analysis & Get Recommendations
                  </span>
                  <span className='sm:hidden'>Unlock Analysis</span>
                </span>
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
