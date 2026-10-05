'use client';

import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginScreen({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  return <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#eef7ff] px-5 py-10">
    <div className="absolute -bottom-32 -left-20 h-64 w-[70%] rotate-12 rounded-[50%] bg-[#d7efff]" /><div className="absolute -bottom-40 right-[-10%] h-72 w-[65%] -rotate-6 rounded-[50%] bg-[#c6e6fb]" />
    <div className="relative grid w-full max-w-4xl overflow-hidden rounded-2xl border border-white bg-white shadow-xl md:grid-cols-2">
      <section className="flex flex-col items-center justify-center bg-gradient-to-b from-white to-[#edf8ff] px-8 py-14 text-center md:px-12"><div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[#e1f2ff] text-[#1269d3]"><ShieldCheck size={39} strokeWidth={1.8} /></div><h1 className="font-heading text-3xl font-bold text-[#075cc2]">SafeLabel AI</h1><p className="mt-2 text-sm font-semibold text-slate-700">Admin Panel</p><span className="mt-4 text-xs font-bold text-slate-700">Secure. Monitor. Manage.</span><p className="mt-2 max-w-xs text-xs leading-5 text-slate-400">Access the admin dashboard to manage users, products, scans and more.</p></section>
      <section className="px-8 py-12 md:px-12"><div className="mb-8"><h2 className="font-heading text-xl font-bold text-slate-800">Admin Login</h2><p className="mt-1 text-xs text-slate-400">Sign in to continue to your dashboard</p></div><form onSubmit={(event) => { event.preventDefault(); onLogin(); }} className="space-y-5"><label className="block text-xs font-semibold text-slate-600">Email or Username<div className="relative mt-2"><Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="pl-10" defaultValue="admin@safelabelai.com" /></div></label><label className="block text-xs font-semibold text-slate-600">Password<div className="relative mt-2"><LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="pl-10 pr-10" type={showPassword ? 'text' : 'password'} defaultValue="admin123" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label><div className="flex justify-end"><button type="button" className="text-[11px] font-semibold text-[#1269d3]">Forgot password?</button></div><Button className="h-11 w-full">Log In</Button></form></section>
    </div>
  </main>;
}
