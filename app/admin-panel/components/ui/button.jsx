import { cn } from '@/lib/utils';

export function Button({ className, variant = 'default', size = 'default', ...props }) {
  return <button className={cn('inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50', variant === 'default' && 'bg-[#1269d3] text-white hover:bg-[#0c58b7]', variant === 'outline' && 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50', variant === 'ghost' && 'text-slate-500 hover:bg-slate-100 hover:text-slate-800', variant === 'danger' && 'text-red-600 hover:bg-red-50', size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm', className)} {...props} />;
}
