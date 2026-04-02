'use client';

import { useState, FormEvent } from 'react';
import { usePhoneLogin } from '@/lib/hooks/usePhoneAuth';

interface PhoneLoginProps {
  role?: 'user' | 'vendor' | 'doctor';
  onSuccess?: (data: any) => void;
  onSwitchToSignup?: () => void;
}

export function PhoneLogin({
  role = 'user',
  onSuccess,
  onSwitchToSignup,
}: PhoneLoginProps) {
  const login = usePhoneLogin(role);
  const [otp, setOtp] = useState('');

  const handlePhoneSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login.sendLoginOtp();
  };

  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const result = await login.verifyLoginOtp(otp);
      onSuccess?.(result);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const displayPhone = login.phone
    .replace(/\D/g, '')
    .slice(-10)
    .replace(/(\d{5})(\d{5})/, '$1 $2');

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {role === 'vendor' ? 'Vendor Login' : role === 'doctor' ? 'Doctor Login' : 'Login'}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {role === 'vendor'
            ? 'Login to your vendor account'
            : role === 'doctor'
              ? 'Login to your doctor account'
              : 'Login to MySanjeevani'}
        </p>
      </div>

      {/* Error Message */}
      {login.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {login.error}
        </div>
      )}

      {/* Debug OTP in Test Mode */}
      {login.debugOtp && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm font-mono">
          Debug OTP: {login.debugOtp}
        </div>
      )}

      {login.otpStep === 'phone' ? (
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          {/* Phone Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={login.phone}
              onChange={(e) => login.setPhone(e.target.value)}
              placeholder="Enter 10-digit phone number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={login.isLoading}
              maxLength={15}
            />
            <p className="text-xs text-gray-500 mt-1">
              We'll send a one-time password to your number
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={login.isLoading || !login.phone}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {login.isLoading ? 'Sending OTP...' : 'Send OTP'}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Switch to Signup */}
          {onSwitchToSignup && (
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Don't have an account? Sign up
            </button>
          )}
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          {/* Display Phone */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">OTP sent to</p>
            <p className="text-lg font-semibold text-gray-900">+91 {displayPhone}</p>
            <button
              type="button"
              onClick={() => login.reset()}
              className="text-xs text-blue-600 hover:underline mt-1"
            >
              Use different number
            </button>
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
              disabled={login.isLoading}
              autoFocus
            />
            {login.otpExpiry > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                OTP expires in {Math.floor(login.otpExpiry / 60)}:{String(login.otpExpiry % 60).padStart(2, '0')}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={login.isLoading || otp.length !== 6}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {login.isLoading ? 'Verifying...' : 'Login'}
          </button>

          {/* Resend OTP */}
          <button
            type="button"
            onClick={login.resendLoginOtp}
            disabled={login.cooldownSeconds > 0 || login.isLoading}
            className="w-full py-2 px-4 text-blue-600 border border-blue-600 rounded-lg font-medium hover:bg-blue-50 disabled:text-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed transition"
          >
            {login.cooldownSeconds > 0
              ? `Resend OTP (${login.cooldownSeconds}s)`
              : 'Resend OTP'}
          </button>
        </form>
      )}
    </div>
  );
}
