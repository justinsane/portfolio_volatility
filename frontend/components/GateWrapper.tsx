'use client';
import { useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Lock, Eye } from 'lucide-react';
import GateModal from './ui/GateModal';

interface GateWrapperProps {
  children: ReactNode;
  gateId: string;
  title: string;
  description: string;
  benefits: string[];
  previewContent?: ReactNode;
  triggerType?: 'time' | 'click' | 'scroll' | 'engagement';
  triggerDelay?: number; // in milliseconds
  icon?: React.ReactNode;
  engagementThreshold?: number; // minimum scroll percentage or time spent
}

export default function GateWrapper({
  children,
  gateId,
  title,
  description,
  benefits,
  previewContent,
  triggerType = 'click',
  triggerDelay = 3000, // 3 seconds default
  icon,
  engagementThreshold = 50, // 50% scroll or 2 minutes engagement
}: GateWrapperProps) {
  const [isGated, setIsGated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [showPreview, setShowPreview] = useState(false); // Control when to show preview overlay
  const [engagementData, setEngagementData] = useState({
    timeSpent: 0,
    scrollPercentage: 0,
    hasScrolled: false,
  });

  // Check if user has already unlocked this gate
  useEffect(() => {
    const unlockedGates = JSON.parse(
      localStorage.getItem('unlockedGates') || '[]'
    );
    if (unlockedGates.includes(gateId)) {
      setIsGated(false);
    } else {
      setIsGated(true);
    }
  }, [gateId]);

  // Time-based trigger
  useEffect(() => {
    if (triggerType === 'time' && isGated && !hasTriggered) {
      const timer = setTimeout(() => {
        // Small delay to make it feel more natural
        setTimeout(() => {
          setShowPreview(true); // Show preview overlay first
        }, 1000);
        setHasTriggered(true);
      }, triggerDelay);

      return () => clearTimeout(timer);
    }
  }, [triggerType, isGated, hasTriggered, triggerDelay]);

  // Engagement-based trigger (time + scroll)
  useEffect(() => {
    if (triggerType === 'engagement' && isGated && !hasTriggered) {
      // Track time spent on page
      const timeInterval = setInterval(() => {
        setEngagementData(prev => ({
          ...prev,
          timeSpent: prev.timeSpent + 1, // seconds
        }));
      }, 1000);

      // Track scroll percentage with throttling
      let scrollTimeout: NodeJS.Timeout;
      const handleScroll = () => {
        if (scrollTimeout) return;

        scrollTimeout = setTimeout(() => {
          const scrollTop = window.pageYOffset;
          const docHeight =
            document.documentElement.scrollHeight - window.innerHeight;
          const scrollPercent = (scrollTop / docHeight) * 100;

          setEngagementData(prev => ({
            ...prev,
            scrollPercentage: Math.max(prev.scrollPercentage, scrollPercent),
            hasScrolled: true,
          }));
          scrollTimeout = null as any;
        }, 100); // Throttle to 100ms
      };

      window.addEventListener('scroll', handleScroll, { passive: true });

      return () => {
        clearInterval(timeInterval);
        window.removeEventListener('scroll', handleScroll);
        if (scrollTimeout) clearTimeout(scrollTimeout);
      };
    }
  }, [triggerType, isGated, hasTriggered]);

  // Check engagement threshold
  useEffect(() => {
    if (triggerType === 'engagement' && isGated && !hasTriggered) {
      const { timeSpent, scrollPercentage } = engagementData;

      // Trigger if user has spent enough time AND scrolled enough
      if (timeSpent >= (engagementThreshold || 120) && scrollPercentage >= 30) {
        // Small delay to make it feel more natural
        setTimeout(() => {
          setShowPreview(true); // Show preview overlay first
        }, 1000);
        setHasTriggered(true);
      }
    }
  }, [triggerType, isGated, hasTriggered, engagementData, engagementThreshold]);

  // Scroll-based trigger
  useEffect(() => {
    if (triggerType === 'scroll' && isGated && !hasTriggered) {
      let scrollTimeout: NodeJS.Timeout;
      const handleScroll = () => {
        if (scrollTimeout) return;

        scrollTimeout = setTimeout(() => {
          const element = document.getElementById(`gate-${gateId}`);
          if (element) {
            const rect = element.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

            if (isVisible) {
              // Small delay to make it feel more natural
              setTimeout(() => {
                setShowPreview(true); // Show preview overlay first
              }, 1000);
              setHasTriggered(true);
              window.removeEventListener('scroll', handleScroll);
            }
          }
          scrollTimeout = null as any;
        }, 100); // Throttle to 100ms
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', handleScroll);
        if (scrollTimeout) clearTimeout(scrollTimeout);
      };
    }
  }, [triggerType, gateId, isGated, hasTriggered]);

  const handleUnlock = useCallback(() => {
    const unlockedGates = JSON.parse(
      localStorage.getItem('unlockedGates') || '[]'
    );
    if (!unlockedGates.includes(gateId)) {
      unlockedGates.push(gateId);
      localStorage.setItem('unlockedGates', JSON.stringify(unlockedGates));
    }
    setIsGated(false);
    setShowModal(false);
    setShowPreview(false);
  }, [gateId]);

  const handleTriggerClick = useCallback(() => {
    if (triggerType === 'click') {
      setShowPreview(true);
    }
  }, [triggerType]);

  if (!isGated) {
    return <>{children}</>;
  }

  return (
    <div id={`gate-${gateId}`} className='relative'>
      {/* Show actual content first, then overlay when triggered */}
      {showPreview && previewContent ? (
        <div className='relative'>
          {previewContent}
          <div className='absolute inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-lg flex items-center justify-center p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-2xl'>
            <div className='text-center space-y-6 p-6 sm:p-8 max-w-md mx-auto bg-white/90 dark:bg-gray-800/90 rounded-xl border border-gray-200/60 dark:border-gray-600/60 shadow-xl'>
              <div className='mx-auto p-4 rounded-full bg-primary/15 border-2 border-primary/30 w-fit shadow-lg'>
                {icon || (
                  <Lock className='h-6 w-6 sm:h-8 sm:w-8 text-primary' />
                )}
              </div>
              <div className='space-y-3'>
                <h3 className='font-bold text-xl sm:text-2xl text-gray-900 dark:text-white leading-tight'>
                  Get Your Complete Portfolio Analysis
                </h3>
                <p className='text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed'>
                  Connect with a financial advisor for personalized insights and
                  actionable recommendations
                </p>
                <div className='inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-semibold border border-green-200 dark:border-green-700'>
                  <span className='w-2 h-2 bg-green-500 rounded-full'></span>
                  Free consultation with certified financial advisor
                </div>
              </div>
              <div className='space-y-3 pt-2'>
                <Button
                  onClick={() => setShowModal(true)}
                  size='mobile'
                  className='w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-4 sm:py-3 text-lg shadow-xl hover:shadow-2xl active:shadow-inner transition-all duration-200 touch-manipulation select-none cursor-pointer border-2 border-blue-500'
                >
                  <Eye className='h-5 w-5 mr-3 flex-shrink-0' />
                  <span className='whitespace-nowrap'>
                    Connect with Advisor
                  </span>
                </Button>
                <Button
                  variant='outline'
                  onClick={() => setShowPreview(false)}
                  size='mobile'
                  className='w-full text-base font-medium border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Show actual content when not gated or not yet triggered
        children
      )}

      {/* Gate Modal */}
      <GateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={title}
        description={description}
        benefits={benefits}
        icon={icon}
        onUnlock={handleUnlock}
      />
    </div>
  );
}
