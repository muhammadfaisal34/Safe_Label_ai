import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 text-xs [&>svg+div]:translate-y-[-2px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-slate-950 [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-white text-slate-950 border-slate-200',
        success: 'border-emerald-200 bg-emerald-50/80 text-emerald-800 [&>svg]:text-emerald-600',
        destructive: 'border-red-200 bg-red-50/80 text-red-800 [&>svg]:text-red-600',
        info: 'border-blue-200 bg-blue-50/80 text-blue-800 [&>svg]:text-blue-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Alert = React.forwardRef(({ className, variant, children, ...props }, ref) => {
  const Icon = variant === 'success' ? CheckCircle2 : variant === 'destructive' ? AlertCircle : Info;

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon className="h-4 w-4" />
      <div>{children}</div>
    </div>
  );
});
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-xs [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
