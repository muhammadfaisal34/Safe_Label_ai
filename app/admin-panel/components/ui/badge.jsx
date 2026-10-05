import { cn } from '@/lib/utils';

export function Badge({ children, variant = 'success', className }) { return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold', variant === 'success' && 'bg-emerald-50 text-emerald-600', variant === 'warning' && 'bg-amber-50 text-amber-600', variant === 'danger' && 'bg-red-50 text-red-600', variant === 'info' && 'bg-blue-50 text-blue-600', className)}>{children}</span>; }
