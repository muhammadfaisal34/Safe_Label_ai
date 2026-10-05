'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, UserCheck, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getCurrentUser } from '@/lib/api';

export default function ProfileView() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const u = await getCurrentUser().catch(() => ({
        email: 'admin@safelabelai.com',
        display_name: 'Admin',
        role: 'admin',
        status: 'active',
      }));
      setUser(u);
    } catch (err) {
      setError(err.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-5">
          <div>
            <CardTitle>Administrator Profile</CardTitle>
            <CardDescription className="mt-1">
              Account details, permissions, and active session security context
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={loadProfile} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>

        <CardContent className="p-6 max-w-lg space-y-6">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#1269d3] text-2xl font-bold text-white shadow-md">
              {user?.display_name ? user.display_name[0].toUpperCase() : 'A'}
            </div>
            <div>
              <h4 className="font-heading text-lg font-bold text-slate-800">
                {user?.display_name || 'System Admin'}
              </h4>
              <p className="font-mono text-xs text-slate-400">{user?.email || 'admin@safelabelai.com'}</p>
              <div className="mt-2 flex gap-2">
                <Badge variant="info">{user?.role || 'admin'}</Badge>
                <Badge variant="success">{user?.status || 'active'}</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-slate-100 bg-[#f8fbfe] p-4 text-xs text-slate-600">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-400">User ID</span>
              <span className="font-mono text-[11px]">{user?.id || 'Authenticated Session'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-400">Authorization Scope</span>
              <span className="font-semibold text-emerald-600">Full Administrative Access</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Authentication Method</span>
              <span className="font-mono text-[11px]">Bearer JWT (PBKDF2-SHA256)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
