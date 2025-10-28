'use client';
import { useState, useCallback, memo } from 'react';
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

const GateModal = memo(function GateModal({
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

  const handleEmailSubmit = useCallback(
    async (data: EmailSignupRequest): Promise<EmailSignupResponse> => {
      const response = await submitEmailSignup(data);
      setIsSubmitted(true);
      // Trigger unlock callback after successful submission
      setTimeout(() => {
        onUnlock?.();
      }, 2000); // Wait 2 seconds to show success message
      return response;
    },
    [onUnlock]
  );

  const handleClose = useCallback(() => {
    setIsSubmitted(false);
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md max-h-[95vh] overflow-y-auto mx-2 sm:mx-4 bg-background border-2 shadow-2xl'>
        <DialogHeader className='text-center space-y-3 sm:space-y-4 px-1 sm:px-2'>
          <div className='mx-auto p-3 sm:p-4 rounded-full bg-primary/10 border border-primary/20 w-fit'>
            {icon}
          </div>
          <DialogTitle className='text-lg sm:text-xl lg:text-2xl font-bold text-foreground leading-tight px-2'>
            {title}
          </DialogTitle>
          <DialogDescription className='text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed px-2'>
            {description}
          </DialogDescription>
          <div className='bg-primary/5 border border-primary/20 rounded-lg p-3 sm:p-4 text-xs sm:text-sm lg:text-base text-primary/80 leading-relaxed'>
            💡 <strong>Free consultation:</strong> Provide your contact info to
            unlock this analysis and get personalized recommendations from a
            certified financial advisor
          </div>
        </DialogHeader>

        {!isSubmitted ? (
          <div className='space-y-4 sm:space-y-6 px-1 sm:px-2'>
            {/* Benefits Section */}
            <div className='space-y-3 sm:space-y-4'>
              <h4 className='font-semibold text-sm sm:text-base lg:text-lg text-foreground flex items-center gap-2'>
                <Star className='h-4 w-4 sm:h-5 sm:w-5 text-yellow-500' />
                What you&apos;ll get:
              </h4>
              <div className='space-y-2 sm:space-y-3'>
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className='flex items-start gap-2 sm:gap-3 text-xs sm:text-sm lg:text-base'
                  >
                    <div className='w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-primary mt-1.5 sm:mt-2 flex-shrink-0' />
                    <span className='text-muted-foreground leading-relaxed'>
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Proof */}
            <div className='bg-muted/50 rounded-lg p-3 sm:p-4 lg:p-5 space-y-2 sm:space-y-3'>
              <div className='flex items-center gap-2 text-xs sm:text-sm lg:text-base font-medium text-foreground'>
                <Users className='h-4 w-4 sm:h-5 sm:w-5 text-primary' />
                Trusted by 500+ investors
              </div>
              <div className='flex items-center gap-1'>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className='h-4 w-4 sm:h-5 sm:w-5 fill-yellow-400 text-yellow-400'
                  />
                ))}
                <span className='text-xs sm:text-sm lg:text-base text-muted-foreground ml-2'>
                  4.9/5 rating
                </span>
              </div>
              <div className='text-xs sm:text-sm text-muted-foreground/80 italic'>
                &ldquo;This analysis helped me identify risks I never knew
                existed in my portfolio.&rdquo; - Sarah M.
              </div>
            </div>

            {/* Email Signup Form */}
            <div className='border-t pt-3 sm:pt-4'>
              <EmailSignup onSubmit={handleEmailSubmit} />
            </div>
          </div>
        ) : (
          <div className='text-center space-y-4 sm:space-y-6 py-4 sm:py-6 px-3 sm:px-4 lg:px-6'>
            {/* Large success icon with better styling */}
            <div className='flex justify-center'>
              <div className='p-4 sm:p-5 lg:p-6 rounded-full bg-green-100 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-800 shadow-sm'>
                <Shield className='h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-green-600 dark:text-green-400' />
              </div>
            </div>

            {/* Success message with improved typography */}
            <div className='space-y-3 sm:space-y-4'>
              <h3 className='text-xl sm:text-2xl lg:text-3xl font-bold text-green-700 dark:text-green-400'>
                Thank you!
              </h3>
              <p className='text-sm sm:text-base lg:text-lg text-green-600 dark:text-green-300 leading-relaxed max-w-md mx-auto px-2'>
                A financial advisor will contact you within 24 hours to discuss
                your portfolio analysis and personalized recommendations.
              </p>
            </div>

            {/* Visual separator */}
            <div className='flex justify-center'>
              <div className='w-16 sm:w-20 h-1 bg-green-300 dark:bg-green-600 rounded-full'></div>
            </div>

            {/* Continue button with better styling */}
            <Button
              onClick={handleClose}
              size='mobile'
              className='w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white border-0 shadow-lg hover:shadow-xl active:shadow-inner transition-all duration-200 touch-manipulation select-none cursor-pointer min-h-[48px] sm:min-h-[52px]'
            >
              Continue Exploring
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});

export default GateModal;
