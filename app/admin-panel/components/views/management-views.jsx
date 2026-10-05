'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Check,
  CheckCircle2,
  FileClock,
  Filter,
  Plus,
  RefreshCw,
  Save,
  Sliders,
  Trash2,
  UserCheck,
  UserRound,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  createAdminAllergen,
  createAdminProduct,
  createAdminUser,
  deleteAdminAllergen,
  deleteAdminProduct,
  deleteAdminUser,
  getAdminAllergens,
  getAdminLogs,
  getAdminProducts,
  getAdminReports,
  getAdminScans,
  getAdminSettings,
  getAdminUsers,
  getCurrentUser,
  updateAdminSettings,
} from '@/lib/api';

export default function ManagementViews({ active }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [userForm, setUserForm] = useState({ email: '', password: '', display_name: '', role: 'user' });
  const [productForm, setProductForm] = useState({ name: '', barcode: '', category: 'Food & Beverage', ingredients_text: '', status: 'active' });
  const [allergenForm, setAllergenForm] = useState({ id: '', name: '', terms: '' });
  const [settingsForm, setSettingsForm] = useState(null);
  const [profileUser, setProfileUser] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      if (active === 'users') {
        setData(await getAdminUsers());
      } else if (active === 'products') {
        setData(await getAdminProducts());
      } else if (active === 'scans') {
        setData(await getAdminScans());
      } else if (active === 'allergens') {
        setData(await getAdminAllergens());
      } else if (active === 'reports') {
        setData(await getAdminReports());
      } else if (active === 'logs') {
        setData(await getAdminLogs());
      } else if (active === 'settings') {
        const s = await getAdminSettings();
        setSettingsForm(s);
        setData(s);
      } else if (active === 'profile') {
        const u = await getCurrentUser().catch(() => ({ email: 'admin@safelabelai.com', display_name: 'Admin', role: 'admin', status: 'active' }));
        setProfileUser(u);
        setData(u);
      }
    } catch (err) {
      setError(err.message || 'Error loading records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setShowAddModal(false);
    load();
  }, [active]);

  // Handlers for Add/Delete
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!userForm.email || !userForm.password) return;
    try {
      await createAdminUser(userForm);
      setSuccessMsg(`User '${userForm.email}' created successfully!`);
      setUserForm({ email: '', password: '', display_name: '', role: 'user' });
      setShowAddModal(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (id, email) => {
    if (!confirm(`Delete user ${email}?`)) return;
    try {
      await deleteAdminUser(id);
      setSuccessMsg(`User deleted.`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name) return;
    try {
      await createAdminProduct(productForm);
      setSuccessMsg(`Product '${productForm.name}' added successfully!`);
      setProductForm({ name: '', barcode: '', category: 'Food & Beverage', ingredients_text: '', status: 'active' });
      setShowAddModal(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`Delete product ${name}?`)) return;
    try {
      await deleteAdminProduct(id);
      setSuccessMsg(`Product deleted.`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddAllergen = async (e) => {
    e.preventDefault();
    if (!allergenForm.id || !allergenForm.name) return;
    try {
      const termsList = allergenForm.terms.split(',').map((t) => t.trim()).filter(Boolean);
      await createAdminAllergen({ id: allergenForm.id, name: allergenForm.name, terms: termsList });
      setSuccessMsg(`Allergen '${allergenForm.name}' updated successfully!`);
      setAllergenForm({ id: '', name: '', terms: '' });
      setShowAddModal(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteAllergen = async (id) => {
    if (!confirm(`Delete allergen '${id}'?`)) return;
    try {
      await deleteAdminAllergen(id);
      setSuccessMsg(`Allergen deleted.`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await updateAdminSettings(settingsForm);
      setSuccessMsg('System configuration saved successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardContent className="p-0">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h3 className="font-heading text-sm font-bold text-slate-800">
              {active === 'users' && 'User Management'}
              {active === 'products' && 'Product Catalog'}
              {active === 'scans' && 'Scans & Allergen Logs'}
              {active === 'allergens' && 'Allergen Rules & Synonyms'}
              {active === 'reports' && 'Platform Analytics & Reports'}
              {active === 'logs' && 'System Activity Logs'}
              {active === 'settings' && 'Platform Settings'}
              {active === 'profile' && 'Administrator Profile'}
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">Live PostgreSQL synchronization</p>
          </div>

          <div className="flex items-center gap-2">
            {(active === 'users' || active === 'products' || active === 'allergens') && (
              <Button size="sm" onClick={() => setShowAddModal(!showAddModal)}>
                {showAddModal ? <X size={14} /> : <Plus size={14} />}
                {showAddModal ? 'Close Form' : `Add ${active.slice(0, -1)}`}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={load} disabled={loading}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Status notifications */}
        {error && (
          <div className="m-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="m-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
            <Check size={15} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Interactive Add User Form */}
        {showAddModal && active === 'users' && (
          <form onSubmit={handleAddUser} className="border-b border-slate-100 bg-[#f9fcff] p-5">
            <h4 className="mb-3 text-xs font-bold text-slate-700">Create New User Account</h4>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Display Name</label>
                <Input
                  className="mt-1"
                  placeholder="e.g. Sarah Jenkins"
                  value={userForm.display_name}
                  onChange={(e) => setUserForm({ ...userForm, display_name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Email Address *</label>
                <Input
                  className="mt-1"
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Password (min 8 chars) *</label>
                <Input
                  className="mt-1"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Role</label>
                <select
                  className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none"
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" size="sm">Create User</Button>
            </div>
          </form>
        )}

        {/* Interactive Add Product Form */}
        {showAddModal && active === 'products' && (
          <form onSubmit={handleAddProduct} className="border-b border-slate-100 bg-[#f9fcff] p-5">
            <h4 className="mb-3 text-xs font-bold text-slate-700">Add New Food Product to Catalog</h4>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Product Name *</label>
                <Input
                  className="mt-1"
                  required
                  placeholder="e.g. Crunchy Peanut Butter"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Barcode / UPC</label>
                <Input
                  className="mt-1"
                  placeholder="e.g. 5000159481122"
                  value={productForm.barcode}
                  onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Category</label>
                <Input
                  className="mt-1"
                  placeholder="e.g. Spreads, Bakery, Snacks"
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2 md:col-span-3">
                <label className="text-[11px] font-semibold text-slate-600">Ingredients Text</label>
                <Input
                  className="mt-1"
                  placeholder="e.g. Roasted Peanuts (90%), Palm Oil, Sugar, Salt."
                  value={productForm.ingredients_text}
                  onChange={(e) => setProductForm({ ...productForm, ingredients_text: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" size="sm">Save Product</Button>
            </div>
          </form>
        )}

        {/* Interactive Add Allergen Form */}
        {showAddModal && active === 'allergens' && (
          <form onSubmit={handleAddAllergen} className="border-b border-slate-100 bg-[#f9fcff] p-5">
            <h4 className="mb-3 text-xs font-bold text-slate-700">Add or Update Allergen Detection Rule</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Identifier (Key) *</label>
                <Input
                  className="mt-1"
                  required
                  placeholder="e.g. gluten"
                  value={allergenForm.id}
                  onChange={(e) => setAllergenForm({ ...allergenForm, id: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Display Name *</label>
                <Input
                  className="mt-1"
                  required
                  placeholder="e.g. Gluten / Cereals"
                  value={allergenForm.name}
                  onChange={(e) => setAllergenForm({ ...allergenForm, name: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600">Synonyms & Terms (comma-separated)</label>
                <Input
                  className="mt-1"
                  placeholder="e.g. wheat, barley, rye, oats, spelt, kamut"
                  value={allergenForm.terms}
                  onChange={(e) => setAllergenForm({ ...allergenForm, terms: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" size="sm">Save Allergen Rule</Button>
            </div>
          </form>
        )}

        {/* Views Router */}
        {active === 'users' && (
          <UsersTable
            rows={Array.isArray(data) ? data : []}
            onDelete={handleDeleteUser}
          />
        )}

        {active === 'products' && (
          <ProductsTable
            rows={Array.isArray(data) ? data : []}
            onDelete={handleDeleteProduct}
          />
        )}

        {active === 'scans' && (
          <ScansTable rows={Array.isArray(data) ? data : []} />
        )}

        {active === 'allergens' && (
          <AllergensTable
            rows={Array.isArray(data) ? data : []}
            onDelete={handleDeleteAllergen}
          />
        )}

        {active === 'reports' && (
          <ReportsView reports={data || {}} />
        )}

        {active === 'logs' && (
          <LogsTable rows={Array.isArray(data) ? data : []} />
        )}

        {active === 'settings' && settingsForm && (
          <SettingsView
            settings={settingsForm}
            onChange={setSettingsForm}
            onSave={handleSaveSettings}
          />
        )}

        {active === 'profile' && (
          <ProfileView user={profileUser} />
        )}
      </CardContent>
    </Card>
  );
}

// 1. Users Table
function UsersTable({ rows, onDelete }) {
  if (!rows.length) return <p className="p-6 text-xs text-slate-400">No users found.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="px-5 py-3 font-semibold text-slate-400">User</th>
            <th className="px-5 py-3 font-semibold text-slate-400">Email</th>
            <th className="px-5 py-3 font-semibold text-slate-400">Role</th>
            <th className="px-5 py-3 font-semibold text-slate-400">Status</th>
            <th className="px-5 py-3 font-semibold text-slate-400">Joined</th>
            <th className="px-5 py-3 text-right font-semibold text-slate-400">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((user) => (
            <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50">
              <td className="px-5 py-3.5 font-semibold text-slate-700">{user.display_name || 'Unnamed'}</td>
              <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">{user.email}</td>
              <td className="px-5 py-3.5">
                <Badge variant={user.role === 'admin' ? 'info' : 'success'}>{user.role}</Badge>
              </td>
              <td className="px-5 py-3.5">
                <Badge variant={user.status === 'active' ? 'success' : 'danger'}>{user.status}</Badge>
              </td>
              <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
              </td>
              <td className="px-5 py-3.5 text-right">
                <button
                  onClick={() => onDelete(user.id, user.email)}
                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                  title="Delete user"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 2. Products Table
function ProductsTable({ rows, onDelete }) {
  if (!rows.length) return <p className="p-6 text-xs text-slate-400">No products indexed yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="px-5 py-3 font-semibold text-slate-400">Product Name</th>
            <th className="px-5 py-3 font-semibold text-slate-400">Barcode</th>
            <th className="px-5 py-3 font-semibold text-slate-400">Category</th>
            <th className="px-5 py-3 font-semibold text-slate-400">Ingredients</th>
            <th className="px-5 py-3 font-semibold text-slate-400">Status</th>
            <th className="px-5 py-3 text-right font-semibold text-slate-400">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((product) => (
            <tr key={product.id} className="border-b border-slate-50 hover:bg-slate-50/50">
              <td className="px-5 py-3.5 font-semibold text-slate-700">{product.name}</td>
              <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{product.barcode || '-'}</td>
              <td className="px-5 py-3.5 text-slate-600">{product.category}</td>
              <td className="max-w-xs truncate px-5 py-3.5 text-slate-400 text-[11px]" title={product.ingredients_text}>
                {product.ingredients_text || 'No ingredients listed'}
              </td>
              <td className="px-5 py-3.5">
                <Badge variant={product.status === 'active' ? 'success' : 'warning'}>{product.status}</Badge>
              </td>
              <td className="px-5 py-3.5 text-right">
                <button
                  onClick={() => onDelete(product.id, product.name)}
                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                  title="Delete product"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 3. Scans Table
function ScansTable({ rows }) {
  if (!rows.length) return <p className="p-6 text-xs text-slate-400">No scans recorded yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="px-5 py-3 font-semibold text-slate-400">Product</th>
            <th className="px-5 py-3 font-semibold text-slate-400">Scanned By</th>
            <th className="px-5 py-3 font-semibold text-slate-400">AI Verdict</th>
            <th className="px-5 py-3 font-semibold text-slate-400">Scan Source</th>
            <th className="px-5 py-3 font-semibold text-slate-400">Date & Time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((scan) => (
            <tr key={scan.id} className="border-b border-slate-50 hover:bg-slate-50/50">
              <td className="px-5 py-3.5 font-semibold text-slate-700">{scan.product_name}</td>
              <td className="px-5 py-3.5 text-slate-500">{scan.user_name}</td>
              <td className="px-5 py-3.5">
                <Badge variant={scan.verdict === 'danger' ? 'danger' : scan.verdict === 'caution' ? 'warning' : 'success'}>
                  {scan.verdict}
                </Badge>
              </td>
              <td className="px-5 py-3.5 uppercase font-mono text-[10px] text-slate-400">{scan.source}</td>
              <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                {scan.created_at ? new Date(scan.created_at).toLocaleString() : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 4. Allergens Table
function AllergensTable({ rows, onDelete }) {
  if (!rows.length) return <p className="p-6 text-xs text-slate-400">No allergens configured.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="px-5 py-3 font-semibold text-slate-400">Allergen Name</th>
            <th className="px-5 py-3 font-semibold text-slate-400">Key</th>
            <th className="px-5 py-3 font-semibold text-slate-400">Recognized Synonyms & Terms</th>
            <th className="px-5 py-3 text-right font-semibold text-slate-400">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((allergen) => (
            <tr key={allergen.id} className="border-b border-slate-50 hover:bg-slate-50/50">
              <td className="px-5 py-3.5 font-semibold text-slate-700">{allergen.name || allergen.id}</td>
              <td className="px-5 py-3.5 font-mono text-[11px] text-blue-600">{allergen.id}</td>
              <td className="px-5 py-3.5">
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(allergen.terms) && allergen.terms.length ? (
                    allergen.terms.map((term) => (
                      <span key={term} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                        {term}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </div>
              </td>
              <td className="px-5 py-3.5 text-right">
                <button
                  onClick={() => onDelete(allergen.id)}
                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                  title="Delete allergen"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 5. Reports View
function ReportsView({ reports }) {
  const verdicts = reports.verdicts || {};
  const sources = reports.sources || {};
  const total = reports.total_scans || 1;

  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-[#f8fbfe] p-5">
          <p className="text-xs text-slate-500 font-medium">Overall Safety Ratio</p>
          <strong className="mt-2 block text-3xl font-bold text-emerald-600">{reports.safety_rate ?? 100}%</strong>
          <p className="mt-1 text-[11px] text-slate-400">Percentage of scans without allergens</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-[#f8fbfe] p-5">
          <p className="text-xs text-slate-500 font-medium">Danger Alerts Flagged</p>
          <strong className="mt-2 block text-3xl font-bold text-red-600">{reports.danger_count ?? 0}</strong>
          <p className="mt-1 text-[11px] text-slate-400">Scans containing user allergens</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-[#f8fbfe] p-5">
          <p className="text-xs text-slate-500 font-medium">Trace Precaution Warnings</p>
          <strong className="mt-2 block text-3xl font-bold text-amber-600">{reports.caution_count ?? 0}</strong>
          <p className="mt-1 text-[11px] text-slate-400">Potential cross-contamination warnings</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-100 p-5">
          <h4 className="text-xs font-bold text-slate-700 mb-4">Verdict Breakdown</h4>
          <div className="space-y-3">
            {['safe', 'danger', 'caution'].map((k) => {
              const count = verdicts[k] || 0;
              const pct = Math.round((count / total) * 100);
              const color = k === 'safe' ? 'bg-emerald-500' : k === 'danger' ? 'bg-red-500' : 'bg-amber-500';
              return (
                <div key={k}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="capitalize font-semibold text-slate-600">{k}</span>
                    <span className="text-slate-400">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 p-5">
          <h4 className="text-xs font-bold text-slate-700 mb-4">Scan Channels</h4>
          <div className="space-y-3">
            {Object.entries(sources).map(([k, count]) => {
              const pct = Math.round((count / total) * 100);
              return (
                <div key={k}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="uppercase font-mono text-slate-600">{k}</span>
                    <span className="text-slate-400">{count} scans</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// 6. Logs Table
function LogsTable({ rows }) {
  if (!rows.length) return <p className="p-6 text-xs text-slate-400">No system logs recorded.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="px-5 py-3 font-semibold text-slate-400">Level</th>
            <th className="px-5 py-3 font-semibold text-slate-400">Event</th>
            <th className="px-5 py-3 font-semibold text-slate-400">Message</th>
            <th className="px-5 py-3 font-semibold text-slate-400">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((log) => (
            <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50">
              <td className="px-5 py-3.5">
                <Badge variant={log.level === 'ERROR' ? 'danger' : log.level === 'WARNING' ? 'warning' : 'info'}>
                  {log.level}
                </Badge>
              </td>
              <td className="px-5 py-3.5 font-mono text-[11px] font-semibold text-slate-700">{log.event}</td>
              <td className="px-5 py-3.5 text-slate-600">{log.message}</td>
              <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 7. Settings View
function SettingsView({ settings, onChange, onSave }) {
  return (
    <form onSubmit={onSave} className="p-6 max-w-xl space-y-5">
      <div>
        <label className="block text-xs font-semibold text-slate-700">
          AI Detection Confidence Threshold: {(settings.ai_threshold * 100).toFixed(0)}%
        </label>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Minimum spaCy and keyword matching score required to flag an allergen
        </p>
        <input
          type="range"
          min="0.5"
          max="0.95"
          step="0.05"
          value={settings.ai_threshold}
          onChange={(e) => onChange({ ...settings, ai_threshold: parseFloat(e.target.value) })}
          className="mt-2 w-full cursor-pointer accent-[#1269d3]"
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-xs font-semibold text-slate-700">Cache OCR Image Results</p>
          <p className="text-[11px] text-slate-400">Improves response latency for frequently scanned packages</p>
        </div>
        <input
          type="checkbox"
          checked={Boolean(settings.enable_ocr_cache)}
          onChange={(e) => onChange({ ...settings, enable_ocr_cache: e.target.checked })}
          className="h-4 w-4 rounded accent-[#1269d3]"
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-xs font-semibold text-slate-700">High-Alert on "May Contain" Traces</p>
          <p className="text-[11px] text-slate-400">Classify cross-contamination warnings as Caution</p>
        </div>
        <input
          type="checkbox"
          checked={Boolean(settings.alert_on_traces)}
          onChange={(e) => onChange({ ...settings, alert_on_traces: e.target.checked })}
          className="h-4 w-4 rounded accent-[#1269d3]"
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-xs font-semibold text-slate-700">Admin Notification Webhooks</p>
          <p className="text-[11px] text-slate-400">Broadcast security and scan anomalies</p>
        </div>
        <input
          type="checkbox"
          checked={Boolean(settings.notifications_enabled)}
          onChange={(e) => onChange({ ...settings, notifications_enabled: e.target.checked })}
          className="h-4 w-4 rounded accent-[#1269d3]"
        />
      </div>

      <div className="pt-4">
        <Button type="submit">
          <Save size={14} />
          Save Platform Settings
        </Button>
      </div>
    </form>
  );
}

// 8. Profile View
function ProfileView({ user }) {
  return (
    <div className="p-6 max-w-lg space-y-6">
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#1269d3] text-2xl font-bold text-white shadow-md">
          {user?.display_name ? user.display_name[0].toUpperCase() : 'A'}
        </div>
        <div>
          <h4 className="font-heading text-lg font-bold text-slate-800">{user?.display_name || 'System Admin'}</h4>
          <p className="text-xs text-slate-400 font-mono">{user?.email || 'admin@safelabelai.com'}</p>
          <div className="mt-2 flex gap-2">
            <Badge variant="info">{user?.role || 'admin'}</Badge>
            <Badge variant="success">{user?.status || 'active'}</Badge>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-100 bg-[#f8fbfe] p-4 text-xs space-y-2 text-slate-600">
        <div className="flex justify-between border-b border-slate-100 pb-2">
          <span className="text-slate-400">User ID</span>
          <span className="font-mono text-[11px]">{user?.id || 'Authenticated'}</span>
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
    </div>
  );
}
