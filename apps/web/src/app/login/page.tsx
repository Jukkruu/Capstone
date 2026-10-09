'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

type LoginType = 'bigc' | 'supplier';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [loginType, setLoginType] = useState<LoginType>('bigc');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signIn(loginType, { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError('Invalid email or password. Please try again.');
      return;
    }
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">E</div>
            <div className="text-left">
              <div className="font-bold text-xl text-gray-900">ERMA Supplier Portal</div>
              <div className="text-sm text-gray-500">Big C / BJC Group</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Tab switcher */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            <button
              onClick={() => setLoginType('bigc')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${loginType === 'bigc' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              BigC Staff
            </button>
            <button
              onClick={() => setLoginType('supplier')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${loginType === 'supplier' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Supplier / Vendor
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={loginType === 'bigc' ? 'staff@bigc.co.th' : 'contact@supplier.co.th'}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {loginType === 'bigc' && (
            <div className="mt-4 text-xs text-gray-400 text-center">
              Demo: admin@bigc.co.th / Admin1234! &nbsp;|&nbsp; gcp@bigc.co.th / Gcp1234!
            </div>
          )}
          {loginType === 'supplier' && (
            <div className="mt-4 text-xs text-gray-400 text-center">
              Demo: supplier@demo.co.th / Supplier1234!
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <a href="/submit" className="text-sm text-green-700 hover:underline font-medium">
            Submit asset data without an account →
          </a>
        </div>
      </div>
    </div>
  );
}
