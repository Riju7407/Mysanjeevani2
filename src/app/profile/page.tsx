'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get user data from localStorage
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      // Redirect to login if not logged in
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userStr));
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg p-8 mb-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold">{user?.fullName}</h1>
                <p className="text-emerald-100 text-lg">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Profile Information
                  </h2>
                  <Link
                    href="/profile/edit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition font-medium"
                  >
                    Edit Profile
                  </Link>
                </div>

                <div className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Full Name
                    </label>
                    <p className="text-lg text-gray-900">{user?.fullName}</p>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Email Address
                    </label>
                    <p className="text-lg text-gray-900">{user?.email}</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Phone Number
                    </label>
                    <p className="text-lg text-gray-900">
                      {user?.phone || 'Not provided'}
                    </p>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Account Type
                    </label>
                    <div className="inline-block">
                      <span className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium capitalize">
                        {user?.role}
                      </span>
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Email Verification
                    </label>
                    <div className="flex items-center gap-2">
                      {user?.isVerified ? (
                        <span className="flex items-center gap-2 text-green-600">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-yellow-600">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* User ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      User ID
                    </label>
                    <p className="text-sm text-gray-600 font-mono break-all">
                      {user?.id}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="md:col-span-1">
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 mb-6">
                <h3 className="text-lg font-bold mb-4 text-gray-900">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Link
                    href="/profile/edit"
                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
                  >
                    Edit Profile
                  </Link>
                  <Link
                    href="/orders"
                    className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg transition"
                  >
                    My Orders
                  </Link>
                  <Link
                    href="/medicines"
                    className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg transition"
                  >
                    Browse Medicines
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-center bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition"
                  >
                    Logout
                  </button>
                </div>
              </div>

              {/* Account Stats */}
              <div className="bg-gradient-to-br from-emerald-50 to-orange-50 rounded-lg p-6 border border-emerald-200">
                <h3 className="text-lg font-bold mb-4 text-gray-900">
                  Account Stats
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-600 text-sm">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">₹0</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
