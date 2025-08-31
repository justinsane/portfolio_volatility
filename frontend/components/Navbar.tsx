'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Home, Info, MessageSquare } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: <Home className='h-4 w-4 sm:h-5 sm:w-5' />,
  },
  {
    href: '/about',
    label: 'About',
    icon: <Info className='h-4 w-4 sm:h-5 sm:w-5' />,
  },
  {
    href: '/feedback',
    label: 'Feedback',
    icon: <MessageSquare className='h-4 w-4 sm:h-5 sm:w-5' />,
  },
];

export default function Navbar() {
  const router = useRouter();

  return (
    <div
      className='fixed bottom-0 left-0 right-0 z-40'
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <Card className='mx-auto mb-0 max-w-6xl border-t bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-lg'>
        <nav className='flex items-center justify-around px-2 sm:px-3 py-3 sm:py-2'>
          {NAV_ITEMS.map(item => {
            const isActive = router.pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className='flex-1'>
                <Button
                  asChild
                  variant={isActive ? 'default' : 'ghost'}
                  size='sm'
                  className={`w-full h-12 sm:h-10 gap-1 sm:gap-2 ${
                    isActive
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className='inline-flex flex-col sm:flex-row items-center gap-1 sm:gap-2'>
                    {item.icon}
                    <span className='text-xs sm:text-sm font-medium'>
                      {item.label}
                    </span>
                  </span>
                </Button>
              </Link>
            );
          })}
        </nav>
      </Card>
    </div>
  );
}
