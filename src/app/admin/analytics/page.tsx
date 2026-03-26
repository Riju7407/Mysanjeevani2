'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalMedicines: 0,
    averageOrderValue: 0,
    topMedicines: [] as any[],
    revenueByCategory: {} as { [key: string]: number },
    monthlyRevenue: [] as any[],
    orderStatus: { pending: 0, delivered: 0, cancelled: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = () => {
    try {
      // Get orders data
      const ordersStr = localStorage.getItem('orders') || '[]';
      const orders = JSON.parse(ordersStr);

      // Get medicines data
      const medicinesStr = localStorage.getItem('medicines') || '[]';
      const medicines = JSON.parse(medicinesStr);

      // Get users data
      const usersStr = localStorage.getItem('users') || '[]';
      const users = JSON.parse(usersStr);

      // Calculate totals
      let totalRevenue = 0;
      const categoryRevenue: { [key: string]: number } = {};
      const statusCount = { pending: 0, delivered: 0, cancelled: 0 };

      orders.forEach((order: any) => {
        if (order.total) {
          totalRevenue += order.total;
        }
        const status = order.status || 'pending';
        if (status in statusCount) {
          statusCount[status as keyof typeof statusCount]++;
        }
        
        if (order.items) {
          order.items.forEach((item: any) => {
            const category = item.category || 'Other';
            categoryRevenue[category] = (categoryRevenue[category] || 0) + (item.price * item.quantity);
          });
        }
      });

      const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

      setAnalytics({
        totalRevenue,
        totalOrders: orders.length,
        totalUsers: users.length,
        totalMedicines: medicines.length,
        averageOrderValue,
        topMedicines: medicines.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0)).slice(0, 5),
        revenueByCategory: categoryRevenue,
        monthlyRevenue: [],
        orderStatus: statusCount
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/admin" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Business Analytics</h1>
          <p className="text-gray-600 mt-2">Real-time performance insights</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">₹{analytics.totalRevenue.toFixed(2)}</p>
            <p className="text-green-600 text-xs mt-2">+12% from last month</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm font-medium">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalOrders}</p>
            <p className="text-blue-600 text-xs mt-2">Average: ₹{analytics.averageOrderValue.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm font-medium">Active Users</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalUsers}</p>
            <p className="text-purple-600 text-xs mt-2">+5% growth</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm font-medium">Medicine Catalog</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalMedicines}</p>
            <p className="text-orange-600 text-xs mt-2">Updated daily</p>
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Status Distribution</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Delivered</span>
                  <span className="text-sm font-bold text-gray-900">{analytics.orderStatus.delivered}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${
                        analytics.totalOrders > 0
                          ? (analytics.orderStatus.delivered / analytics.totalOrders) * 100
                          : 0
                      }%`
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Pending</span>
                  <span className="text-sm font-bold text-gray-900">{analytics.orderStatus.pending}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-600 h-2 rounded-full"
                    style={{
                      width: `${
                        analytics.totalOrders > 0
                          ? (analytics.orderStatus.pending / analytics.totalOrders) * 100
                          : 0
                      }%`
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Cancelled</span>
                  <span className="text-sm font-bold text-gray-900">{analytics.orderStatus.cancelled}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{
                      width: `${
                        analytics.totalOrders > 0
                          ? (analytics.orderStatus.cancelled / analytics.totalOrders) * 100
                          : 0
                      }%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue by Category */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue by Category</h2>
            <div className="space-y-3">
              {Object.entries(analytics.revenueByCategory)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 5)
                .map(([category, revenue]) => (
                  <div key={category}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{category}</span>
                      <span className="text-sm font-bold text-gray-900">₹{(revenue as number).toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${
                            Object.values(analytics.revenueByCategory).reduce((a, b) => (a as number) + (b as number), 0) > 0
                              ? ((revenue as number) /
                                  Object.values(analytics.revenueByCategory).reduce((a, b) => (a as number) + (b as number), 0)) *
                                100
                              : 0
                          }%`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Top Medicines */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Rated Medicines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {analytics.topMedicines.map((medicine) => (
              <div key={medicine.id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{medicine.name}</h3>
                <p className="text-gray-600 text-xs mt-1">{medicine.category}</p>
                <p className="text-gray-900 font-bold mt-2">₹{medicine.price}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-yellow-500">⭐ {medicine.rating || 4.5}</span>
                  <span className="text-xs text-gray-600">Stock: {medicine.stock || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
