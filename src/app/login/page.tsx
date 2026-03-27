'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogoImage } from '@/components/Logo';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup } from 'firebase/auth';
import { firebaseAuth, googleProvider } from '@/lib/firebaseClient';

export default function LoginPage() {
  const [redirectTo, setRedirectTo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('redirect');
    setRedirectTo(value || '');
  }, []);

  const persistSession = (data: any) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    if (data.user?.role === 'vendor') {
      localStorage.setItem('vendorToken', data.token);
      localStorage.setItem(
        'vendorInfo',
        JSON.stringify({
          _id: data.user.id,
          vendorName: data.user.fullName,
          email: data.user.email,
          status: data.user.vendorStatus || 'pending',
        })
      );
      router.push('/vendor/dashboard');
      return;
    }

    if (data.user?.role === 'admin') {
      router.push('/admin');
      return;
    }

    if (data.user?.role === 'doctor') {
      router.push('/doctor/panel');
      return;
    }

    if (redirectTo && redirectTo.startsWith('/')) {
      router.push(redirectTo);
      return;
    }

    router.push('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      persistSession(data);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const credential = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await credential.user.getIdToken(true);

      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Google login failed');
        return;
      }

      persistSession(data);
    } catch (err: any) {
      setError(err?.message || 'Google login failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePhoneLogin = async () => {
    setError('');
    setPhoneLoading(true);

    let verifier: RecaptchaVerifier | null = null;
    try {
      const phoneInput = window.prompt('Enter phone in international format (example: +919876543210):', '');
      const phoneNumber = String(phoneInput || '').trim();
      if (!phoneNumber) {
        setPhoneLoading(false);
        return;
      }

      verifier = new RecaptchaVerifier(firebaseAuth, 'firebase-phone-recaptcha', {
        size: 'invisible',
      });

      const confirmation = await signInWithPhoneNumber(firebaseAuth, phoneNumber, verifier);
      const otp = window.prompt('Enter the OTP sent to your phone:', '');
      if (!otp) {
        throw new Error('OTP is required to continue.');
      }

      const result = await confirmation.confirm(otp.trim());
      const idToken = await result.user.getIdToken(true);

      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Phone login failed');
        return;
      }

      persistSession(data);
    } catch (err: any) {
      setError(err?.message || 'Phone login failed');
    } finally {
      verifier?.clear();
      setPhoneLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="h-24 w-24">
                  <LogoImage />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-2">
                <span className="text-emerald-600">My</span><span className="text-orange-500">Sanjeevani</span>
              </h1>
              <p className="text-gray-600 text-sm">Welcome Back to India's Healthcare Platform!</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Login As
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                >
                  <option value="user">User</option>
                  <option value="vendor">Vendor</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  placeholder="your@email.com"
                />
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Remember & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-700">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Remember me
                </label>
                <Link
                  href="/forgot-password"
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* SignIn Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:bg-slate-400 text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg active:scale-95"
              >
                {loading ? 'Signing In...' : 'SignIn'}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <div className="px-3 text-gray-500 text-sm">OR</div>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Social Login */}
            <div className="space-y-3">
              <button
                onClick={handleGoogleLogin}
                type="button"
                disabled={googleLoading}
                className="w-full border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 transition disabled:opacity-60"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>🔵</span> {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
                </span>
              </button>
              <button
                type="button"
                onClick={handlePhoneLogin}
                disabled={phoneLoading}
                className="w-full border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 transition disabled:opacity-60"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>📱</span> {phoneLoading ? 'Verifying phone...' : 'Continue with Phone'}
                </span>
              </button>
            </div>

            <div id="firebase-phone-recaptcha" className="hidden" />

            {/* Sign Up Link */}
            <div className="mt-8 text-center border-t border-gray-200 pt-8">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link
                  href="/signup"
                  className="text-emerald-600 hover:text-emerald-700 font-bold"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="mt-8 text-center text-gray-500 text-xs">
            <p>By logging in, you agree to MySanjeevani's Terms & Conditions</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
