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
          <div className='absolute inset-0 bg-background/90 backdrop-blur-sm rounded-lg flex items-center justify-center p-4'>
            <div className='text-center space-y-4 p-4 sm:p-6 max-w-sm mx-auto'>
              <div className='mx-auto p-4 rounded-full bg-primary/10 border border-primary/20 w-fit'>
                {icon || (
                  <Lock className='h-6 w-6 sm:h-8 sm:w-8 text-primary' />
                )}
              </div>
              <div>
                <h3 className='font-semibold text-lg sm:text-xl text-foreground leading-tight'>
                  Unlock Detailed Analysis
                </h3>
                <p className='text-sm sm:text-base text-muted-foreground mt-2 leading-relaxed'>
                  Get personalized insights and 20+ recommendations
                </p>
                <div className='mt-3 text-sm text-primary/80 font-medium'>
                  ✓ Free consultation with financial advisor
                </div>
              </div>
              <div className='space-y-3'>
                <Button
                  onClick={() => setShowModal(true)}
                  size='mobile'
                  className='w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-lg hover:shadow-xl active:shadow-inner transition-all duration-200 touch-manipulation select-none cursor-pointer'
                >
                  <Eye className='h-5 w-5 mr-3 flex-shrink-0' />
                  <span className='whitespace-nowrap'>Get Free Analysis</span>
                </Button>
                <Button
                  variant='outline'
                  onClick={() => setShowPreview(false)}
                  size='mobile'
                  className='w-full text-base'
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
