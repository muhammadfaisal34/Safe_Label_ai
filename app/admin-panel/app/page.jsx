'use client';

import { useState } from 'react';
import LoginScreen from '@/components/login-screen';
import AdminShell from '@/components/admin-shell';

export default function Page() {
  const [authenticated, setAuthenticated] = useState(false);
  return authenticated ? <AdminShell onLogout={() => setAuthenticated(false)} /> : <LoginScreen onLogin={() => setAuthenticated(true)} />;
}
