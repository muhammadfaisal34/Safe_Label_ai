import { cn } from '@/lib/utils';

export function Card({ className, ...props }) { return <div className={cn('rounded-xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(30,80,140,0.04)]', className)} {...props} />; }
export function CardHeader({ className, ...props }) { return <div className={cn('flex items-start justify-between gap-4 px-5 pt-5', className)} {...props} />; }
export function CardTitle({ className, ...props }) { return <h3 className={cn('font-heading text-sm font-bold text-slate-800', className)} {...props} />; }
export function CardDescription({ className, ...props }) { return <p className={cn('mt-1 text-xs text-slate-400', className)} {...props} />; }
export function CardContent({ className, ...props }) { return <div className={cn('px-5 pb-5', className)} {...props} />; }
