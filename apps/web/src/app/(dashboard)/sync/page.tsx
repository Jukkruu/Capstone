'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

const SYNC_STATUS_COLORS: Record<string, string> = {
  SUCCESS: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  SKIPPED: 'bg-gray-100 text-gray-500',
};

export default function SyncPage() {
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const loadStats = () => {
    api.get('/api/equipment/sync-stats').then(r => {
      setStats(r.data);
      setLogs(r.data.recentLogs || []);  // service returns recentLogs
    }).catch(() => {});
  };

  useEffect(() => { loadStats(); }, []);

  const runSync = async (type: 'cms' | 'fa') => {
    setRunning(type);
    setMsg('');
    try {
      const r = await api.post(`/api/equipment/batch/sync-${type}`);
      const d = r.data;
      setMsg(`${type.toUpperCase()} sync complete: ${d.synced ?? 0} synced, ${d.failed ?? 0} failed out of ${d.total ?? 0} records.`);
      loadStats();
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Sync failed.');
    } finally {
      setRunning(null);
    }
  };

  const statCards = [
    { label: 'Synced to CMS', value: stats?.synced ?? '—', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { label: 'Queued', value: stats?.queued ?? '—', color: 'bg-orange-50 border-orange-200 text-orange-700' },
    { label: 'Sync Failed', value: stats?.failed ?? '—', color: 'bg-red-50 border-red-200 text-red-700' },
    { label: 'Total Equipment', value: stats?.total ?? '—', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sync Monitor</h1>
        <p className="text-sm text-gray-500 mt-0.5">Batch synchronisation to CMS and Fixed Asset systems</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(c => (
          <div key={c.label} className={`border rounded-xl p-4 ${c.color}`}>
            <div className="text-xs font-semibold uppercase tracking-wide opacity-75">{c.label}</div>
            <div className="text-3xl font-bold mt-1">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Batch actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-1">Run Batch Sync</h2>
        <p className="text-sm text-gray-500 mb-4">
          Processes all equipment records with <span className="font-mono text-xs bg-orange-50 px-1 rounded">QUEUED</span> status.
          Results are mocked (90% success rate for development).
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            disabled={!!running}
            onClick={() => runSync('cms')}
            className="px-5 py-2.5 bg-green-700 text-white text-sm font-semibold rounded-lg hover:bg-green-800 disabled:opacity-50 flex items-center gap-2"
          >
            {running === 'cms' && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Sync to CMS
          </button>
          <button
            disabled={!!running}
            onClick={() => runSync('fa')}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {running === 'fa' && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Sync to Fixed Asset
          </button>
          <button
            onClick={loadStats}
            className="px-4 py-2.5 border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
        {msg && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            {msg}
          </div>
        )}
      </div>

      {/* Recent sync log */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Sync Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Equipment</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Direction</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Target</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Message</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    No sync activity yet. Run a batch sync to see logs here.
                  </td>
                </tr>
              )}
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {log.equipment?.nameEn || log.equipmentId?.slice(0, 8) + '…'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs font-mono">{log.direction}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{log.targetSystem}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SYNC_STATUS_COLORS[log.status] || 'bg-gray-100 text-gray-600'}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{log.errorMessage || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(log.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
