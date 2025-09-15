import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        success: 'bg-emerald-600 text-white hover:bg-emerald-700',
        warning: 'bg-amber-600 text-white hover:bg-amber-700',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        'outline-blue':
          'border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300',
        'outline-red':
          'border border-red-200 bg-white text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300',
        'outline-slate':
          'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300',
        'outline-green':
          'border border-green-200 bg-white text-green-700 hover:bg-green-50 hover:text-green-800 hover:border-green-300',
      },
      size: {
        default: 'h-12 px-4 py-3 min-h-[48px]',
        sm: 'h-10 rounded-md px-3 min-h-[44px]',
        lg: 'h-14 rounded-md px-8 min-h-[56px]',
        icon: 'h-12 w-12 min-h-[48px] min-w-[48px]',
        mobile: 'h-14 px-6 py-4 min-h-[56px] text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
