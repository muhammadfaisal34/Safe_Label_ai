'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/admin-shell';
import { getCurrentUser } from '@/lib/api';

export default function AdminRouteGroupLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('safelabel_token') : null;
    if (!token) {
      setLoading(false);
      router.push('/login');
      return;
    }

    getCurrentUser()
      .then((u) => {
        if (u && u.role === 'admin') {
          setUser(u);
        } else {
          localStorage.removeItem('safelabel_token');
          router.push('/login');
        }
      })
      .catch(() => {
        localStorage.removeItem('safelabel_token');
        router.push('/login');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('safelabel_token');
    }
    setUser(null);
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f9fd]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1269d3] border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500">Verifying Admin Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AdminShell user={user} onLogout={handleLogout}>
      {children}
    </AdminShell>
  );
}
