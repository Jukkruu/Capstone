'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '⬜', roles: ['ADMIN', 'EDITOR', 'GCP', 'USER', 'SUPPLIER'] },
  { href: '/equipment', label: 'Equipment', icon: '🔧', roles: ['ADMIN', 'EDITOR', 'GCP', 'USER', 'SUPPLIER'] },
  { href: '/suppliers', label: 'Vendors', icon: '🏢', roles: ['ADMIN', 'EDITOR', 'GCP'] },
  { href: '/sync', label: 'Sync Monitor', icon: '🔄', roles: ['ADMIN', 'EDITOR', 'GCP'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400">Loading…</div></div>;
  }

  const user = session?.user as any;
  const userRole = user?.role;

  const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(userRole));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col fixed h-full z-20">
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">E</div>
            <div>
              <div className="font-bold text-sm text-gray-900">ERMA Portal</div>
              <div className="text-xs text-gray-400">Big C / BJC Group</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {visibleNav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{user?.name || user?.email}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  userRole === 'ADMIN' ? 'bg-red-100 text-red-700' :
                  userRole === 'GCP' ? 'bg-purple-100 text-purple-700' :
                  userRole === 'EDITOR' ? 'bg-blue-100 text-blue-700' :
                  userRole === 'SUPPLIER' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {userRole}
                </span>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors ml-2"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-60 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}
