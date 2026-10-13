'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  Barcode,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Download,
  Eye,
  Filter,
  Layers,
  Plus,
  Radio,
  RefreshCw,
  ScanLine,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  clearAdminScans,
  createAdminScan,
  deleteAdminScan,
  getAdminScans,
  seedAdminScans,
} from '@/lib/api';

const COMMON_ALLERGENS_PRESETS = [
  'Peanuts',
  'Tree Nuts',
  'Milk & Dairy',
  'Eggs',
  'Soybeans',
  'Gluten & Wheat',
  'Sesame',
  'Fish',
  'Shellfish',
];

export default function ScansView() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Live Auto-Refresh State
  const [autoRefreshRate, setAutoRefreshRate] = useState('10s'); // 'off', '5s', '10s', '30s'
  const [lastSynced, setLastSynced] = useState(null);
  const [timeAgo, setTimeAgo] = useState('Just now');
  const [newlyAddedIds, setNewlyAddedIds] = useState(new Set());

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  // Sorting State
  const [sortConfig, setSortConfig] = useState({ column: 'created_at', direction: 'desc' });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // 10, 25, 50, -1 (all)

  // Multi-Select Batch Actions State
  const [selectedScanIds, setSelectedScanIds] = useState([]);

  // Modals State
  const [selectedScan, setSelectedScan] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedText, setCopiedText] = useState('');

  // Create/Simulate Scan Form State
  const [createForm, setCreateForm] = useState({
    product_name: '',
    barcode: '',
    source: 'ocr',
    verdict: 'danger',
    detected_allergens: ['Tree Nuts', 'Milk & Dairy'],
    extracted_text: '',
    user_name: 'Admin User',
  });
  const [customAllergenInput, setCustomAllergenInput] = useState('');

  // Primary Fetch
  const loadScans = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminScans();
      const validData = Array.isArray(data) ? data : [];
      setScans(validData);
      setLastSynced(new Date());
      setTimeAgo('Just now');
    } catch (err) {
      setError(err.message || 'Failed to load scan logs.');
    } finally {
      setLoading(false);
    }
  };

  // Silent Background Sync for Live Auto-Refresh
  const syncScansSilently = async () => {
    setIsSyncing(true);
    try {
      const data = await getAdminScans();
      if (Array.isArray(data)) {
        // Detect newly arrived scans that weren't in existing state
        setScans((prev) => {
          const prevIds = new Set(prev.map((s) => s.id));
          const fresh = data.filter((s) => !prevIds.has(s.id));
          if (fresh.length > 0) {
            const freshIds = new Set(fresh.map((s) => s.id));
            setNewlyAddedIds(freshIds);
            setTimeout(() => setNewlyAddedIds(new Set()), 4000);
          }
          return data;
        });
        setLastSynced(new Date());
        setTimeAgo('Just now');
      }
    } catch {
      // Don't break UI on background poll blip
    } finally {
      setIsSyncing(false);
    }
  };

  // Mount
  useEffect(() => {
    loadScans();
  }, []);

  // Auto-Refresh Timer
  useEffect(() => {
    if (autoRefreshRate === 'off') return;
    const ms = autoRefreshRate === '5s' ? 5000 : autoRefreshRate === '10s' ? 10000 : 30000;
    const timer = setInterval(() => {
      syncScansSilently();
    }, ms);
    return () => clearInterval(timer);
  }, [autoRefreshRate]);

  // Relative Time Ago Ticker
  useEffect(() => {
    const ticker = setInterval(() => {
      if (!lastSynced) return;
      const sec = Math.floor((Date.now() - lastSynced.getTime()) / 1000);
      if (sec < 5) setTimeAgo('Just now');
      else if (sec < 60) setTimeAgo(`${sec}s ago`);
      else setTimeAgo(`${Math.floor(sec / 60)}m ago`);
    }, 2000);
    return () => clearInterval(ticker);
  }, [lastSynced]);

  // Single Delete
  const handleDeleteScan = async (id, name) => {
    if (!confirm(`Are you sure you want to delete scan log '${name || id}'?`)) return;
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await deleteAdminScan(id);
      setSuccessMsg(`Scan log '${name || id}' deleted.`);
      if (selectedScan && selectedScan.id === id) {
        setSelectedScan(null);
      }
      setSelectedScanIds((prev) => prev.filter((item) => item !== id));
      await loadScans();
    } catch (err) {
      setError(err.message || 'Failed to delete scan log.');
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (!selectedScanIds.length) return;
    if (!confirm(`Are you sure you want to delete ${selectedScanIds.length} selected scan logs?`)) return;
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await Promise.all(selectedScanIds.map((id) => deleteAdminScan(id)));
      setSuccessMsg(`Successfully deleted ${selectedScanIds.length} scan logs.`);
      setSelectedScanIds([]);
      await loadScans();
    } catch (err) {
      setError(err.message || 'Failed to delete selected scan logs.');
    } finally {
      setActionLoading(false);
    }
  };

  // Clear All
  const handleClearAllScans = async () => {
    if (!confirm('Are you sure you want to clear ALL scan history? This action cannot be undone.')) return;
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await clearAdminScans();
      setSuccessMsg('All scan logs cleared successfully.');
      setSelectedScan(null);
      setSelectedScanIds([]);
      await loadScans();
    } catch (err) {
      setError(err.message || 'Failed to clear scan history.');
    } finally {
      setActionLoading(false);
    }
  };

  // Seed Demo Scans
  const handleSeedScans = async () => {
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const data = await seedAdminScans();
      setScans(Array.isArray(data) ? data : []);
      setSuccessMsg('Sample scan records populated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to populate sample scan records.');
    } finally {
      setActionLoading(false);
    }
  };

  // Create / Simulate Scan Submit
  const handleCreateScanSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.product_name.trim()) return;
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const newScan = await createAdminScan({
        ...createForm,
        product_name: createForm.product_name.trim(),
      });
      setSuccessMsg(`New scan for '${createForm.product_name}' logged successfully!`);
      setShowCreateModal(false);
      setCreateForm({
        product_name: '',
        barcode: '',
        source: 'ocr',
        verdict: 'danger',
        detected_allergens: ['Tree Nuts', 'Milk & Dairy'],
        extracted_text: '',
        user_name: 'Admin User',
      });
      // Flash highlight
      if (newScan && newScan.id) {
        setNewlyAddedIds(new Set([newScan.id]));
        setTimeout(() => setNewlyAddedIds(new Set()), 4000);
      }
      await loadScans();
    } catch (err) {
      setError(err.message || 'Failed to create scan log.');
    } finally {
      setActionLoading(false);
    }
  };

  // Clipboard Copy Helper
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  // Column Sort
  const handleSort = (column) => {
    setSortConfig((prev) => {
      if (prev.column === column) {
        return { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { column, direction: 'desc' };
    });
  };

  // Export to CSV
  const exportToCSV = () => {
    const list = filteredAndSortedScans;
    if (!list.length) return;
    const headers = [
      'ID',
      'Product Name',
      'Barcode',
      'Scanned By',
      'Verdict',
      'Source',
      'Detected Allergens',
      'Extracted Text',
      'Timestamp',
    ];
    const rows = list.map((s) => [
      `"${s.id || ''}"`,
      `"${(s.product_name || '').replace(/"/g, '""')}"`,
      `"${s.barcode || ''}"`,
      `"${(s.user_name || '').replace(/"/g, '""')}"`,
      `"${s.verdict || ''}"`,
      `"${s.source || ''}"`,
      `"${(s.detected_allergens || []).join('; ').replace(/"/g, '""')}"`,
      `"${(s.extracted_text || '').replace(/"/g, '""')}"`,
      `"${s.created_at || ''}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `safelabel-scans-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const exportToJSON = () => {
    const list = filteredAndSortedScans;
    if (!list.length) return;
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(list, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `safelabel-scans-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  // Filtered & Sorted Scans
  const filteredAndSortedScans = useMemo(() => {
    const result = scans.filter((s) => {
      // Verdict filter
      if (verdictFilter !== 'all' && s.verdict !== verdictFilter) return false;
      // Source filter
      if (sourceFilter !== 'all' && (s.source || '').toLowerCase() !== sourceFilter) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const prod = (s.product_name || '').toLowerCase();
        const user = (s.user_name || '').toLowerCase();
        const barcode = (s.barcode || '').toLowerCase();
        const allergens = (s.detected_allergens || []).join(' ').toLowerCase();
        const text = (s.extracted_text || '').toLowerCase();
        return (
          prod.includes(q) ||
          user.includes(q) ||
          barcode.includes(q) ||
          allergens.includes(q) ||
          text.includes(q)
        );
      }
      return true;
    });

    // Sort
    result.sort((a, b) => {
      let valA = a[sortConfig.column];
      let valB = b[sortConfig.column];

      if (sortConfig.column === 'created_at') {
        const timeA = valA ? new Date(valA).getTime() : 0;
        const timeB = valB ? new Date(valB).getTime() : 0;
        return sortConfig.direction === 'asc' ? timeA - timeB : timeB - timeA;
      }

      valA = (valA || '').toString().toLowerCase();
      valB = (valB || '').toString().toLowerCase();
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [scans, verdictFilter, sourceFilter, searchQuery, sortConfig]);

  // Paginated Scans
  const paginatedScans = useMemo(() => {
    if (pageSize === -1) return filteredAndSortedScans;
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedScans.slice(start, start + pageSize);
  }, [filteredAndSortedScans, currentPage, pageSize]);

  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(filteredAndSortedScans.length / pageSize));

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, verdictFilter, sourceFilter, pageSize]);

  // Multi-select helpers
  const handleSelectAllOnPage = (e) => {
    if (e.target.checked) {
      const pageIds = paginatedScans.map((s) => s.id);
      setSelectedScanIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = new Set(paginatedScans.map((s) => s.id));
      setSelectedScanIds((prev) => prev.filter((id) => !pageIds.has(id)));
    }
  };

  const handleToggleSelectRow = (id) => {
    setSelectedScanIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllOnPageSelected =
    paginatedScans.length > 0 && paginatedScans.every((s) => selectedScanIds.includes(s.id));

  // Metrics
  const stats = useMemo(() => {
    const total = scans.length;
    const safe = scans.filter((s) => s.verdict === 'safe').length;
    const caution = scans.filter((s) => s.verdict === 'caution').length;
    const danger = scans.filter((s) => s.verdict === 'danger').length;
    const safePct = total ? Math.round((safe / total) * 100) : 0;
    const cautionPct = total ? Math.round((caution / total) * 100) : 0;
    const dangerPct = total ? Math.round((danger / total) * 100) : 0;
    return { total, safe, caution, danger, safePct, cautionPct, dangerPct };
  }, [scans]);

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {successMsg && (
        <Alert variant="success" className="animate-in fade-in slide-in-from-top-2">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* KPI Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200/80 bg-white shadow-sm transition hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Scans</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                  {isSyncing && (
                    <span className="inline-block h-2 w-2 animate-ping rounded-full bg-blue-500" />
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-slate-400">Total OCR & Barcode logs</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-50 text-purple-600">
                <ScanLine size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white shadow-sm transition hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Safe Products</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.safe}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{stats.safePct}% safety ratio</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white shadow-sm transition hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Caution Warnings</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{stats.caution}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{stats.cautionPct}% trace warnings</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
                <AlertTriangle size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white shadow-sm transition hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Danger Alerts</p>
                <p className="mt-1 text-2xl font-bold text-red-600">{stats.danger}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{stats.dangerPct}% allergen violations</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-600">
                <ShieldAlert size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Proportional Safety Distribution Bar */}
      {stats.total > 0 && (
        <Card className="border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
            <span className="flex items-center gap-1.5">
              <Layers size={14} className="text-slate-400" />
              Live Safety Verdict Distribution
            </span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Safe ({stats.safePct}%)
              </span>
              <span className="flex items-center gap-1 text-amber-700">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Caution ({stats.cautionPct}%)
              </span>
              <span className="flex items-center gap-1 text-red-700">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                Danger ({stats.dangerPct}%)
              </span>
            </div>
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              style={{ width: `${stats.safePct}%` }}
              className="bg-emerald-500 transition-all duration-500"
              title={`Safe: ${stats.safe}`}
            />
            <div
              style={{ width: `${stats.cautionPct}%` }}
              className="bg-amber-500 transition-all duration-500"
              title={`Caution: ${stats.caution}`}
            />
            <div
              style={{ width: `${stats.dangerPct}%` }}
              className="bg-red-500 transition-all duration-500"
              title={`Danger: ${stats.danger}`}
            />
          </div>
        </Card>
      )}

      {/* Main Table Card */}
      <Card className="border-slate-200/80 shadow-sm">
        {/* Header with Live Sync Controls */}
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold text-slate-800">Scan Logs & Telemetry</CardTitle>
              {autoRefreshRate !== 'off' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  LIVE
                </span>
              )}
            </div>
            <CardDescription className="mt-1 text-xs text-slate-500">
              Real-time audit stream of barcode scans, camera OCR text extractions, and allergen matches
            </CardDescription>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Auto-Refresh Speed Selector */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
              <span className="px-2 text-[10px] font-bold uppercase text-slate-500">Sync</span>
              {['off', '5s', '10s', '30s'].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setAutoRefreshRate(rate)}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition ${
                    autoRefreshRate === rate
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {rate}
                </button>
              ))}
            </div>

            {/* Simulate / Log Scan Button */}
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Simulate Scan
            </Button>

            {/* Export Menu */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-white">
              <button
                onClick={exportToCSV}
                disabled={!filteredAndSortedScans.length}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
                title="Download CSV"
              >
                <Download size={13} />
                CSV
              </button>
              <span className="h-4 w-px bg-slate-200" />
              <button
                onClick={exportToJSON}
                disabled={!filteredAndSortedScans.length}
                className="px-2 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
                title="Download JSON"
              >
                JSON
              </button>
            </div>

            {/* Populate Demo */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleSeedScans}
              disabled={loading || actionLoading}
              className="text-xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              Populate Demo
            </Button>

            {/* Clear All */}
            {scans.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearAllScans}
                disabled={loading || actionLoading}
                className="text-xs text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                Clear
              </Button>
            )}

            {/* Manual Refresh */}
            <Button
              size="sm"
              variant="outline"
              onClick={loadScans}
              disabled={loading || actionLoading}
              title={`Last synced: ${timeAgo}`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading || isSyncing ? 'animate-spin text-blue-600' : ''}`} />
              <span className="hidden sm:inline text-xs">Sync</span>
            </Button>
          </div>
        </CardHeader>

        {/* Search, Filter & Bulk Actions Bar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-4 md:flex-row md:items-center md:justify-between">
          {/* Search Input */}
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by product, barcode, user, allergen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-8 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Verdict Filter */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
              <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Verdict</span>
              {['all', 'safe', 'caution', 'danger'].map((v) => (
                <button
                  key={v}
                  onClick={() => setVerdictFilter(v)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition ${
                    verdictFilter === v
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Source Filter */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
              <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Source</span>
              {['all', 'ocr', 'barcode'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSourceFilter(s)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium uppercase transition ${
                    sourceFilter === s
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Bulk Action Bar when items selected */}
        {selectedScanIds.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50 px-5 py-2.5 text-xs text-blue-900 border-b border-blue-200 animate-in fade-in">
            <div className="flex items-center gap-2 font-medium">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {selectedScanIds.length}
              </span>
              <span>scan logs selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  exportToCSV(
                    filteredAndSortedScans.filter((s) => selectedScanIds.includes(s.id))
                  )
                }
                className="flex items-center gap-1 rounded bg-white px-2.5 py-1 font-semibold text-slate-700 shadow-xs border border-slate-200 hover:bg-slate-50"
              >
                <Download size={13} />
                Export Selected
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1 rounded bg-red-600 px-2.5 py-1 font-semibold text-white shadow-xs hover:bg-red-700"
              >
                <Trash2 size={13} />
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedScanIds([])}
                className="rounded p-1 text-slate-500 hover:bg-blue-100"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          {!filteredAndSortedScans.length && !loading ? (
            <div className="p-12 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
                <ScanLine size={24} />
              </div>
              <h3 className="text-sm font-semibold text-slate-700">No scan logs found</h3>
              <p className="mt-1 text-xs text-slate-400">
                {scans.length === 0
                  ? 'No scan records in the database. Use Simulate Scan or click Populate Demo.'
                  : 'No records matched your search filters.'}
              </p>
              {scans.length === 0 && (
                <Button size="sm" onClick={handleSeedScans} className="mt-4 bg-blue-600 text-xs text-white">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Populate Demo Scan History
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/75 select-none">
                    {/* Checkbox */}
                    <TableHead className="w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllOnPageSelected}
                        onChange={handleSelectAllOnPage}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </TableHead>

                    {/* Product Name Column */}
                    <TableHead
                      onClick={() => handleSort('product_name')}
                      className="cursor-pointer hover:text-blue-600 transition"
                    >
                      <div className="flex items-center gap-1.5">
                        Product / Label
                        {sortConfig.column === 'product_name' ? (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp size={14} className="text-blue-600" />
                          ) : (
                            <ChevronDown size={14} className="text-blue-600" />
                          )
                        ) : (
                          <ArrowUpDown size={12} className="text-slate-300" />
                        )}
                      </div>
                    </TableHead>

                    {/* Scanned By Column */}
                    <TableHead
                      onClick={() => handleSort('user_name')}
                      className="cursor-pointer hover:text-blue-600 transition"
                    >
                      <div className="flex items-center gap-1.5">
                        Scanned By
                        {sortConfig.column === 'user_name' ? (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp size={14} className="text-blue-600" />
                          ) : (
                            <ChevronDown size={14} className="text-blue-600" />
                          )
                        ) : (
                          <ArrowUpDown size={12} className="text-slate-300" />
                        )}
                      </div>
                    </TableHead>

                    {/* AI Verdict Column */}
                    <TableHead
                      onClick={() => handleSort('verdict')}
                      className="cursor-pointer hover:text-blue-600 transition"
                    >
                      <div className="flex items-center gap-1.5">
                        AI Verdict
                        {sortConfig.column === 'verdict' ? (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp size={14} className="text-blue-600" />
                          ) : (
                            <ChevronDown size={14} className="text-blue-600" />
                          )
                        ) : (
                          <ArrowUpDown size={12} className="text-slate-300" />
                        )}
                      </div>
                    </TableHead>

                    {/* Source Channel Column */}
                    <TableHead
                      onClick={() => handleSort('source')}
                      className="cursor-pointer hover:text-blue-600 transition"
                    >
                      <div className="flex items-center gap-1.5">
                        Channel
                        {sortConfig.column === 'source' ? (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp size={14} className="text-blue-600" />
                          ) : (
                            <ChevronDown size={14} className="text-blue-600" />
                          )
                        ) : (
                          <ArrowUpDown size={12} className="text-slate-300" />
                        )}
                      </div>
                    </TableHead>

                    {/* Detected Allergens */}
                    <TableHead>Detected Allergens</TableHead>

                    {/* Timestamp Column */}
                    <TableHead
                      onClick={() => handleSort('created_at')}
                      className="cursor-pointer hover:text-blue-600 transition"
                    >
                      <div className="flex items-center gap-1.5">
                        Timestamp
                        {sortConfig.column === 'created_at' ? (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp size={14} className="text-blue-600" />
                          ) : (
                            <ChevronDown size={14} className="text-blue-600" />
                          )
                        ) : (
                          <ArrowUpDown size={12} className="text-slate-300" />
                        )}
                      </div>
                    </TableHead>

                    {/* Actions */}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedScans.map((s) => {
                    const isSelected = selectedScanIds.includes(s.id);
                    const isNew = newlyAddedIds.has(s.id);
                    return (
                      <TableRow
                        key={s.id}
                        className={`transition ${
                          isNew
                            ? 'bg-blue-50/80 animate-pulse'
                            : isSelected
                            ? 'bg-blue-50/40'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        {/* Checkbox */}
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(s.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </TableCell>

                        {/* Product Name */}
                        <TableCell>
                          <div className="font-semibold text-slate-800 flex items-center gap-2">
                            <span>{s.product_name || 'Scanned Product Label'}</span>
                            {isNew && (
                              <span className="rounded bg-blue-600 px-1.5 py-0.2 text-[9px] font-bold text-white uppercase">
                                New
                              </span>
                            )}
                          </div>
                          {s.barcode && (
                            <div className="mt-0.5 flex items-center gap-1 font-mono text-[11px] text-slate-400">
                              <span>UPC: {s.barcode}</span>
                              <button
                                onClick={() => copyToClipboard(s.barcode, `barcode-${s.id}`)}
                                className="text-slate-400 hover:text-slate-600"
                                title="Copy Barcode"
                              >
                                {copiedText === `barcode-${s.id}` ? (
                                  <Check size={11} className="text-emerald-600" />
                                ) : (
                                  <Copy size={11} />
                                )}
                              </button>
                            </div>
                          )}
                        </TableCell>

                        {/* Scanned By */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                              {(s.user_name || 'U')[0].toUpperCase()}
                            </div>
                            <span className="text-xs font-medium text-slate-700">
                              {s.user_name || 'Anonymous User'}
                            </span>
                          </div>
                        </TableCell>

                        {/* Verdict */}
                        <TableCell>
                          <Badge
                            variant={
                              s.verdict === 'danger'
                                ? 'danger'
                                : s.verdict === 'caution'
                                ? 'warning'
                                : 'success'
                            }
                            className="gap-1 capitalize"
                          >
                            {s.verdict === 'danger' && <AlertCircle className="h-2.5 w-2.5" />}
                            {s.verdict === 'caution' && <AlertTriangle className="h-2.5 w-2.5" />}
                            {s.verdict === 'safe' && <CheckCircle2 className="h-2.5 w-2.5" />}
                            {s.verdict}
                          </Badge>
                        </TableCell>

                        {/* Source */}
                        <TableCell>
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-slate-600">
                            {(s.source || '').toLowerCase() === 'barcode' ? (
                              <Barcode className="h-3 w-3" />
                            ) : (
                              <Camera className="h-3 w-3" />
                            )}
                            {s.source || 'OCR'}
                          </span>
                        </TableCell>

                        {/* Detected Allergens */}
                        <TableCell>
                          {Array.isArray(s.detected_allergens) && s.detected_allergens.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[240px]">
                              {s.detected_allergens.map((a, i) => (
                                <span
                                  key={i}
                                  className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 border border-red-100"
                                >
                                  {a}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Clean (None)
                            </span>
                          )}
                        </TableCell>

                        {/* Timestamp */}
                        <TableCell className="text-[11px] text-slate-500 whitespace-nowrap">
                          {s.created_at ? new Date(s.created_at).toLocaleString() : '-'}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedScan(s)}
                              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition cursor-pointer"
                              title="Inspect details"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteScan(s.id, s.product_name)}
                              className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                              title="Delete log"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Dynamic Pagination Controls */}
          {filteredAndSortedScans.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 bg-white">
              <div className="flex items-center gap-2">
                <span>
                  Showing{' '}
                  <strong className="text-slate-800">
                    {pageSize === -1
                      ? `1 - ${filteredAndSortedScans.length}`
                      : `${(currentPage - 1) * pageSize + 1} - ${Math.min(
                          currentPage * pageSize,
                          filteredAndSortedScans.length
                        )}`}
                  </strong>{' '}
                  of <strong className="text-slate-800">{filteredAndSortedScans.length}</strong> logs
                </span>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1">
                  <span>Show:</span>
                  {[10, 25, 50, -1].map((size) => (
                    <button
                      key={size}
                      onClick={() => setPageSize(size)}
                      className={`rounded px-1.5 py-0.5 text-[11px] font-medium transition ${
                        pageSize === size
                          ? 'bg-slate-800 text-white font-bold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {size === -1 ? 'All' : size}
                    </button>
                  ))}
                </div>
              </div>

              {pageSize !== -1 && totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-2 text-xs"
                  >
                    <ChevronLeft size={14} />
                    Prev
                  </Button>
                  <span className="px-2 font-medium text-slate-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2 text-xs"
                  >
                    Next
                    <ChevronRight size={14} />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Inspector Modal */}
      {selectedScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/80">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  {selectedScan.product_name || 'Scan Details'}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {selectedScan.id}
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedScan.id, 'modal-id')}
                    className="text-slate-400 hover:text-slate-600 text-[10px]"
                    title="Copy Scan ID"
                  >
                    {copiedText === 'modal-id' ? (
                      <span className="text-emerald-600 font-bold">Copied!</span>
                    ) : (
                      <Copy size={11} />
                    )}
                  </button>
                </div>
              </div>
              <button
                onClick={() => setSelectedScan(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Verdict Banner */}
              <div
                className={`flex items-center gap-3 rounded-lg p-3.5 border ${
                  selectedScan.verdict === 'danger'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : selectedScan.verdict === 'caution'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                {selectedScan.verdict === 'danger' && <AlertCircle className="h-6 w-6 text-red-600 shrink-0" />}
                {selectedScan.verdict === 'caution' && <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />}
                {selectedScan.verdict === 'safe' && <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    AI Verdict: {selectedScan.verdict}
                  </h4>
                  <p className="text-xs mt-0.5 opacity-90">
                    {selectedScan.verdict === 'danger'
                      ? 'AI matched allergen ingredients that violate user dietary safety restrictions.'
                      : selectedScan.verdict === 'caution'
                      ? 'Potential allergen traces or advisory warnings flagged on the ingredient label.'
                      : 'No allergenic ingredients matched the profile. Classified as safe.'}
                  </p>
                </div>
              </div>

              {/* Detected Allergens Section */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Detected Allergens
                </h4>
                {Array.isArray(selectedScan.detected_allergens) && selectedScan.detected_allergens.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedScan.detected_allergens.map((a, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-red-100/90 px-2.5 py-1 text-xs font-bold text-red-700 border border-red-200"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">None detected (Clean product)</p>
                )}
              </div>

              {/* Extracted Label Text */}
              {selectedScan.extracted_text && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Extracted Label / Ingredients Text
                    </h4>
                    <button
                      onClick={() => copyToClipboard(selectedScan.extracted_text, 'modal-text')}
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedText === 'modal-text' ? 'Copied!' : 'Copy Text'}
                    </button>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-700 border border-slate-200 max-h-40 overflow-y-auto leading-relaxed">
                    {selectedScan.extracted_text}
                  </div>
                </div>
              )}

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Scanned By</span>
                  <span className="font-semibold text-slate-700">{selectedScan.user_name || 'Anonymous User'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Source Channel</span>
                  <span className="font-semibold text-slate-700 uppercase">{selectedScan.source || 'OCR'}</span>
                </div>
                {selectedScan.barcode && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Barcode</span>
                    <span className="font-mono text-slate-700">{selectedScan.barcode}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block text-[11px]">Scanned Timestamp</span>
                  <span className="text-slate-700">
                    {selectedScan.created_at ? new Date(selectedScan.created_at).toLocaleString() : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteScan(selectedScan.id, selectedScan.product_name)}
                className="text-xs text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete Log
              </Button>
              <Button
                size="sm"
                onClick={() => setSelectedScan(null)}
                className="bg-blue-600 text-xs text-white"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Simulate / Log New Scan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/80">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Simulate New Product Scan</h3>
                <p className="text-xs text-slate-400">
                  Inject a live test scan into the database stream to test real-time telemetry
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateScanSubmit}>
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                {/* Product Name */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Organic Hazelnut Butter Crunch"
                    value={createForm.product_name}
                    onChange={(e) => setCreateForm({ ...createForm, product_name: e.target.value })}
                    className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Barcode & User */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Barcode (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 735008329102"
                      value={createForm.barcode}
                      onChange={(e) => setCreateForm({ ...createForm, barcode: e.target.value })}
                      className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Scanned By</label>
                    <input
                      type="text"
                      placeholder="e.g. Admin User"
                      value={createForm.user_name}
                      onChange={(e) => setCreateForm({ ...createForm, user_name: e.target.value })}
                      className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Verdict & Channel */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">AI Verdict</label>
                    <select
                      value={createForm.verdict}
                      onChange={(e) => setCreateForm({ ...createForm, verdict: e.target.value })}
                      className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-800 outline-none focus:border-blue-500 capitalize"
                    >
                      <option value="danger">Danger (High Risk)</option>
                      <option value="caution">Caution (Traces)</option>
                      <option value="safe">Safe (Clean)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Source Channel</label>
                    <select
                      value={createForm.source}
                      onChange={(e) => setCreateForm({ ...createForm, source: e.target.value })}
                      className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-800 outline-none focus:border-blue-500 uppercase"
                    >
                      <option value="ocr">OCR (Camera)</option>
                      <option value="barcode">Barcode Scanner</option>
                    </select>
                  </div>
                </div>

                {/* Detected Allergens Selector */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Detected Allergens (Click to toggle)
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {COMMON_ALLERGENS_PRESETS.map((allergen) => {
                      const isSelected = createForm.detected_allergens.includes(allergen);
                      return (
                        <button
                          type="button"
                          key={allergen}
                          onClick={() => {
                            setCreateForm((prev) => ({
                              ...prev,
                              detected_allergens: isSelected
                                ? prev.detected_allergens.filter((a) => a !== allergen)
                                : [...prev.detected_allergens, allergen],
                            }));
                          }}
                          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                            isSelected
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {isSelected ? `✓ ${allergen}` : `+ ${allergen}`}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Allergen Input */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Add custom allergen tag..."
                      value={customAllergenInput}
                      onChange={(e) => setCustomAllergenInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = customAllergenInput.trim();
                          if (val && !createForm.detected_allergens.includes(val)) {
                            setCreateForm((prev) => ({
                              ...prev,
                              detected_allergens: [...prev.detected_allergens, val],
                            }));
                            setCustomAllergenInput('');
                          }
                        }
                      }}
                      className="flex-1 rounded-md border border-slate-300 p-1.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = customAllergenInput.trim();
                        if (val && !createForm.detected_allergens.includes(val)) {
                          setCreateForm((prev) => ({
                            ...prev,
                            detected_allergens: [...prev.detected_allergens, val],
                          }));
                          setCustomAllergenInput('');
                        }
                      }}
                      className="rounded bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Raw Extracted Label Text */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Extracted Ingredients Text (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Sugar, cocoa butter, hazelnuts, skimmed milk powder, soy lecithin..."
                    value={createForm.extracted_text}
                    onChange={(e) => setCreateForm({ ...createForm, extracted_text: e.target.value })}
                    className="w-full rounded-md border border-slate-300 p-2 text-xs font-mono text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  disabled={actionLoading}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={actionLoading || !createForm.product_name.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-xs text-white"
                >
                  {actionLoading ? 'Logging Scan...' : 'Inject Scan to Stream'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
