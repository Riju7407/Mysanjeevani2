'use client';

import { useState, FormEvent, useEffect } from 'react';
import { usePhoneAuth, SignupResponse } from '@/lib/hooks/usePhoneAuth';

interface PhoneSignupProps {
  role?: 'user' | 'vendor' | 'doctor';
  onSuccess?: (data: SignupResponse) => void;
  onSwitchToLogin?: () => void;
}

export function PhoneSignup({
  role = 'user',
  onSuccess,
  onSwitchToLogin,
}: PhoneSignupProps) {
  const auth = usePhoneAuth(role);
  const [otp, setOtp] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Handle form submission for phone entry
  const handlePhoneSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await auth.sendOtp();
  };

  // Handle OTP submission
  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }

    try {
      const result = await auth.verifyOtp(otp);
      onSuccess?.(result);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  // Format phone number display
  const displayPhone = auth.phone
    .replace(/\D/g, '')
    .slice(-10)
    .replace(/(\d{5})(\d{5})/, '$1 $2');

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {role === 'vendor' ? 'Vendor Registration' : role === 'doctor' ? 'Doctor Registration' : 'Create Account'}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {role === 'vendor'
            ? 'Join MySanjeevni as a vendor'
            : role === 'doctor'
              ? 'Join MySanjeevni as a doctor'
              : 'Sign up for MySanjeevni'}
        </p>
      </div>

      {auth.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {auth.error}
        </div>
      )}

      {auth.debugOtp && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm font-mono">
          Debug OTP: {auth.debugOtp}
        </div>
      )}

      {auth.otpStep === 'info' ? (
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          {/* Phone Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={auth.phone}
              onChange={(e) => auth.setPhone(e.target.value)}
              placeholder="Enter 10-digit phone number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={auth.isLoading}
              maxLength={15}
            />
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={auth.fullName}
              onChange={(e) => auth.setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={auth.isLoading}
            />
          </div>

          {/* Email Input (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (Optional)
            </label>
            <input
              type="email"
              value={auth.email}
              onChange={(e) => auth.setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={auth.isLoading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={auth.isLoading || !auth.phone || !auth.fullName}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {auth.isLoading ? 'Sending OTP...' : 'Send OTP'}
          </button>

          {/* Switch to Login */}
          {onSwitchToLogin && (
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Already have an account? Login
            </button>
          )}
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          {/* Display Phone */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">OTP sent to</p>
            <p className="text-lg font-semibold text-gray-900">+91 {displayPhone}</p>
          </div>

          {/* OTP Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter 6-digit OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-3 text-center text-lg font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={6}
              disabled={auth.isLoading}
            />
            {auth.otpExpiry > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                OTP expires in {Math.floor(auth.otpExpiry / 60)}:{String(auth.otpExpiry % 60).padStart(2, '0')}
              </p>
            )}
          </div>

          {/* Terms Checkbox */}
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm text-gray-600">
              I agree to the{' '}
              <a href="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={auth.isLoading || otp.length !== 6 || !agreedToTerms}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {auth.isLoading ? 'Verifying...' : 'Verify & Create Account'}
          </button>

          {/* Resend OTP */}
          <button
            type="button"
            onClick={auth.resendOtp}
            disabled={auth.cooldownSeconds > 0 || auth.isLoading}
            className="w-full py-2 px-4 text-blue-600 border border-blue-600 rounded-lg font-medium hover:bg-blue-50 disabled:text-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed transition"
          >
            {auth.cooldownSeconds > 0
              ? `Resend OTP (${auth.cooldownSeconds}s)`
              : 'Resend OTP'}
          </button>

          {/* Back Button */}
          <button
            type="button"
            onClick={() => auth.reset()}
            className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Back to Phone Entry
          </button>
        </form>
      )}
    </div>
  );
}
