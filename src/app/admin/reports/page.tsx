'use client';

import { useState } from 'react';

interface Report {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

export default function AdminReports() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('month');

  const reports: Report[] = [
    {
      id: 'sales',
      name: 'Sales Report',
      description: 'Detailed sales analytics and trends',
      icon: '📊',
      category: 'Financial',
    },
    {
      id: 'revenue',
      name: 'Revenue Report',
      description: 'Revenue breakdown by category and time',
      icon: '💰',
      category: 'Financial',
    },
    {
      id: 'users',
      name: 'User Demographics',
      description: 'User growth and demographic analysis',
      icon: '👥',
      category: 'Users',
    },
    {
      id: 'products',
      name: 'Product Performance',
      description: 'Top performing and low-performing products',
      icon: '📦',
      category: 'Products',
    },
    {
      id: 'vendors',
      name: 'Vendor Performance',
      description: 'Vendor sales and ratings analysis',
      icon: '🏪',
      category: 'Vendors',
    },
    {
      id: 'consultations',
      name: 'Consultation Report',
      description: 'Doctor consultations and ratings',
      icon: '👨‍⚕️',
      category: 'Services',
    },
    {
      id: 'inventory',
      name: 'Inventory Report',
      description: 'Stock levels and inventory management',
      icon: '📋',
      category: 'Inventory',
    },
    {
      id: 'customers',
      name: 'Customer Analysis',
      description: 'Customer lifetime value and behavior',
      icon: '🔍',
      category: 'Customers',
    },
  ];

  const categories = Array.from(new Set(reports.map((r) => r.category)));

  const handleExport = (format: string) => {
    alert(`Exporting selected reports as ${format.toUpperCase()}...`);
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-2">Generate and download comprehensive business reports</p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Report Period</h3>
          <div className="flex gap-3 flex-wrap">
            {['week', 'month', 'quarter', 'year'].map((period) => (
              <button
                key={period}
                onClick={() => setDateRange(period)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  dateRange === period
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
            <button className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200">
              📅 Custom
            </button>
          </div>
        </div>
      </div>

      {/* Reports by Category */}
      <div className="space-y-8">
        {categories.map((category) => (
          <div key={category}>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{category} Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {reports
                .filter((r) => r.category === category)
                .map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`p-6 rounded-lg border-2 transition transform hover:scale-105 ${
                      selectedReport === report.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-indigo-300'
                    }`}
                  >
                    <div className="text-4xl mb-3">{report.icon}</div>
                    <h4 className="text-lg font-semibold text-gray-900 text-left">{report.name}</h4>
                    <p className="text-sm text-gray-600 mt-2 text-left">{report.description}</p>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Selected Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => handleExport('pdf')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            📄 PDF
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            📊 Excel
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            📋 CSV
          </button>
          <button
            onClick={() => handleExport('email')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            📧 Email
          </button>
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Reports</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Weekly Sales Report</p>
              <p className="text-sm text-gray-600">Every Monday at 9:00 AM</p>
            </div>
            <button className="text-red-600 hover:text-red-700 font-medium">Delete</button>
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Monthly Revenue Report</p>
              <p className="text-sm text-gray-600">First day of each month at 12:00 PM</p>
            </div>
            <button className="text-red-600 hover:text-red-700 font-medium">Delete</button>
          </div>
        </div>
        <button className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition">
          + Schedule New Report
        </button>
      </div>
    </div>
  );
}
