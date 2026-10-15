'use client';

import { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Globe, LockKeyhole, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApiBase, setApiBase, getCurrentUser, login } from '@/lib/api';

export default function LoginScreen({ onLoginSuccess }) {
  const DEFAULT_BACKEND_URL =
    (typeof window !== 'undefined' && window.__BACKEND_API_URL__) ||
    'https://safelabel-api-g6cnaah8ardsfpfs.uaenorth-01.azurewebsites.net';
  const [email, setEmail] = useState('admin@safelabelai.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiUrl, setApiUrl] = useState(() => {
    const current = getApiBase();
    return current && !current.includes('localhost') ? current : DEFAULT_BACKEND_URL;
  });
  const [showApiConfig, setShowApiConfig] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const authData = await login(email, password);
      if (!authData.access_token) {
        throw new Error('Login failed. No access token received.');
      }
      localStorage.setItem('safelabel_token', authData.access_token);

      const user = await getCurrentUser();
      if (user.role !== 'admin') {
        localStorage.removeItem('safelabel_token');
        throw new Error(`Access denied: User account '${user.email}' has role '${user.role}'. Admin role is required.`);
      }

      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials or backend unreachable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#eef7ff] px-5 py-10">
      <div className="absolute -bottom-32 -left-20 h-64 w-[70%] rotate-12 rounded-[50%] bg-[#d7efff]" />
      <div className="absolute -bottom-40 right-[-10%] h-72 w-[65%] -rotate-6 rounded-[50%] bg-[#c6e6fb]" />
      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-2xl border border-white bg-white shadow-xl md:grid-cols-2">
        <section className="flex flex-col items-center justify-center bg-gradient-to-b from-white to-[#edf8ff] px-8 py-14 text-center md:px-12">
          <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[#e1f2ff] text-[#1269d3]">
            <ShieldCheck size={39} strokeWidth={1.8} />
          </div>
          <h1 className="font-heading text-3xl font-bold text-[#075cc2]">SafeLabel AI</h1>
          <p className="mt-2 text-sm font-semibold text-slate-700">Admin Panel</p>
          <span className="mt-4 text-xs font-bold text-slate-700">Secure. Monitor. Manage.</span>
          <p className="mt-2 max-w-xs text-xs leading-5 text-slate-400">
            Access the admin dashboard to manage users, products, scans and system configuration.
          </p>
        </section>

        <section className="px-8 py-12 md:px-12">
          <div className="mb-8">
            <h2 className="font-heading text-xl font-bold text-slate-800">Admin Login</h2>
            <p className="mt-1 text-xs text-slate-400">Sign in with an Administrator account</p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block text-xs font-semibold text-slate-600">
              Email Address
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-10"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@safelabelai.com"
                />
              </div>
            </label>

            <label className="block text-xs font-semibold text-slate-600">
              Password
              <div className="relative mt-2">
                <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-10 pr-10"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <Button className="h-11 w-full" type="submit" disabled={loading}>
              {loading ? <RefreshCw size={16} className="animate-spin mr-2" /> : null}
              {loading ? 'Authenticating...' : 'Log In'}
            </Button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowApiConfig(!showApiConfig)}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Globe size={13} />
                {showApiConfig ? 'Hide Backend URL' : 'Configure Backend URL (ngrok)'}
              </button>

              {showApiConfig && (
                <div className="mt-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-left">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    FastAPI Backend URL
                    <Input
                      type="url"
                      value={apiUrl}
                      onChange={(e) => {
                        setApiUrl(e.target.value);
                        setApiBase(e.target.value);
                      }}
                      placeholder="https://xxxx.ngrok-free.app"
                      className="mt-1 h-8 bg-white text-xs"
                    />
                  </label>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Enter custom URL or use the live Azure backend.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setApiUrl(DEFAULT_BACKEND_URL);
                      setApiBase(DEFAULT_BACKEND_URL);
                    }}
                    className="mt-2 text-[10px] font-semibold text-blue-600 hover:underline"
                  >
                    Reset to Default Backend API
                  </button>
                </div>
              )}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
