'use client';

import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createAdminProduct, deleteAdminProduct, getAdminProducts } from '@/lib/api';

export default function ProductsView() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    name: '',
    barcode: '',
    category: 'Food & Beverage',
    ingredients_text: '',
    status: 'active',
  });

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load products catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    setError('');
    setSuccessMsg('');
    try {
      await createAdminProduct(form);
      const prodName = form.name;
      setSuccessMsg(`Product '${prodName}' added successfully!`);
      setForm({ name: '', barcode: '', category: 'Food & Beverage', ingredients_text: '', status: 'active' });
      setShowAddModal(false);
      await loadProducts();
    } catch (err) {
      setError(err.message || 'Failed to create product.');
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`Are you sure you want to delete product '${name}'?`)) return;
    setError('');
    setSuccessMsg('');
    try {
      await deleteAdminProduct(id);
      setSuccessMsg(`Product '${name}' deleted successfully!`);
      await loadProducts();
    } catch (err) {
      setError(err.message || 'Failed to delete product.');
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
            <CardTitle>Product Catalog</CardTitle>
            <CardDescription className="mt-1">
              Add, inspect, and delete food items and ingredients database
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
              {showAddModal ? 'Cancel' : 'Add Product'}
            </Button>
            <Button size="sm" variant="outline" onClick={loadProducts} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>

        {/* Add Product Form Section */}
        {showAddModal && (
          <div className="border-b border-slate-100 bg-slate-50/50 p-6 transition-all">
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Add New Food Product
              </h4>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Product Name *</label>
                  <Input
                    className="mt-1"
                    required
                    placeholder="e.g. Crunchy Peanut Butter"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Barcode / UPC</label>
                  <Input
                    className="mt-1"
                    placeholder="e.g. 5000159481122"
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Category</label>
                  <Input
                    className="mt-1"
                    placeholder="e.g. Spreads, Snacks"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2 md:col-span-3">
                  <label className="text-[11px] font-semibold text-slate-600">Ingredients Text</label>
                  <Input
                    className="mt-1"
                    placeholder="e.g. Roasted Peanuts (90%), Palm Oil, Sugar, Salt."
                    value={form.ingredients_text}
                    onChange={(e) => setForm({ ...form, ingredients_text: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Product
                </Button>
              </div>
            </form>
          </div>
        )}

        <CardContent className="p-0">
          {!products.length && !loading ? (
            <div className="p-8 text-center text-xs text-slate-400">No products indexed yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Ingredients</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold text-slate-800">{p.name}</TableCell>
                    <TableCell className="font-mono text-[11px] text-slate-500">{p.barcode || '-'}</TableCell>
                    <TableCell className="text-slate-600">{p.category}</TableCell>
                    <TableCell className="max-w-xs truncate text-[11px] text-slate-400" title={p.ingredients_text}>
                      {p.ingredients_text || 'No ingredients listed'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'active' ? 'success' : 'warning'}>
                        {p.status || 'active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                        onClick={() => handleDeleteProduct(p.id, p.name)}
                        title="Delete Product"
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
