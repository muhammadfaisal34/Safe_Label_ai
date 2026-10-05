'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getAdminSettings, updateAdminSettings } from '@/lib/api';

export default function SettingsView() {
  const [settings, setSettings] = useState({
    ai_threshold: 0.7,
    enable_ocr_cache: true,
    alert_on_traces: true,
    notifications_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminSettings();
      if (data) {
        setSettings(data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      await updateAdminSettings(settings);
      setSuccessMsg('System configuration saved successfully!');
    } catch (err) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

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

      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-5">
          <div>
            <CardTitle>Platform Settings</CardTitle>
            <CardDescription className="mt-1">
              Configure AI detection parameters, OCR caching, and notification triggers
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={loadSettings} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>

        <CardContent className="p-6 max-w-xl">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                AI Detection Confidence Threshold: {((settings.ai_threshold || 0.7) * 100).toFixed(0)}%
              </label>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Minimum spaCy and keyword matching score required to flag an allergen
              </p>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={settings.ai_threshold || 0.7}
                onChange={(e) =>
                  setSettings({ ...settings, ai_threshold: parseFloat(e.target.value) })
                }
                className="mt-3 w-full cursor-pointer accent-[#1269d3]"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-700">Cache OCR Image Results</p>
                <p className="text-[11px] text-slate-400">Improves response latency for frequently scanned packages</p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings.enable_ocr_cache)}
                onChange={(e) => setSettings({ ...settings, enable_ocr_cache: e.target.checked })}
                className="h-4 w-4 rounded accent-[#1269d3] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-700">High-Alert on "May Contain" Traces</p>
                <p className="text-[11px] text-slate-400">Classify cross-contamination warnings as Caution</p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings.alert_on_traces)}
                onChange={(e) => setSettings({ ...settings, alert_on_traces: e.target.checked })}
                className="h-4 w-4 rounded accent-[#1269d3] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-700">Admin Notification Webhooks</p>
                <p className="text-[11px] text-slate-400">Broadcast security and scan anomalies</p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings.notifications_enabled)}
                onChange={(e) => setSettings({ ...settings, notifications_enabled: e.target.checked })}
                className="h-4 w-4 rounded accent-[#1269d3] cursor-pointer"
              />
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Platform Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
