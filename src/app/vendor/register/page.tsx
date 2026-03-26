'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

export default function VendorRegister() {
  const [formData, setFormData] = useState({
    vendorName: '',
    email: '',
    password: '',
    phone: '',
    businessType: 'pharmacy',
    street: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/vendor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorName: formData.vendorName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          businessType: formData.businessType,
          businessAddress: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setMessage('✅ Registration successful! Awaiting admin approval. You can login once approved.');
      setFormData({
        vendorName: '',
        email: '',
        password: '',
        phone: '',
        businessType: 'pharmacy',
        street: '',
        city: '',
        state: '',
        pincode: '',
      });

      setTimeout(() => {
        window.location.href = '/vendor/login';
      }, 2000);
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'Registration failed';
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-emerald-600 mb-2">Become a Vendor</h1>
          <p className="text-gray-600 mb-6">Join MySanjeevani marketplace and expand your reach</p>

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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business/Shop Name *
                </label>
                <input
                  type="text"
                  name="vendorName"
                  value={formData.vendorName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Your business name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="business@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="10-digit phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Type *
                </label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="pharmacy">Pharmacy</option>
                  <option value="clinic">Clinic</option>
                  <option value="hospital">Hospital</option>
                  <option value="lab">Lab</option>
                  <option value="supplier">Supplier</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Business Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  placeholder="Street address"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />

                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />

                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />

                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="Pincode"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password (min 6 characters) *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register as Vendor'}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Already a vendor?{' '}
            <Link href="/vendor/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              Login here
            </Link>
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-emerald-50 p-6 rounded-lg">
            <h3 className="font-semibold text-emerald-700 mb-2">📱 Easy Setup</h3>
            <p className="text-sm text-gray-600">Register your business and get started in minutes</p>
          </div>
          <div className="bg-emerald-50 p-6 rounded-lg">
            <h3 className="font-semibold text-emerald-700 mb-2">📦 List Products</h3>
            <p className="text-sm text-gray-600">Upload and manage your product inventory easily</p>
          </div>
          <div className="bg-emerald-50 p-6 rounded-lg">
            <h3 className="font-semibold text-emerald-700 mb-2">💰 Grow Revenue</h3>
            <p className="text-sm text-gray-600">Reach thousands of customers and boost sales</p>
          </div>
        </div>
      </div>
    </div>
  );
}
