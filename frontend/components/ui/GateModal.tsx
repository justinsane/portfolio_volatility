'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';
import { Badge } from './badge';
import { Lock, Users, TrendingUp, Shield, Star } from 'lucide-react';
import EmailSignup from './EmailSignup';
import {
  submitEmailSignup,
  type EmailSignupRequest,
  type EmailSignupResponse,
} from '@/lib/api';

interface GateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  benefits: string[];
  ctaText?: string;
  icon?: React.ReactNode;
  onUnlock?: () => void;
}

export default function GateModal({
  isOpen,
  onClose,
  title,
  description,
  benefits,
  ctaText = 'Connect with Financial Advisor',
  icon = <Lock className='h-6 w-6' />,
  onUnlock,
}: GateModalProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleEmailSubmit = async (
    data: EmailSignupRequest
  ): Promise<EmailSignupResponse> => {
    const response = await submitEmailSignup(data);
    setIsSubmitted(true);
    // Trigger unlock callback after successful submission
    setTimeout(() => {
      onUnlock?.();
    }, 2000); // Wait 2 seconds to show success message
    return response;
  };

  const handleClose = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md max-h-[90vh] overflow-y-auto'>
        <DialogHeader className='text-center space-y-4'>
          <div className='mx-auto p-3 rounded-full bg-primary/10 border border-primary/20 w-fit'>
            {icon}
          </div>
          <DialogTitle className='text-xl font-bold text-foreground'>
            {title}
          </DialogTitle>
          <DialogDescription className='text-base text-muted-foreground'>
            {description}
          </DialogDescription>
          <div className='bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-primary/80'>
            💡 Provide your contact info to unlock this analysis and get
            personalized recommendations
          </div>
        </DialogHeader>

        {!isSubmitted ? (
          <div className='space-y-6'>
            {/* Benefits Section */}
            <div className='space-y-3'>
              <h4 className='font-semibold text-sm text-foreground flex items-center gap-2'>
                <Star className='h-4 w-4 text-yellow-500' />
                What you&apos;ll get:
              </h4>
              <div className='space-y-2'>
                {benefits.map((benefit, index) => (
                  <div key={index} className='flex items-start gap-3 text-sm'>
                    <div className='w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0' />
                    <span className='text-muted-foreground'>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Proof */}
            <div className='bg-muted/50 rounded-lg p-4 space-y-2'>
              <div className='flex items-center gap-2 text-sm font-medium text-foreground'>
                <Users className='h-4 w-4 text-primary' />
                Trusted by 500+ investors
              </div>
              <div className='flex items-center gap-1'>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className='h-4 w-4 fill-yellow-400 text-yellow-400'
                  />
                ))}
                <span className='text-sm text-muted-foreground ml-2'>
                  4.9/5 rating
                </span>
              </div>
            </div>

            {/* Email Signup Form */}
            <div className='border-t pt-4'>
              <EmailSignup onSubmit={handleEmailSubmit} />
            </div>
          </div>
        ) : (
          <div className='text-center space-y-6 py-6 px-4 sm:px-6'>
            {/* Large success icon with better styling */}
            <div className='flex justify-center'>
              <div className='p-4 sm:p-5 rounded-full bg-green-100 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-800 shadow-sm'>
                <Shield className='h-8 w-8 sm:h-10 sm:w-10 text-green-600 dark:text-green-400' />
              </div>
            </div>

            {/* Success message with improved typography */}
            <div className='space-y-4'>
              <h3 className='text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400'>
                Thank you!
              </h3>
              <p className='text-sm sm:text-base text-green-600 dark:text-green-300 leading-relaxed max-w-sm mx-auto'>
                A financial advisor will contact you within 24 hours to discuss
                your portfolio analysis and personalized recommendations.
              </p>
            </div>

            {/* Visual separator */}
            <div className='flex justify-center'>
              <div className='w-16 h-1 bg-green-300 dark:bg-green-600 rounded-full'></div>
            </div>

            {/* Continue button with better styling */}
            <Button
              onClick={handleClose}
              className='w-full h-11 sm:h-12 text-sm sm:text-base font-medium bg-green-600 hover:bg-green-700 text-white border-0'
            >
              Continue Exploring
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
