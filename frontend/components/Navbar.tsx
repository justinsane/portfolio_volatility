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
  { href: '/', label: 'Home', icon: <Home className='h-5 w-5' /> },
  { href: '/about', label: 'About', icon: <Info className='h-5 w-5' /> },
  {
    href: '/feedback',
    label: 'Feedback',
    icon: <MessageSquare className='h-5 w-5' />,
  },
];

export default function Navbar() {
  const router = useRouter();

  return (
    <div
      className='fixed bottom-0 left-0 right-0 z-50'
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <Card className='mx-auto mb-0 max-w-6xl border-t bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70'>
        <nav className='flex items-center justify-around px-3 py-2'>
          {NAV_ITEMS.map(item => {
            const isActive = router.pathname === item.href;
            return (
              <Link key={item.href} href={item.href} passHref legacyBehavior>
                <Button
                  asChild
                  variant={isActive ? 'default' : 'ghost'}
                  size='sm'
                  className={
                    isActive
                      ? 'gap-2'
                      : 'gap-2 text-gray-700 hover:text-gray-900'
                  }
                >
                  <a aria-current={isActive ? 'page' : undefined}>
                    <span className='inline-flex items-center gap-2'>
                      {item.icon}
                      <span className='text-sm'>{item.label}</span>
                    </span>
                  </a>
                </Button>
              </Link>
            );
          })}
        </nav>
      </Card>
    </div>
  );
}
