'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

interface Address {
  _id: string;
  type: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Get user data from localStorage
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    const userData = JSON.parse(userStr);
    setUser(userData);
    fetchAddresses(userData.id);
  }, [router]);

  const fetchAddresses = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/addresses?userId=${userId}`);
      const data = await response.json();
      if (response.ok) {
        setAddresses(data.addresses || []);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    setDeleting(addressId);
    try {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAddresses(addresses.filter((addr) => addr._id !== addressId));
      } else {
        alert('Failed to delete address');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Failed to delete address');
    } finally {
      setDeleting(null);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });

      if (response.ok) {
        const updatedAddresses = addresses.map((addr) => ({
          ...addr,
          isDefault: addr._id === addressId,
        }));
        setAddresses(updatedAddresses);
      }
    } catch (error) {
      console.error('Error setting default address:', error);
    }
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">My Addresses</h1>
              <p className="text-gray-600 mt-2">Manage your delivery addresses</p>
            </div>
            <Link
              href="/addresses/add"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition font-semibold"
            >
              + Add New Address
            </Link>
          </div>

          {/* Addresses Grid */}
          {addresses.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600 mb-4">You haven't added any addresses yet.</p>
              <Link
                href="/addresses/add"
                className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition"
              >
                Add Your First Address
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addresses.map((address) => (
                <div
                  key={address._id}
                  className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 relative"
                >
                  {/* Default Badge */}
                  {address.isDefault && (
                    <div className="absolute top-4 right-4">
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
                        Default
                      </span>
                    </div>
                  )}

                  {/* Type Badge */}
                  <div className="mb-4">
                    <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium capitalize">
                      {address.type}
                    </span>
                  </div>

                  {/* Address Details */}
                  <div className="space-y-3 mb-6">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold text-gray-900">{address.fullName}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold text-gray-900">{address.phone}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="text-gray-900">
                        {address.addressLine1}
                        {address.addressLine2 && `, ${address.addressLine2}`}
                      </p>
                      <p className="text-gray-900">
                        {address.city}, {address.state} {address.pincode}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link
                      href={`/addresses/edit/${address._id}`}
                      className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition font-medium"
                    >
                      Edit
                    </Link>

                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address._id)}
                        className="flex-1 text-center bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg transition font-medium"
                      >
                        Set as Default
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(address._id)}
                      disabled={deleting === address._id}
                      className="flex-1 text-center bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 rounded-lg transition font-medium"
                    >
                      {deleting === address._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
