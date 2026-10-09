'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface Stats {
  synced: number;
  queued: number;
  failed: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentEquipment, setRecentEquipment] = useState<any[]>([]);

  useEffect(() => {
    api.get('/api/equipment/sync-stats').then(r => setStats(r.data)).catch(() => {});
    api.get('/api/equipment?limit=5').then(r => setRecentEquipment(r.data)).catch(() => {});
  }, []);

  const STATUS_COLOR: Record<string, string> = {
    SUBMITTED: 'bg-blue-100 text-blue-700',
    PENDING_REVIEW: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    NOMINATED: 'bg-purple-100 text-purple-700',
    REJECTED: 'bg-red-100 text-red-700',
    DRAFT: 'bg-gray-100 text-gray-600',
    EXPORTED: 'bg-teal-100 text-teal-700',
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.name?.split(' ')[0] || 'User'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">ERMA Supplier Portal — Equipment Reference Master</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {(user?.role === 'GCP' || user?.role === 'ADMIN') && (
          <>
            <Link href="/equipment?status=PENDING_REVIEW" className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 hover:bg-yellow-100 transition-colors">
              <div className="text-yellow-700 font-semibold text-sm">Pending Review</div>
              <div className="text-2xl font-bold text-yellow-800 mt-1">—</div>
              <div className="text-xs text-yellow-600 mt-1">Assets awaiting your review</div>
            </Link>
            <Link href="/equipment?status=APPROVED" className="bg-green-50 border border-green-200 rounded-xl p-4 hover:bg-green-100 transition-colors">
              <div className="text-green-700 font-semibold text-sm">Approved</div>
              <div className="text-2xl font-bold text-green-800 mt-1">—</div>
              <div className="text-xs text-green-600 mt-1">Ready for nomination</div>
            </Link>
          </>
        )}
        {user?.role === 'SUPPLIER' && (
          <Link href="/equipment" className="bg-blue-50 border border-blue-200 rounded-xl p-4 hover:bg-blue-100 transition-colors">
            <div className="text-blue-700 font-semibold text-sm">My Submissions</div>
            <div className="text-2xl font-bold text-blue-800 mt-1">{recentEquipment.length}</div>
            <div className="text-xs text-blue-600 mt-1">Equipment records submitted</div>
          </Link>
        )}
        {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && stats && (
          <>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="text-emerald-700 font-semibold text-sm">Synced to CMS</div>
              <div className="text-2xl font-bold text-emerald-800 mt-1">{stats.synced}</div>
              <div className="text-xs text-emerald-600 mt-1">Equipment records synced</div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="text-orange-700 font-semibold text-sm">Queued</div>
              <div className="text-2xl font-bold text-orange-800 mt-1">{stats.queued}</div>
              <div className="text-xs text-orange-600 mt-1">Awaiting batch sync</div>
            </div>
            {stats.failed > 0 && (
              <Link href="/sync" className="bg-red-50 border border-red-200 rounded-xl p-4 hover:bg-red-100 transition-colors">
                <div className="text-red-700 font-semibold text-sm">Sync Failed</div>
                <div className="text-2xl font-bold text-red-800 mt-1">{stats.failed}</div>
                <div className="text-xs text-red-600 mt-1">Needs attention → Sync Monitor</div>
              </Link>
            )}
          </>
        )}
      </div>

      {/* Recent equipment */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Equipment</h2>
          <Link href="/equipment" className="text-sm text-green-700 hover:underline">View all</Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentEquipment.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No equipment yet.</div>
          )}
          {recentEquipment.map((eq: any) => (
            <Link key={eq.id} href={`/equipment/${eq.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
              <div className="min-w-0">
                <div className="font-medium text-sm text-gray-900 truncate">{eq.nameEn}</div>
                <div className="text-xs text-gray-400 mt-0.5">{eq.category} {eq.brand ? `· ${eq.brand}` : ''} {eq.model ? `· ${eq.model}` : ''}</div>
              </div>
              <span className={`ml-3 shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[eq.submissionStatus] || 'bg-gray-100 text-gray-600'}`}>
                {eq.submissionStatus.replace('_', ' ')}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
