'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import api from '@/lib/api';

const ACCOUNT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-500',
  PENDING: 'bg-yellow-100 text-yellow-700',
};

export default function SuppliersPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const canEdit = user?.role === 'ADMIN' || user?.role === 'EDITOR';

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const load = () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (statusFilter) q.set('status', statusFilter);
    api.get(`/api/suppliers?${q.toString()}`).then(r => {
      // Normalize field names from API
      setSuppliers(r.data.map((s: any) => ({
        ...s,
        email: s.contactEmail,
        phone: s.contactPhone,
        status: s.accountStatus,
        createdAt: s.registeredAt,
      })));
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this supplier?')) return;
    await api.patch(`/api/suppliers/${id}/deactivate`);
    setActionMsg('Supplier deactivated.');
    load();
  };

  const handleReactivate = async (id: string) => {
    await api.patch(`/api/suppliers/${id}/reactivate`);
    setActionMsg('Supplier reactivated.');
    load();
  };

  const handleResend = async (id: string) => {
    await api.post(`/api/suppliers/${id}/resend-password`);
    setActionMsg('Temporary password resent to supplier email.');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage supplier accounts and access</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-700 text-white text-sm font-semibold rounded-lg hover:bg-green-800"
          >
            + Register Vendor
          </button>
        )}
      </div>

      {actionMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex justify-between">
          {actionMsg}
          <button onClick={() => setActionMsg('')} className="text-green-500 hover:text-green-700">✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search name, email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="PENDING">Pending</option>
        </select>
        <button onClick={load} className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800">
          Search
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Company</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Contact</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Country</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Registered</th>
              {canEdit && <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading…</td></tr>}
            {!loading && suppliers.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">No vendors found.</td></tr>
            )}
            {suppliers.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{s.name}</div>
                  {s.taxId && <div className="text-xs text-gray-400">Tax ID: {s.taxId}</div>}
                </td>
                <td className="px-4 py-3 text-gray-600">{s.contactName || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{s.email}</td>
                <td className="px-4 py-3 text-gray-600">{s.country || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACCOUNT_STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-600'}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(s.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                {canEdit && (
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {s.status === 'ACTIVE' && (
                        <button onClick={() => handleDeactivate(s.id)} className="text-xs text-red-600 hover:underline">
                          Deactivate
                        </button>
                      )}
                      {s.status === 'INACTIVE' && (
                        <button onClick={() => handleReactivate(s.id)} className="text-xs text-green-700 hover:underline">
                          Reactivate
                        </button>
                      )}
                      <button onClick={() => handleResend(s.id)} className="text-xs text-blue-600 hover:underline">
                        Resend PW
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && <AddSupplierModal onClose={() => setShowAddModal(false)} onSuccess={(msg) => { setActionMsg(msg); setShowAddModal(false); load(); }} />}
    </div>
  );
}

function AddSupplierModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (msg: string) => void }) {
  const [form, setForm] = useState({
    name: '', email: '', contactName: '', phone: '', country: '', taxId: '',
    address: '', website: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/api/suppliers', form);
      onSuccess('Vendor registered. Temporary password sent to their email.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-lg">Register Vendor</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Company Name *</label>
              <input required value={form.name} onChange={set('name')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
              <input required type="email" value={form.email} onChange={set('email')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contact Name</label>
              <input value={form.contactName} onChange={set('contactName')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.phone} onChange={set('phone')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
              <input value={form.country} onChange={set('country')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tax ID</label>
              <input value={form.taxId} onChange={set('taxId')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
              <input value={form.address} onChange={set('address')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-green-700 text-white text-sm rounded-lg font-medium hover:bg-green-800 disabled:opacity-50">
              {submitting ? 'Registering…' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
