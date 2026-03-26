'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';

export default function VendorLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/vendor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      // Clear normal user session to avoid mixed auth state
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Store vendor info and token
      localStorage.setItem('vendorToken', data.token);
      localStorage.setItem('vendorInfo', JSON.stringify(data.vendor));

      setMessage('✅ Login successful! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/vendor/dashboard');
      }, 1000);
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'Login failed';
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <Header />

      <div className="max-w-md mx-auto px-4 py-24">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-emerald-600 mb-1">Vendor Login</h1>
          <p className="text-gray-600 mb-8">Access your vendor dashboard</p>

          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="your@business.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center border-t pt-6">
            <p className="text-gray-600 mb-4">New vendor?</p>
            <Link
              href="/vendor/register"
              className="inline-block bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-semibold py-2 px-6 rounded-lg transition"
            >
              Register Here
            </Link>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>📧 Important:</strong> After registration, your account needs admin approval before you can login. Check your email for approval updates. Once approved, you'll be able to login and access your dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
