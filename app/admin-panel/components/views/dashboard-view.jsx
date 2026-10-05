'use client';

import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle, Database, Package, RefreshCw, ScanLine, ShieldCheck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getAdminScans, getAdminStats } from '@/lib/api';

export default function DashboardView() {
  const [stats, setStats] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, scansData] = await Promise.all([
        getAdminStats(),
        getAdminScans().catch(() => []),
      ]);
      setStats(statsData);
      setRecentScans(Array.isArray(scansData) ? scansData.slice(0, 5) : []);
    } catch (err) {
      setError(err.message || 'Failed to load live dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const metrics = [
    { label: 'Total Users', value: stats?.users ?? '-', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', sub: 'Registered accounts' },
    { label: 'Total Products', value: stats?.products ?? '-', icon: Package, color: 'text-emerald-500', bg: 'bg-emerald-50', sub: 'Indexed in catalog' },
    { label: 'Total Scans', value: stats?.scans ?? '-', icon: ScanLine, color: 'text-purple-500', bg: 'bg-purple-50', sub: 'Processed scans' },
    { label: 'Allergen Detections', value: stats?.detections ?? '-', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', sub: 'Danger verdicts flagged' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">Real-time telemetry and database metrics</p>
        <Button size="sm" variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh Data
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label} className="border-slate-100 shadow-sm transition hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${m.bg} ${m.color}`}>
                  <m.icon size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live</span>
              </div>
              <p className="mt-4 text-xs font-medium text-slate-500">{m.label}</p>
              <strong className="mt-1 block font-heading text-3xl font-bold text-slate-800">
                {m.value}
              </strong>
              <span className="mt-2 block text-[11px] text-slate-400">{m.sub}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Scans & System Status */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Scans */}
        <Card className="border-slate-100 shadow-sm lg:col-span-2">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h3 className="font-heading text-sm font-bold text-slate-800">Recent Label Scans</h3>
                <p className="mt-0.5 text-xs text-slate-400">Latest activity from mobile devices & web OCR</p>
              </div>
              <Activity size={16} className="text-slate-400" />
            </div>

            {recentScans.length === 0 ? (
              <p className="p-6 text-xs text-slate-400">No scans recorded yet in the database.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-5 py-3 font-semibold text-slate-400">Product</th>
                      <th className="px-5 py-3 font-semibold text-slate-400">User</th>
                      <th className="px-5 py-3 font-semibold text-slate-400">Verdict</th>
                      <th className="px-5 py-3 font-semibold text-slate-400">Source</th>
                      <th className="px-5 py-3 font-semibold text-slate-400">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentScans.map((s, idx) => (
                      <tr key={s.id || idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-700">
                          {s.product_name || 'Scanned Label'}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">
                          {s.user_name || 'Anonymous'}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5">
                          <Badge variant={s.verdict === 'danger' ? 'danger' : s.verdict === 'caution' ? 'warning' : 'success'}>
                            {s.verdict}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 uppercase text-slate-400 text-[10px] font-mono">
                          {s.source}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-slate-400 text-[11px]">
                          {s.created_at ? new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-heading text-sm font-bold text-slate-800">System Architecture</h3>
            <p className="mt-0.5 text-xs text-slate-400">Backend and database connection status</p>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-[#f8fbfe] p-3">
                <div className="flex items-center gap-3">
                  <Database size={16} className="text-[#1269d3]" />
                  <div>
                    <p className="text-xs font-semibold text-slate-700">PostgreSQL DB</p>
                    <p className="text-[10px] text-slate-400">port 5432 / safelabel</p>
                  </div>
                </div>
                <Badge variant={stats ? 'success' : 'warning'}>
                  {stats ? 'Connected' : 'Connecting'}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-[#f8fbfe] p-3">
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-emerald-500" />
                  <div>
                    <p className="text-xs font-semibold text-slate-700">FastAPI Engine</p>
                    <p className="text-[10px] text-slate-400">Bearer Auth / Uvicorn</p>
                  </div>
                </div>
                <Badge variant="success">Online</Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-[#f8fbfe] p-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={16} className="text-purple-500" />
                  <div>
                    <p className="text-xs font-semibold text-slate-700">AI / NER Pipeline</p>
                    <p className="text-[10px] text-slate-400">spaCy + Allergen Matching</p>
                  </div>
                </div>
                <Badge variant="info">Active</Badge>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-blue-50/60 p-3 text-[11px] text-blue-800">
              <span className="font-semibold">Security Note:</span> Admin session authenticated via JWT with automated token refresh.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
