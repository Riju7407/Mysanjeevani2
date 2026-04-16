'use client';

import { useEffect, useMemo, useState } from 'react';

type Booking = {
  _id: string;
  testName: string;
  testId: string;
  testPrice?: number;
  collectionType?: 'home' | 'center';
  collectionDate?: string;
  collectionTime?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  provider?: 'local' | 'thyrocare' | 'healthians';
  providerStatus?: string;
  providerOrderId?: string;
  paymentStatus?: string;
  createdAt?: string;
  userId?: {
    _id?: string;
    fullName?: string;
    email?: string;
    phone?: string;
  };
};

const STATUS_OPTIONS = ['all', 'scheduled', 'completed', 'cancelled'] as const;

export default function AdminLabBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const q = new URLSearchParams();
      q.set('scope', 'all');
      if (status !== 'all') q.set('status', status);
      if (search.trim()) q.set('search', search.trim());

      const res = await fetch(`/api/lab-test-bookings/history?${q.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch bookings');
      }
      setBookings(data.bookings || []);
    } catch (error) {
      console.error(error);
      alert('Failed to load lab booking history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [status]);

  const summary = useMemo(() => {
    const scheduled = bookings.filter((b) => b.status === 'scheduled').length;
    const completed = bookings.filter((b) => b.status === 'completed').length;
    const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
    return { scheduled, completed, cancelled, total: bookings.length };
  }, [bookings]);

  const updateStatus = async (bookingId: string, nextStatus: 'scheduled' | 'completed' | 'cancelled') => {
    try {
      setUpdatingId(bookingId);
      const res = await fetch('/api/lab-test-bookings/history?scope=all', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }
      setBookings((prev) => prev.map((b) => (b._id === bookingId ? { ...b, status: nextStatus } : b)));
    } catch (error) {
      console.error(error);
      alert('Could not update booking status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Lab Booking History</h1>
          <p className="text-slate-600 text-sm mt-1">Unified booking history across all users</p>
        </div>
        <button
          onClick={fetchBookings}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-500">Total</p><p className="text-2xl font-bold">{summary.total}</p></div>
        <div className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-500">Scheduled</p><p className="text-2xl font-bold text-blue-700">{summary.scheduled}</p></div>
        <div className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-500">Completed</p><p className="text-2xl font-bold text-emerald-700">{summary.completed}</p></div>
        <div className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-500">Cancelled</p><p className="text-2xl font-bold text-red-700">{summary.cancelled}</p></div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-col md:flex-row gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by test, user, email, provider"
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as (typeof STATUS_OPTIONS)[number])}
          className="border border-slate-300 rounded-lg px-3 py-2"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.toUpperCase()}</option>
          ))}
        </select>
        <button
          onClick={fetchBookings}
          className="px-4 py-2 rounded-lg border border-slate-300 font-semibold hover:bg-slate-50"
        >
          Apply
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">No lab booking history found.</div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b._id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">{b.testName}</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {b.userId?.fullName || 'Unknown User'} • {b.userId?.email || 'No email'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Date: {b.collectionDate ? new Date(b.collectionDate).toLocaleDateString('en-IN') : '-'} | Time: {b.collectionTime || 'To be assigned'} | Type: {b.collectionType || '-'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Provider: {b.provider || 'local'} {b.providerOrderId ? `• Order ID: ${b.providerOrderId}` : ''}
                  </p>
                  {b.providerStatus && <p className="text-xs text-emerald-700 mt-1">Provider Status: {b.providerStatus}</p>}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={b.status}
                    onChange={(e) => updateStatus(b._id, e.target.value as 'scheduled' | 'completed' | 'cancelled')}
                    disabled={updatingId === b._id}
                    className="border border-slate-300 rounded-md px-2 py-1 text-sm"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
