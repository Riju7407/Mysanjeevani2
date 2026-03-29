'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Inquiry {
  _id: string;
  userName: string;
  userEmail: string;
  userRole: string;
  subject: string;
  category: string;
  message: string;
  status: 'new' | 'in-progress' | 'resolved' | 'closed';
  adminNote?: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 border-blue-200',
  'in-progress': 'bg-amber-100 text-amber-700 border-amber-200',
  resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  closed: 'bg-slate-200 text-slate-700 border-slate-300',
};

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const fetchInquiries = async (nextSearch = search, nextStatus = status) => {
    try {
      setLoading(true);
      setError('');

      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;

      const params = new URLSearchParams();
      if (nextSearch.trim()) params.set('search', nextSearch.trim());
      if (nextStatus !== 'all') params.set('status', nextStatus);

      const response = await fetch(`/api/admin/inquiries?${params.toString()}`, {
        headers: {
          'x-user-role': user?.role || '',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch inquiries');
      }

      setInquiries(data.inquiries || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleUpdate = async (inquiryId: string, nextStatus: string, adminNote: string) => {
    try {
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;

      const response = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || '',
        },
        body: JSON.stringify({
          status: nextStatus,
          adminNote,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update inquiry');
      }

      setInquiries((prev) => prev.map((item) => (item._id === inquiryId ? data.inquiry : item)));
    } catch (err: any) {
      alert(err.message || 'Failed to update inquiry');
    }
  };

  if (loading) {
    return <div className="p-8">Loading inquiries...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mb-6">
        <Link href="/admin" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 mt-2">User Inquiries</h1>
        <p className="text-slate-600 mt-1">Review and resolve contact inquiries submitted by logged-in users.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, subject, or message"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <button
          onClick={() => fetchInquiries(search, status)}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold"
        >
          Apply
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
          {error}
        </div>
      )}

      {inquiries.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          No inquiries found.
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <article key={inquiry._id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h2 className="text-lg font-bold text-slate-900">{inquiry.subject}</h2>
                    <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_STYLES[inquiry.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {inquiry.status}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full border bg-purple-50 text-purple-700 border-purple-200">
                      {inquiry.category}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600">
                    {inquiry.userName} ({inquiry.userRole}) • {inquiry.userEmail}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(inquiry.createdAt).toLocaleString('en-IN')}
                  </p>

                  <p className="mt-3 text-sm text-slate-800 leading-6 whitespace-pre-wrap">{inquiry.message}</p>

                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Admin Note</label>
                    <textarea
                      defaultValue={inquiry.adminNote || ''}
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onBlur={(e) => {
                        if ((inquiry.adminNote || '') !== e.target.value) {
                          handleUpdate(inquiry._id, inquiry.status, e.target.value);
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="lg:w-44">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Update Status</label>
                  <select
                    value={inquiry.status}
                    onChange={(e) => handleUpdate(inquiry._id, e.target.value, inquiry.adminNote || '')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="new">New</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
