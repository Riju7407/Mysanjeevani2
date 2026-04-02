'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogoImage } from '@/components/Logo';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { signInWithPopup } from 'firebase/auth';
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
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpStep, setOtpStep] = useState<'phone' | 'otp'>('phone');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpStatus, setOtpStatus] = useState('');
  const [otpError, setOtpError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('redirect');
    setRedirectTo(value || '');
  }, []);

  useEffect(() => {
    if (otpCooldown <= 0) return;

    const timer = window.setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [otpCooldown]);

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
      // Store admin token and authentication data
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('tokenExpiresAt', data.expiresAt.toString());
      localStorage.setItem('adminEmail', data.user.email);
      console.log('✅ Admin session stored:', { 
        token: !!data.token, 
        expiresAt: data.expiresAt, 
        email: data.user.email 
      });
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

  const handleOpenOtpModal = () => {
    setError('');
    setOtpError('');
    setOtpStatus('');

    if (role === 'admin') {
      setError('Admin login is available only with email and password.');
      return;
    }

    setShowOtpModal(true);
    setOtpStep('phone');
    setOtpCode('');
  };

  const handleCloseOtpModal = () => {
    setShowOtpModal(false);
    setOtpError('');
    setOtpStatus('');
    setOtpStep('phone');
    setOtpCode('');
    setPhoneLoading(false);
  };

  const handleSendOtp = async () => {
    setOtpError('');
    setOtpStatus('');
    setPhoneLoading(true);

    try {
      const trimmedPhone = mobileNumber.trim();
      if (!trimmedPhone) {
        setOtpError('Phone number is required.');
        return;
      }

      const sendOtpResponse = await fetch('/api/auth/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: trimmedPhone, role }),
      });
      const sendOtpData = await sendOtpResponse.json();

      if (!sendOtpResponse.ok) {
        setOtpError(sendOtpData.error || 'Failed to send OTP');
        if (Number(sendOtpData.retryAfterSeconds) > 0) {
          setOtpCooldown(Number(sendOtpData.retryAfterSeconds));
        }
        return;
      }

      setOtpStep('otp');
      setOtpCode('');
      setOtpStatus(`OTP sent to ${trimmedPhone}`);
      setOtpCooldown(Number(sendOtpData.cooldownSeconds || 60));
    } catch (err: any) {
      setOtpError(err?.message || 'Failed to send OTP');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError('');
    setOtpStatus('');
    setPhoneLoading(true);

    try {
      const trimmedPhone = mobileNumber.trim();
      const trimmedOtp = otpCode.trim();

      if (!trimmedPhone) {
        setOtpError('Phone number is required.');
        setOtpStep('phone');
        return;
      }

      if (!trimmedOtp || trimmedOtp.length !== 6) {
        setOtpError('Please enter a valid 6-digit OTP.');
        return;
      }

      const response = await fetch('/api/auth/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: trimmedPhone, otp: trimmedOtp, role }),
      });

      const data = await response.json();
      if (!response.ok) {
        setOtpError(data.error || 'Phone login failed');
        return;
      }

      handleCloseOtpModal();
      persistSession(data);
    } catch (err: any) {
      setOtpError(err?.message || 'Phone login failed');
    } finally {
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
                onClick={handleOpenOtpModal}
                disabled={phoneLoading || role === 'admin'}
                className="w-full border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 transition disabled:opacity-60"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>📱</span>
                  {phoneLoading ? 'Verifying OTP...' : 'Login with Mobile OTP'}
                </span>
              </button>
            </div>

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

      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={handleCloseOtpModal} />
          <div className="relative w-full max-w-md rounded-2xl border border-emerald-100 bg-white shadow-2xl overflow-hidden">
            <div className="bg-linear-to-r from-emerald-600 to-teal-500 px-6 py-4 text-white">
              <h2 className="text-lg font-bold">Login with Mobile OTP</h2>
              <p className="text-sm text-emerald-50">Secure and quick sign-in for your account</p>
            </div>

            <div className="p-6 space-y-4">
              {otpStep === 'phone' && (
                <>
                  <label htmlFor="mobile-number" className="block text-sm font-medium text-gray-700">
                    Registered Mobile Number
                  </label>
                  <input
                    id="mobile-number"
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  />
                </>
              )}

              {otpStep === 'otp' && (
                <>
                  <div className="text-sm text-gray-700">
                    OTP sent to <span className="font-semibold">{mobileNumber}</span>
                  </div>
                  <label htmlFor="otp-code" className="block text-sm font-medium text-gray-700">
                    Enter 6-digit OTP
                  </label>
                  <input
                    id="otp-code"
                    type="text"
                    value={otpCode}
                    inputMode="numeric"
                    maxLength={6}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full px-4 py-3 tracking-widest text-center text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  />
                </>
              )}

              {otpStatus && (
                <div className="text-sm rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
                  {otpStatus}
                </div>
              )}

              {otpError && (
                <div className="text-sm rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                  {otpError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleCloseOtpModal}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>

                {otpStep === 'phone' ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={phoneLoading}
                    className="px-4 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-60"
                  >
                    {phoneLoading ? 'Sending...' : 'Send OTP'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={phoneLoading}
                    className="px-4 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-60"
                  >
                    {phoneLoading ? 'Verifying...' : 'Verify & Login'}
                  </button>
                )}
              </div>

              {otpStep === 'otp' && (
                <div className="text-center text-sm text-gray-600">
                  {otpCooldown > 0 ? (
                    <span>Resend OTP in {otpCooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={phoneLoading}
                      className="text-emerald-700 font-medium hover:text-emerald-800"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
