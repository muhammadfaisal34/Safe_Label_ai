'use client';

import { useEffect, useState } from 'react';
import LoginScreen from '@/components/login-screen';
import AdminShell from '@/components/admin-shell';
import { getCurrentUser } from '@/lib/api';

export default function Page() {
  const [user, setUser] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('safelabel_token') : null;
    if (token) {
      getCurrentUser()
        .then((u) => {
          if (u && u.role === 'admin') {
            setUser(u);
            setAuthenticated(true);
          } else {
            localStorage.removeItem('safelabel_token');
            setAuthenticated(false);
          }
        })
        .catch(() => {
          localStorage.removeItem('safelabel_token');
          setAuthenticated(false);
        })
        .finally(() => {
          setInitializing(false);
        });
    } else {
      setInitializing(false);
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('safelabel_token');
    }
    setUser(null);
    setAuthenticated(false);
  };

  const handleLoginSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setAuthenticated(true);
  };

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f9fd]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1269d3] border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500">Verifying Admin Session...</p>
        </div>
      </div>
    );
  }

  return authenticated ? (
    <AdminShell user={user} onLogout={handleLogout} />
  ) : (
    <LoginScreen onLoginSuccess={handleLoginSuccess} />
  );
}
