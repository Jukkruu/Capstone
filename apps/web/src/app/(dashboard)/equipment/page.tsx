'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { STATUS_COLORS, CATEGORIES } from '@/types';

const STATUSES = ['SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'NOMINATED', 'REJECTED', 'EXPORTED'];

export default function EquipmentListPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">Loading…</div>}>
      <EquipmentContent />
    </Suspense>
  );
}

function EquipmentContent() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const router = useRouter();
  const params = useSearchParams();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(params.get('status') || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const load = () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (statusFilter) q.set('status', statusFilter);
    if (categoryFilter) q.set('category', categoryFilter);
    api.get(`/api/equipment?${q.toString()}`).then(r => {
      setItems(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter, categoryFilter]);

  const toggleSelect = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const canCompare = selected.length >= 2 && selected.length <= 4;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment</h1>
          <p className="text-sm text-gray-500 mt-0.5">Asset submissions and equipment master records</p>
        </div>
        <div className="flex items-center gap-2">
          {canCompare && (
            <button
              onClick={() => router.push(`/equipment/compare?ids=${selected.join(',')}`)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700"
            >
              Compare {selected.length} Assets
            </button>
          )}
          {(user?.role === 'GCP' || user?.role === 'ADMIN') && (
            <button
              onClick={() => { /* export */ api.get('/api/equipment/export').then(r => console.log(r.data)); }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search name, brand, model…"
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
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All Categories</option>
          {Object.keys(CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={load} className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800">
          Search
        </button>
      </div>

      {selected.length > 0 && (
        <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
          <span>{selected.length} selected for comparison</span>
          <button onClick={() => setSelected([])} className="text-red-500 hover:underline">Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="w-8 px-4 py-3"></th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Asset</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Brand / Model</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Vendor</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading…</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">No equipment found.</td></tr>
            )}
            {items.map(eq => (
              <tr key={eq.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(eq.id)}
                    onChange={() => toggleSelect(eq.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/equipment/${eq.id}`} className="font-medium text-gray-900 hover:text-green-700">
                    {eq.nameEn}
                  </Link>
                  {eq.tagNumber && <div className="text-xs text-gray-400">{eq.tagNumber}</div>}
                </td>
                <td className="px-4 py-3 text-gray-600">{eq.category || '—'}</td>
                <td className="px-4 py-3 text-gray-600">
                  {[eq.brand, eq.model].filter(Boolean).join(' / ') || '—'}
                </td>
                <td className="px-4 py-3 text-gray-600">{eq.supplier?.name || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[eq.submissionStatus as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-600'}`}>
                    {eq.submissionStatus.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(eq.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
