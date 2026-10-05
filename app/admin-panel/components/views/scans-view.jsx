'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getAdminScans } from '@/lib/api';

export default function ScansView() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadScans = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminScans();
      setScans(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load scan logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScans();
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
            <CardTitle>Scan Logs</CardTitle>
            <CardDescription className="mt-1">
              Review product label scans and AI allergen detection verdicts
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={loadScans} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {!scans.length && !loading ? (
            <div className="p-8 text-center text-xs text-slate-400">No scans recorded yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Scanned By</TableHead>
                  <TableHead>AI Verdict</TableHead>
                  <TableHead>Source Channel</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scans.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-semibold text-slate-800">{s.product_name}</TableCell>
                    <TableCell className="text-slate-600">{s.user_name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          s.verdict === 'danger'
                            ? 'danger'
                            : s.verdict === 'caution'
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {s.verdict}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-[10px] uppercase text-slate-400">
                      {s.source}
                    </TableCell>
                    <TableCell className="text-[11px] text-slate-400">
                      {s.created_at ? new Date(s.created_at).toLocaleString() : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
