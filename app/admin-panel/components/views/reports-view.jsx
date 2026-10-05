'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, BarChart3, ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getAdminReports } from '@/lib/api';

export default function ReportsView() {
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminReports();
      setReports(data || {});
    } catch (err) {
      setError(err.message || 'Failed to load platform analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const verdicts = reports.verdicts || {};
  const sources = reports.sources || {};
  const total = reports.total_scans || 1;

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
            <CardTitle>Platform Analytics & Reports</CardTitle>
            <CardDescription className="mt-1">
              Detailed safety ratios, allergen detection metrics, and scan sources
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={loadReports} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-emerald-50/40 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">Overall Safety Ratio</p>
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <strong className="mt-3 block text-3xl font-bold text-emerald-600">
                {reports.safety_rate ?? 100}%
              </strong>
              <p className="mt-1 text-[11px] text-slate-400">Percentage of scans clear of user allergens</p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-red-50/40 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">Danger Alerts Flagged</p>
                <ShieldAlert className="h-5 w-5 text-red-600" />
              </div>
              <strong className="mt-3 block text-3xl font-bold text-red-600">
                {reports.danger_count ?? 0}
              </strong>
              <p className="mt-1 text-[11px] text-slate-400">Scans containing matched allergens</p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-amber-50/40 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">Trace Precaution Warnings</p>
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <strong className="mt-3 block text-3xl font-bold text-amber-600">
                {reports.caution_count ?? 0}
              </strong>
              <p className="mt-1 text-[11px] text-slate-400">Potential cross-contamination warnings</p>
            </div>
          </div>

          {/* Breakdown Section */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-slate-100 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-700">Verdict Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {['safe', 'danger', 'caution'].map((k) => {
                  const count = verdicts[k] || 0;
                  const pct = Math.round((count / total) * 100);
                  const color =
                    k === 'safe'
                      ? 'bg-emerald-500'
                      : k === 'danger'
                      ? 'bg-red-500'
                      : 'bg-amber-500';
                  return (
                    <div key={k} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="capitalize text-slate-700">{k}</span>
                        <span className="text-slate-400">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-700">Scan Channels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.keys(sources).length > 0 ? (
                  Object.entries(sources).map(([k, count]) => {
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={k} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="font-mono uppercase text-slate-700">{k}</span>
                          <span className="text-slate-400">{count} scans</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full bg-blue-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400">No scan channel data available.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
