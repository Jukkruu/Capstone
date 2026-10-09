'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type TabType = 'supplier' | 'buyer' | 'admin';

const TABS: { id: TabType; label: string; icon: React.ReactNode; hint: string }[] = [
  {
    id: 'supplier',
    label: 'Supplier',
    hint: 'supplier@demo.co.th / Supplier1234!',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 4l9 5.75V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.75z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    id: 'buyer',
    label: 'Buyer (GCP)',
    hint: 'gcp@bigc.co.th / Gcp1234!',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    id: 'admin',
    label: 'Admin',
    hint: 'admin@bigc.co.th / Admin1234!',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabType>('supplier');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const provider = tab === 'supplier' ? 'supplier' : 'bigc';
    const result = await signIn(provider, { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      return;
    }
    router.push('/dashboard');
  };

  const activeTab = TABS.find(t => t.id === tab)!;

  return (
    <div className="bg-auth flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100 px-6 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#0b6330] flex items-center justify-center text-white font-bold text-sm select-none">E</div>
        <span className="font-semibold text-[#0b6330] tracking-wide text-sm">ERMA SUPPLIER PORTAL</span>
        <span className="ml-auto text-xs text-gray-400">Big C / BJC Group</span>
      </header>

      {/* Center card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Brand mark */}
          <div className="text-center mb-8">
            <div className="inline-flex flex-col items-center gap-1">
              <div className="w-16 h-16 rounded-2xl bg-[#0b6330] flex items-center justify-center shadow-lg mb-2">
                <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path strokeLinecap="round" d="M8 21h8M12 17v4" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">เข้าสู่ระบบ</h1>
              <p className="text-sm text-gray-500">Equipment Reference Master App</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setError(''); setEmail(''); setPassword(''); }}
                  className={`flex-1 flex flex-col items-center gap-1 py-3.5 px-2 text-xs font-medium transition-all border-b-2 ${
                    tab === t.id
                      ? 'border-[#0b6330] text-[#0b6330] bg-[#f6fbf8]'
                      : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">อีเมล</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={activeTab.hint.split(' / ')[0]}
                  required
                  className="inp"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">รหัสผ่าน</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="inp"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl px-3 py-2.5 text-sm">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0b6330] hover:bg-[#095228] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all text-sm shadow-sm active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".3" strokeWidth="4"/><path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></svg>
                    กำลังเข้าสู่ระบบ…
                  </span>
                ) : 'เข้าสู่ระบบ'}
              </button>

              <p className="text-center text-xs text-gray-400 pt-1">
                Demo: {activeTab.hint}
              </p>
            </form>
          </div>

          <div className="text-center mt-5">
            <a href="/submit" className="text-sm text-[#0b6330] hover:underline font-medium">
              ส่งข้อมูลครุภัณฑ์โดยไม่ต้องเข้าสู่ระบบ →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
