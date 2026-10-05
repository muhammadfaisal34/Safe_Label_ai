'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getAdminLogs } from '@/lib/api';

export default function LogsView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load system logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
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
            <CardTitle>System Activity Logs</CardTitle>
            <CardDescription className="mt-1">
              Audit trail of admin operations, system events, and security logs
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={loadLogs} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {!logs.length && !loading ? (
            <div className="p-8 text-center text-xs text-slate-400">No system logs recorded.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Level</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <Badge
                        variant={
                          l.level === 'ERROR'
                            ? 'danger'
                            : l.level === 'WARNING'
                            ? 'warning'
                            : 'info'
                        }
                      >
                        {l.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] font-semibold text-slate-700">
                      {l.event}
                    </TableCell>
                    <TableCell className="text-slate-600">{l.message}</TableCell>
                    <TableCell className="text-[11px] text-slate-400">
                      {l.created_at ? new Date(l.created_at).toLocaleString() : '-'}
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
