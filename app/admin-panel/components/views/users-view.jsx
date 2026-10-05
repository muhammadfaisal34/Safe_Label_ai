'use client';

import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Trash2, X, UserCheck, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createAdminUser, deleteAdminUser, getAdminUsers } from '@/lib/api';

export default function UsersView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    display_name: '',
    role: 'user',
  });

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    setError('');
    setSuccessMsg('');
    try {
      await createAdminUser(form);
      const createdEmail = form.email;
      setSuccessMsg(`User '${createdEmail}' created successfully!`);
      setForm({ email: '', password: '', display_name: '', role: 'user' });
      setShowAddModal(false);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to create user.');
    }
  };

  const handleDeleteUser = async (id, email) => {
    if (!confirm(`Are you sure you want to delete user '${email}'?`)) return;
    setError('');
    setSuccessMsg('');
    try {
      await deleteAdminUser(id);
      setSuccessMsg(`User '${email}' deleted successfully!`);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to delete user.');
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
            <CardTitle>User Management</CardTitle>
            <CardDescription className="mt-1">
              View, add, and manage user accounts and system permissions
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
              {showAddModal ? 'Cancel' : 'Add User'}
            </Button>
            <Button size="sm" variant="outline" onClick={loadUsers} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>

        {/* Add User Form Section */}
        {showAddModal && (
          <div className="border-b border-slate-100 bg-slate-50/50 p-6 transition-all">
            <form onSubmit={handleCreateUser} className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Create New Account
              </h4>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Display Name</label>
                  <Input
                    className="mt-1"
                    placeholder="e.g. Sarah Jenkins"
                    value={form.display_name}
                    onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Email Address *</label>
                  <Input
                    className="mt-1"
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Password *</label>
                  <Input
                    className="mt-1"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Role</label>
                  <select
                    className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="user">User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Create User
                </Button>
              </div>
            </form>
          </div>
        )}

        <CardContent className="p-0">
          {!users.length && !loading ? (
            <div className="p-8 text-center text-xs text-slate-400">No users found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-semibold text-slate-800">
                      {u.display_name || 'Unnamed User'}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-slate-500">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'admin' ? 'info' : 'success'}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.status === 'active' ? 'success' : 'danger'}>
                        {u.status || 'active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[11px] text-slate-400">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        title="Delete User"
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
