'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const StatIcon = {
  users: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  vendors: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5.581m0 0H9m5.581 0v1.414c0 1.349-1.895 2.561-4.243 2.561S7.095 23.763 7.095 22.414V21M9 7h2m2 0h2M9 11h6M9 15h6" />
    </svg>
  ),
  medicines: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  orders: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  revenue: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  consultations: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12M8 11h12M8 15h6M19 19H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2z" />
    </svg>
  ),
};

export default function AdminDashboard() {
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVendors: 0,
    totalMedicines: 0,
    totalConsultations: 0,
    totalRevenue: 0,
    totalOrders: 0,
    pendingConsultations: 0,
    activeVendors: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchStats();
    fetchPendingApprovals();
  }, []);

  const isPendingApproval = (product: any) => {
    if (product?.approvalStatus === 'pending') return true;
    return !product?.approvalStatus && !!product?.vendorId && product?.isActive === false;
  };

  const fetchPendingApprovals = async () => {
    try {
      setQueueLoading(true);
      const response = await fetch('/api/admin/products?limit=100');
      const data = await response.json();
      if (response.ok) {
        setPendingApprovals(
          (data.products || []).filter(
            (p: any) => (p.productType || 'Generic Medicine') !== 'Lab Tests' && isPendingApproval(p)
          )
        );
      } else {
        setPendingApprovals([]);
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      setPendingApprovals([]);
    } finally {
      setQueueLoading(false);
    }
  };

  const handleApprovalAction = async (productId: string, action: 'approve' | 'reject') => {
    try {
      const payload =
        action === 'approve'
          ? { approvalStatus: 'approved', isActive: true }
          : { approvalStatus: 'rejected', isActive: false, isPopular: false };

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to update approval status');
      }

      setPendingApprovals((prev) => prev.filter((p) => p._id !== productId));
    } catch (error) {
      console.error('Approval action failed:', error);
      alert('Failed to update approval status');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        const usersStr = localStorage.getItem('users') || '[]';
        const users = JSON.parse(usersStr);

        const vendorsStr = localStorage.getItem('vendors') || '[]';
        const vendors = JSON.parse(vendorsStr);

        const medicinesStr = localStorage.getItem('medicines') || '[]';
        const medicines = JSON.parse(medicinesStr);

        const consultationsStr = localStorage.getItem('consultations') || '[]';
        const consultations = JSON.parse(consultationsStr);

        const ordersStr = localStorage.getItem('orders') || '[]';
        const orders = JSON.parse(ordersStr);

        let totalRevenue = 0;
        orders.forEach((order: any) => {
          if (order.total) totalRevenue += order.total;
        });

        const pendingConsultations = consultations.filter((c: any) => c.status === 'pending').length;
        const activeVendors = vendors.filter((v: any) => v.status === 'verified').length;

        setStats({
          totalUsers: users.length,
          totalVendors: vendors.length,
          totalMedicines: medicines.length,
          totalConsultations: consultations.length,
          totalRevenue,
          totalOrders: orders.length,
          pendingConsultations,
          activeVendors,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      color: 'from-blue-500 to-blue-600',
      icon: StatIcon.users,
      href: '/admin/users',
      textColor: 'text-blue-600',
    },
    {
      label: 'Total Vendors',
      value: stats.totalVendors,
      color: 'from-emerald-500 to-emerald-600',
      icon: StatIcon.vendors,
      href: '/admin/vendors',
      textColor: 'text-emerald-600',
      subtitle: `${stats.activeVendors} verified`,
    },
    {
      label: 'Total Medicines',
      value: stats.totalMedicines,
      color: 'from-green-500 to-green-600',
      icon: StatIcon.medicines,
      href: '/admin/medicines',
      textColor: 'text-green-600',
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders,
      color: 'from-orange-500 to-orange-600',
      icon: StatIcon.orders,
      href: '/admin/orders',
      textColor: 'text-orange-600',
    },
  ];

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">Welcome to MySanjeevani Administration Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, idx) => (
          <Link
            key={idx}
            href={card.href}
            className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-slate-100 hover:border-slate-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg bg-linear-to-br ${card.color} text-white shadow-md group-hover:shadow-lg transition-all`}>
                {card.icon}
              </div>
              <span className="text-slate-400 text-sm">≡</span>
            </div>
            <h3 className="text-slate-600 text-sm font-medium mb-1">{card.label}</h3>
            <p className="text-4xl font-bold text-slate-900">{card.value}</p>
            {card.subtitle && <p className="text-xs text-slate-500 mt-1">{card.subtitle}</p>}
            <div className={`mt-4 text-xs font-semibold ${card.textColor} group-hover:translate-x-1 transition-transform`}>
              View Details →
            </div>
          </Link>
        ))}
      </div>

      {/* Revenue & Consultations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Total Revenue */}
        <Link
          href="/admin/analytics"
          className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-slate-100 hover:border-slate-200 p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-lg bg-linear-to-br from-purple-500 to-purple-600 text-white shadow-md">
              {StatIcon.revenue}
            </div>
            <span className="text-slate-400 text-sm">≡</span>
          </div>
          <h3 className="text-slate-600 text-sm font-medium mb-1">Total Revenue</h3>
          <p className="text-4xl font-bold text-slate-900">₹{stats.totalRevenue.toFixed(0)}</p>
          <p className="text-xs text-slate-500 mt-1">All time revenue from orders</p>
          <div className="mt-4 text-xs font-semibold text-purple-600 group-hover:translate-x-1 transition-transform">
            View Analytics →
          </div>
        </Link>

        {/* Consultations */}
        <Link
          href="/admin/consultations"
          className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-slate-100 hover:border-slate-200 p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-lg bg-linear-to-br from-pink-500 to-pink-600 text-white shadow-md">
              {StatIcon.consultations}
            </div>
            <span className="text-slate-400 text-sm">≡</span>
          </div>
          <h3 className="text-slate-600 text-sm font-medium mb-1">Consultations</h3>
          <p className="text-4xl font-bold text-slate-900">{stats.totalConsultations}</p>
          <p className="text-xs text-slate-500 mt-1">{stats.pendingConsultations} pending</p>
          <div className="mt-4 text-xs font-semibold text-pink-600 group-hover:translate-x-1 transition-transform">
            View Consultations →
          </div>
        </Link>
      </div>

      {/* Pending Approval Queue */}
      <div className="bg-white rounded-xl shadow-md border border-slate-100 p-8 mb-8">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Pending Approval Queue</h2>
            <p className="text-slate-600 text-sm mt-1">Vendor products waiting for admin review</p>
          </div>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
            {pendingApprovals.length} pending
          </div>
        </div>

        {queueLoading ? (
          <div className="text-slate-500 text-sm">Loading pending approvals...</div>
        ) : pendingApprovals.length === 0 ? (
          <div className="text-slate-500 text-sm">No pending product approvals.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase">Product</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase">Vendor</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase">Category</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase">Price</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingApprovals.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.vendorName || 'MySanjeevani'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.category}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-emerald-700">₹{item.price}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprovalAction(item._id, 'approve')}
                          className="text-emerald-600 hover:text-emerald-800 text-sm font-medium hover:underline"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApprovalAction(item._id, 'reject')}
                          className="text-amber-600 hover:text-amber-800 text-sm font-medium hover:underline"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md border border-slate-100 p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/users"
            className="bg-linear-to-br from-blue-500 to-blue-600 hover:shadow-lg hover:from-blue-600 hover:to-blue-700 text-white px-6 py-4 rounded-lg font-semibold text-center transition transform hover:scale-105 shadow-md"
          >
            👥 Manage Users
          </Link>
          <Link
            href="/admin/vendors"
            className="bg-linear-to-br from-emerald-500 to-emerald-600 hover:shadow-lg hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-4 rounded-lg font-semibold text-center transition transform hover:scale-105 shadow-md"
          >
            🏪 Manage Vendors
          </Link>
          <Link
            href="/admin/medicines"
            className="bg-linear-to-br from-green-500 to-green-600 hover:shadow-lg hover:from-green-600 hover:to-green-700 text-white px-6 py-4 rounded-lg font-semibold text-center transition transform hover:scale-105 shadow-md"
          >
            💊 Manage Medicines
          </Link>
          <Link
            href="/admin/analytics"
            className="bg-linear-to-br from-purple-500 to-purple-600 hover:shadow-lg hover:from-purple-600 hover:to-purple-700 text-white px-6 py-4 rounded-lg font-semibold text-center transition transform hover:scale-105 shadow-md"
          >
            📊 Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}
