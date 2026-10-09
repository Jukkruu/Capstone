'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    roles: ['ADMIN', 'EDITOR', 'GCP', 'USER', 'SUPPLIER'],
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/equipment',
    label: 'Equipment',
    roles: ['ADMIN', 'EDITOR', 'GCP', 'USER', 'SUPPLIER'],
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
  },
  {
    href: '/suppliers',
    label: 'Vendors',
    roles: ['ADMIN', 'EDITOR', 'GCP'],
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    href: '/sync',
    label: 'Sync Monitor',
    roles: ['ADMIN', 'EDITOR', 'GCP'],
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
];

const ROLE_BADGE: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  GCP: 'bg-violet-100 text-violet-700',
  EDITOR: 'bg-blue-100 text-blue-700',
  SUPPLIER: 'bg-amber-100 text-amber-700',
  USER: 'bg-gray-100 text-gray-600',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="4" />
            <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  const user = session?.user as any;
  const userRole = user?.role as string;
  const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(userRole));

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Top navbar */}
      <header className="fixed top-0 left-0 right-0 z-30 h-14 bg-white border-b border-gray-100 flex items-center px-5 gap-4 shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-2.5 min-w-[220px]">
          <div className="w-7 h-7 rounded-lg bg-[#0b6330] flex items-center justify-center text-white font-bold text-xs select-none">E</div>
          <span className="font-bold text-sm text-[#0b6330] tracking-wide">ERMA PORTAL</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Role badge */}
        {userRole && (
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${ROLE_BADGE[userRole] ?? ROLE_BADGE.USER}`}>
            {userRole}
          </span>
        )}

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(v => !v)}
            className="flex items-center gap-2 hover:bg-gray-50 rounded-xl px-2.5 py-1.5 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#0b6330] flex items-center justify-center text-white text-xs font-bold select-none">
              {(user?.name ?? user?.email ?? 'U')[0].toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-700 max-w-[140px] truncate hidden sm:block">
              {user?.name ?? user?.email}
            </span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-gray-100 rounded-2xl shadow-lg py-1 z-50">
              <div className="px-4 py-2.5 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-900 truncate">{user?.name ?? '—'}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                ออกจากระบบ
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 pt-14">
        {/* Sidebar */}
        <aside className="fixed left-0 top-14 bottom-0 w-60 bg-white border-r border-gray-100 flex flex-col z-20 overflow-y-auto">
          <nav className="flex-1 p-3 space-y-0.5 mt-2">
            {visibleNav.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#e6f7f0] text-[#059669] font-semibold'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  <span className={active ? 'text-[#059669]' : 'text-gray-400'}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 text-xs text-gray-400 text-center">
            Big C / BJC Group © 2025
          </div>
        </aside>

        {/* Page content */}
        <main className="ml-60 flex-1 min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
      </div>

      {/* Backdrop for user menu */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-20" onClick={() => setUserMenuOpen(false)} />
      )}
    </div>
  );
}
