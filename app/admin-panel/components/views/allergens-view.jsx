'use client';

import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createAdminAllergen, deleteAdminAllergen, getAdminAllergens } from '@/lib/api';

export default function AllergensView() {
  const [allergens, setAllergens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    id: '',
    name: '',
    terms: '',
  });

  const loadAllergens = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminAllergens();
      setAllergens(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load allergens catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllergens();
  }, []);

  const handleCreateAllergen = async (e) => {
    e.preventDefault();
    if (!form.id || !form.name) return;
    setError('');
    setSuccessMsg('');
    try {
      const termsList = form.terms
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await createAdminAllergen({ id: form.id, name: form.name, terms: termsList });
      const allergenName = form.name;
      setSuccessMsg(`Allergen rule '${allergenName}' saved successfully!`);
      setForm({ id: '', name: '', terms: '' });
      setShowAddModal(false);
      await loadAllergens();
    } catch (err) {
      setError(err.message || 'Failed to save allergen rule.');
    }
  };

  const handleDeleteAllergen = async (id) => {
    if (!confirm(`Are you sure you want to delete allergen rule '${id}'?`)) return;
    setError('');
    setSuccessMsg('');
    try {
      await deleteAdminAllergen(id);
      setSuccessMsg(`Allergen rule '${id}' deleted successfully!`);
      await loadAllergens();
    } catch (err) {
      setError(err.message || 'Failed to delete allergen rule.');
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
            <CardTitle>Allergen Detection Rules</CardTitle>
            <CardDescription className="mt-1">
              Configure target allergens and associated keyword synonyms for spaCy NLP matching
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                setShowAddModal(!showAddModal);
                setError('');
              }}
            >
              {showAddModal ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showAddModal ? 'Cancel' : 'Add Rule'}
            </Button>
            <Button size="sm" variant="outline" onClick={loadAllergens} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>

        {/* Add Allergen Form Section */}
        {showAddModal && (
          <div className="border-b border-slate-100 bg-slate-50/50 p-6 transition-all">
            <form onSubmit={handleCreateAllergen} className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Add or Update Allergen Rule
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Identifier (Key) *</label>
                  <Input
                    className="mt-1"
                    required
                    placeholder="e.g. gluten"
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Display Name *</label>
                  <Input
                    className="mt-1"
                    required
                    placeholder="e.g. Gluten / Cereals"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600">Synonyms & Terms (comma-separated)</label>
                  <Input
                    className="mt-1"
                    placeholder="e.g. wheat, barley, rye, oats, spelt, kamut"
                    value={form.terms}
                    onChange={(e) => setForm({ ...form, terms: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Allergen Rule
                </Button>
              </div>
            </form>
          </div>
        )}

        <CardContent className="p-0">
          {!allergens.length && !loading ? (
            <div className="p-8 text-center text-xs text-slate-400">No allergens configured.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Allergen Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Recognized Synonyms & Terms</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allergens.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-semibold text-slate-800">{a.name || a.id}</TableCell>
                    <TableCell className="font-mono text-[11px] text-blue-600">{a.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(a.terms) && a.terms.length ? (
                          a.terms.map((term) => (
                            <span
                              key={term}
                              className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600"
                            >
                              {term}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                        onClick={() => handleDeleteAllergen(a.id)}
                        title="Delete Allergen Rule"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
