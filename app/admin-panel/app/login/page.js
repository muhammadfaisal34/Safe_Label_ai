'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginScreen from '@/components/login-screen';
import { getCurrentUser } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('safelabel_token') : null;
    if (token) {
      getCurrentUser()
        .then((user) => {
          if (user && user.role === 'admin') {
            router.push('/dashboard');
          }
        })
        .catch(() => {
          localStorage.removeItem('safelabel_token');
        });
    }
  }, [router]);

  const handleLoginSuccess = () => {
    router.push('/dashboard');
  };

  return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
}
