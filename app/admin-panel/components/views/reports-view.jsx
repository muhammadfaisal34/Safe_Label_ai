'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  RefreshCw,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Download,
  FileSpreadsheet,
  FileJson,
  Calendar,
  Filter,
  Search,
  Package,
  Users,
  Activity,
  Layers,
  ArrowUpRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { getAdminReports } from '@/lib/api';

export default function ReportsView() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [daysFilter, setDaysFilter] = useState('all');
  const [verdictFilter, setVerdictFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (daysFilter !== 'all') params.days = parseInt(daysFilter, 10);
      if (verdictFilter !== 'all') params.verdict = verdictFilter;
      if (sourceFilter !== 'all') params.source = sourceFilter;

      const data = await getAdminReports(params);
      setReports(data || {});
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err.message || 'Failed to load platform analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [daysFilter, verdictFilter, sourceFilter]);

  // Derived values from real database response
  const total = reports?.total_scans ?? 0;
  const safeCount = reports?.safe_count ?? (reports?.verdicts?.safe ?? 0);
  const dangerCount = reports?.danger_count ?? (reports?.verdicts?.danger ?? 0);
  const cautionCount = reports?.caution_count ?? (reports?.verdicts?.caution ?? 0);
  const safetyRate = reports?.safety_rate ?? (total > 0 ? Math.round((safeCount / total) * 100) : 0);
  const uniqueProducts = reports?.unique_products ?? 0;
  const uniqueUsers = reports?.unique_users ?? 0;
  const avgAllergens = reports?.avg_allergens_per_flagged ?? 0;
  const verdicts = reports?.verdicts || {};
  const sources = reports?.sources || {};
  const topAllergens = reports?.top_allergens || [];
  const dailyTimeline = reports?.daily_timeline || [];
  const categoryRisk = reports?.category_risk || [];
  const recentScans = reports?.recent_scans || [];

  // Client-side search within current incident list
  const filteredScans = useMemo(() => {
    if (!searchQuery.trim()) return recentScans;
    const q = searchQuery.toLowerCase().trim();
    return recentScans.filter((s) => {
      const pName = (s.product_name || '').toLowerCase();
      const bCode = (s.barcode || '').toLowerCase();
      const uName = (s.user_name || '').toLowerCase();
      const allergens = (s.detected_allergens || []).join(' ').toLowerCase();
      return pName.includes(q) || bCode.includes(q) || uName.includes(q) || allergens.includes(q);
    });
  }, [recentScans, searchQuery]);

  // Max daily count for chart scaling
  const maxDailyCount = useMemo(() => {
    if (!dailyTimeline.length) return 1;
    const maxVal = Math.max(...dailyTimeline.map((d) => d.total));
    return maxVal > 0 ? maxVal : 1;
  }, [dailyTimeline]);

  // CSV Export
  const handleExportCSV = () => {
    if (!recentScans.length) {
      alert('No scan records to export.');
      return;
    }
    const headers = ['Scan ID', 'Product Name', 'Barcode', 'User', 'Verdict', 'Detected Allergens', 'Source', 'Language', 'Scanned At'];
    const rows = recentScans.map((s) => [
      `"${s.id || ''}"`,
      `"${(s.product_name || '').replace(/"/g, '""')}"`,
      `"${s.barcode || ''}"`,
      `"${(s.user_name || '').replace(/"/g, '""')}"`,
      `"${(s.verdict || '').toUpperCase()}"`,
      `"${(s.detected_allergens || []).join(', ').replace(/"/g, '""')}"`,
      `"${(s.source || '').toUpperCase()}"`,
      `"${s.language || 'en'}"`,
      `"${s.created_at || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `safelabel-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON Export
  const handleExportJSON = () => {
    if (!reports) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reports, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `safelabel-analytics-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
          <AlertTitle>Connection Notice</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Header & Controls */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-xl font-bold tracking-tight text-slate-800">Platform Analytics & Reports</h1>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Live telemetry aggregated directly from PostgreSQL database. Zero mock data.
              {lastRefreshed && (
                <span className="ml-2 font-mono text-[11px] text-slate-400">
                  Last updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExportCSV} disabled={loading || total === 0} title="Export CSV">
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              Export CSV
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportJSON} disabled={loading || total === 0} title="Export JSON">
              <FileJson className="h-3.5 w-3.5 text-blue-600" />
              JSON
            </Button>
            <Button size="sm" onClick={loadReports} disabled={loading} className="bg-slate-900 text-white hover:bg-slate-800">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Time Period Selector */}
            <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-xs font-medium text-slate-600">
              {[
                { label: 'All Time', val: 'all' },
                { label: '30 Days', val: '30' },
                { label: '14 Days', val: '14' },
                { label: '7 Days', val: '7' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setDaysFilter(opt.val)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    daysFilter === opt.val
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Verdict Filter */}
            <select
              value={verdictFilter}
              onChange={(e) => setVerdictFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Verdicts</option>
              <option value="danger">Danger Only</option>
              <option value="caution">Caution Only</option>
              <option value="safe">Safe Only</option>
            </select>

            {/* Channel Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Channels</option>
              <option value="ocr">OCR (Image Scans)</option>
              <option value="barcode">Barcode Lookups</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-400">
              Matched: <strong className="text-slate-700">{total}</strong> scans in database
            </span>
          </div>
        </div>
      </div>

      {/* Executive KPI Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Total Scans */}
        <Card className="border-slate-200/80 shadow-2xs transition hover:shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Scans</span>
              <Activity className="h-4 w-4 text-slate-500" />
            </div>
            <strong className="mt-2 block text-2xl font-bold tracking-tight text-slate-800">{total}</strong>
            <p className="mt-1 text-[11px] text-slate-400">From devices & portal</p>
          </CardContent>
        </Card>

        {/* Safety Rate */}
        <Card className="border-emerald-100 bg-emerald-50/20 shadow-2xs transition hover:shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Safety Ratio</span>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <strong className="mt-2 block text-2xl font-bold tracking-tight text-emerald-600">{safetyRate}%</strong>
            <p className="mt-1 text-[11px] text-emerald-600/70">{safeCount} clear scans</p>
          </CardContent>
        </Card>

        {/* Danger Alerts */}
        <Card className="border-red-100 bg-red-50/20 shadow-2xs transition hover:shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-red-700">Danger Alerts</span>
              <ShieldAlert className="h-4 w-4 text-red-600" />
            </div>
            <strong className="mt-2 block text-2xl font-bold tracking-tight text-red-600">{dangerCount}</strong>
            <p className="mt-1 text-[11px] text-red-600/70">
              {total > 0 ? Math.round((dangerCount / total) * 100) : 0}% of all scans
            </p>
          </CardContent>
        </Card>

        {/* Caution Warnings */}
        <Card className="border-amber-100 bg-amber-50/20 shadow-2xs transition hover:shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">Precaution Traces</span>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <strong className="mt-2 block text-2xl font-bold tracking-tight text-amber-600">{cautionCount}</strong>
            <p className="mt-1 text-[11px] text-amber-600/70">Trace cross-contact</p>
          </CardContent>
        </Card>

        {/* Unique Products */}
        <Card className="border-slate-200/80 shadow-2xs transition hover:shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Products Tested</span>
              <Package className="h-4 w-4 text-blue-500" />
            </div>
            <strong className="mt-2 block text-2xl font-bold tracking-tight text-slate-800">{uniqueProducts}</strong>
            <p className="mt-1 text-[11px] text-slate-400">Unique labels in catalog</p>
          </CardContent>
        </Card>

        {/* Active Scanning Users */}
        <Card className="border-slate-200/80 shadow-2xs transition hover:shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Scanning Users</span>
              <Users className="h-4 w-4 text-purple-500" />
            </div>
            <strong className="mt-2 block text-2xl font-bold tracking-tight text-slate-800">{uniqueUsers}</strong>
            <p className="mt-1 text-[11px] text-slate-400">Active accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline Bar Chart */}
      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">Scan Activity & Trend Timeline</CardTitle>
              <CardDescription className="text-xs">
                Chronological volume of scans over time, grouped by health verdict
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500" />
                <span className="text-[11px] text-slate-500">Safe</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-amber-500" />
                <span className="text-[11px] text-slate-500">Caution</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-red-500" />
                <span className="text-[11px] text-slate-500">Danger</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {dailyTimeline.length === 0 || total === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Calendar className="h-8 w-8 text-slate-300" />
              <p className="mt-2 text-xs font-semibold text-slate-500">No scan activity recorded in this period</p>
              <p className="text-[11px] text-slate-400">When devices submit scans, daily trend bars will populate dynamically.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex h-44 items-end gap-2 border-b border-slate-100 pb-2">
                {dailyTimeline.map((day) => {
                  const dayTotal = day.total;
                  const safePct = dayTotal > 0 ? (day.safe / dayTotal) * 100 : 0;
                  const cautionPct = dayTotal > 0 ? (day.caution / dayTotal) * 100 : 0;
                  const dangerPct = dayTotal > 0 ? (day.danger / dayTotal) * 100 : 0;
                  const heightPct = dayTotal > 0 ? Math.max(12, Math.round((dayTotal / maxDailyCount) * 100)) : 4;

                  return (
                    <div key={day.date} className="group relative flex flex-1 flex-col items-center justify-end h-full">
                      {/* Tooltip on hover */}
                      <div className="pointer-events-none absolute -top-14 z-20 hidden -translate-x-1/2 flex-col items-center rounded-lg bg-slate-900 px-2.5 py-1.5 text-[10px] text-white shadow-lg group-hover:flex">
                        <span className="font-bold">{day.label}</span>
                        <span>{dayTotal} total scans</span>
                        <div className="mt-0.5 flex gap-1.5 text-[9px]">
                          <span className="text-emerald-400">{day.safe} safe</span>
                          <span className="text-amber-400">{day.caution} caut.</span>
                          <span className="text-red-400">{day.danger} dang.</span>
                        </div>
                      </div>

                      {/* Bar Stack */}
                      <div
                        className="w-full max-w-[36px] overflow-hidden rounded-t-md bg-slate-100 transition-all duration-300 group-hover:brightness-95 flex flex-col justify-end"
                        style={{ height: `${heightPct}%` }}
                      >
                        {dayTotal > 0 ? (
                          <>
                            {day.danger > 0 && <div className="bg-red-500 transition" style={{ height: `${dangerPct}%` }} />}
                            {day.caution > 0 && <div className="bg-amber-500 transition" style={{ height: `${cautionPct}%` }} />}
                            {day.safe > 0 && <div className="bg-emerald-500 transition" style={{ height: `${safePct}%` }} />}
                          </>
                        ) : (
                          <div className="h-1 w-full bg-slate-200" />
                        )}
                      </div>

                      {/* Date Label */}
                      <span className="mt-2 text-[10px] font-medium text-slate-400 group-hover:text-slate-800 transition">
                        {day.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Middle Section: Verdict Breakdown, Channels, Top Allergens */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Verdict Distribution */}
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-800">Verdict Distribution</CardTitle>
            <CardDescription className="text-xs">Database verdict segmentation</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {[
              { key: 'safe', label: 'Safe (No Matches)', count: safeCount, color: 'bg-emerald-500', text: 'text-emerald-600', badge: 'success' },
              { key: 'danger', label: 'Danger (Allergen Trigger)', count: dangerCount, color: 'bg-red-500', text: 'text-red-600', badge: 'danger' },
              { key: 'caution', label: 'Caution (Trace Warning)', count: cautionCount, color: 'bg-amber-500', text: 'text-amber-600', badge: 'warning' },
            ].map((item) => {
              const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
              return (
                <div key={item.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700">{item.label}</span>
                    <span className="font-mono text-slate-500">
                      {item.count} <span className="font-normal text-slate-400">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full ${item.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Scan Channels */}
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-800">Scan Ingestion Channels</CardTitle>
            <CardDescription className="text-xs">Dynamic source telemetry from database</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {Object.keys(sources).length > 0 ? (
              Object.entries(sources).map(([k, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={k} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="uppercase tracking-wider font-mono text-slate-700">{k}</span>
                      <span className="font-mono text-slate-500">
                        {count} scans <span className="font-normal text-slate-400">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No channel data available.</p>
            )}
          </CardContent>
        </Card>

        {/* Top Flagged Allergens */}
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-800">Top Detected Allergens</CardTitle>
            <CardDescription className="text-xs">Frequency of allergens matched in product scans</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {topAllergens.length > 0 ? (
              topAllergens.slice(0, 6).map((a, idx) => (
                <div key={a.name || idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-600">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-700">{a.name}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {a.count} detections <span className="text-slate-400">({a.percentage}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, a.percentage || 0)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No allergen detections logged yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Category Risk Breakdown */}
      {categoryRisk.length > 0 && (
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-800">Product Category Risk Analysis</CardTitle>
            <CardDescription className="text-xs">
              Risk correlation grouped by product category from the catalog
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-5 py-3 font-semibold text-slate-500">Category</th>
                    <th className="px-5 py-3 font-semibold text-slate-500 text-center">Total Scans</th>
                    <th className="px-5 py-3 font-semibold text-slate-500 text-center">Safe</th>
                    <th className="px-5 py-3 font-semibold text-slate-500 text-center">Caution</th>
                    <th className="px-5 py-3 font-semibold text-slate-500 text-center">Danger Alerts</th>
                    <th className="px-5 py-3 font-semibold text-slate-500 text-right">Risk Index</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryRisk.map((c) => (
                    <tr key={c.category} className="border-b border-slate-50 hover:bg-slate-50/40 transition">
                      <td className="whitespace-nowrap px-5 py-3 font-semibold text-slate-800">{c.category}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-center font-mono text-slate-600">{c.total}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-center font-mono text-emerald-600">{c.safe}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-center font-mono text-amber-600">{c.caution}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-center font-mono font-bold text-red-600">{c.danger}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-700">{c.risk_rate}%</span>
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full ${
                                c.risk_rate > 50 ? 'bg-red-500' : c.risk_rate > 20 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, c.risk_rate)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Real Database Scan Records */}
      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <CardTitle className="text-sm font-bold text-slate-800">Real Incident & Scan Audit Log</CardTitle>
            <CardDescription className="text-xs">
              Live records pulled directly from the database table for this reporting scope
            </CardDescription>
          </div>

          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search product, user, or allergen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredScans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Info className="h-8 w-8 text-slate-300" />
              <p className="mt-2 text-xs font-semibold text-slate-600">No scan incidents found</p>
              <p className="text-[11px] text-slate-400">
                {searchQuery ? 'Try clearing your search query.' : 'There are no scans matching the current criteria in the database.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-5 py-3 font-semibold text-slate-500">Product & Barcode</th>
                    <th className="px-5 py-3 font-semibold text-slate-500">Scanning User</th>
                    <th className="px-5 py-3 font-semibold text-slate-500">Verdict</th>
                    <th className="px-5 py-3 font-semibold text-slate-500">Detected Allergens</th>
                    <th className="px-5 py-3 font-semibold text-slate-500">Channel</th>
                    <th className="px-5 py-3 font-semibold text-slate-500">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScans.map((s, idx) => (
                    <tr key={s.id || idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-800">{s.product_name || 'Scanned Label'}</div>
                        {s.barcode && <div className="text-[10px] font-mono text-slate-400">{s.barcode}</div>}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{s.user_name || 'Anonymous'}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant={s.verdict === 'danger' ? 'danger' : s.verdict === 'caution' ? 'warning' : 'success'}>
                          {s.verdict}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        {s.detected_allergens && s.detected_allergens.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {s.detected_allergens.map((allg, aIdx) => (
                              <span
                                key={aIdx}
                                className="inline-flex rounded-sm bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 border border-red-100"
                              >
                                {allg}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">None detected</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 uppercase font-mono text-[10px] text-slate-500">{s.source}</td>
                      <td className="px-5 py-3.5 text-[11px] text-slate-400">
                        {s.created_at
                          ? new Date(s.created_at).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
