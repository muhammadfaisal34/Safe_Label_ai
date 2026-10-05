import { cn } from '@/lib/utils';

export function Input({ className, ...props }) { return <input className={cn('h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100', className)} {...props} />; }
