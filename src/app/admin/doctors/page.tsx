'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DoctorRequest {
  _id: string;
  name: string;
  email: string;
  phone: string;
  registrationNumber: string;
  identityDocumentUrl: string;
  identityDocumentType: string;
  aadharCardUrl?: string;
  panCardUrl?: string;
  registrationCertificateUrl?: string;
  approvalStatus: string;
  createdAt: string;
  studyPlace?: string;
}

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState<DoctorRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, approved, rejected
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorRequest | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const renderDocumentLink = (url?: string, label?: string) => {
    if (!url) return <span className="text-sm text-gray-500">Not uploaded</span>;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
      >
        <span className="text-lg">📄</span>
        <span>{label || 'View Document'}</span>
      </a>
    );
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async (search = '', status = 'all') => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status !== 'all') params.append('status', status);
      
      const res = await fetch(`/api/admin/doctors?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch doctors');
      setDoctors(data.doctors || []);
    } catch (err: any) {
      console.error('Error fetching doctors:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    fetchDoctors(value, filterStatus);
  };

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
    fetchDoctors(searchTerm, status);
  };

  const openApprovalModal = (doctor: DoctorRequest) => {
    setSelectedDoctor(doctor);
    setApprovalNote('');
    setShowApprovalModal(true);
  };

  const approveDoctor = async () => {
    if (!selectedDoctor) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/doctors/${selectedDoctor._id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalNote }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve doctor');

      // Update local state
      setDoctors(
        doctors.map((d) =>
          d._id === selectedDoctor._id
            ? { ...d, approvalStatus: 'approved' }
            : d
        )
      );

      setShowApprovalModal(false);
      setSelectedDoctor(null);
      alert('Doctor approved successfully!');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const rejectDoctor = async () => {
    if (!selectedDoctor) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/doctors/${selectedDoctor._id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalNote }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject doctor');

      // Update local state
      setDoctors(
        doctors.map((d) =>
          d._id === selectedDoctor._id
            ? { ...d, approvalStatus: 'rejected' }
            : d
        )
      );

      setShowApprovalModal(false);
      setSelectedDoctor(null);
      alert('Doctor rejected');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || doctor.approvalStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          Loading doctors...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/admin" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Doctor Verification</h1>
          <p className="text-gray-600 mt-2">
            Review and approve/reject doctor registrations
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Filters and Search */}
        <div className="mb-6 space-y-4">
          <input
            type="text"
            placeholder="Search by name, email, or registration number..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              All ({doctors.length})
            </button>
            <button
              onClick={() => handleFilterChange('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Pending ({doctors.filter((d) => d.approvalStatus === 'pending').length})
            </button>
            <button
              onClick={() => handleFilterChange('approved')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Approved ({doctors.filter((d) => d.approvalStatus === 'approved').length})
            </button>
            <button
              onClick={() => handleFilterChange('rejected')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Rejected ({doctors.filter((d) => d.approvalStatus === 'rejected').length})
            </button>
          </div>
        </div>

        {/* Doctor Cards/List */}
        <div className="space-y-4">
          {filteredDoctors.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">
                {error ? `Error: ${error}` : 'No doctors found'}
              </p>
            </div>
          ) : (
            filteredDoctors.map((doctor) => (
              <div
                key={doctor._id}
                className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{doctor.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      <span className="font-medium">Email:</span> {doctor.email}
                    </p>
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">Phone:</span> {doctor.phone}
                    </p>
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">Registration Number:</span> {doctor.registrationNumber}
                    </p>
                    {doctor.studyPlace && (
                      <p className="text-gray-600 text-sm">
                        <span className="font-medium">Study Place:</span> {doctor.studyPlace}
                      </p>
                    )}
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">Document Type:</span>{' '}
                      {(doctor.identityDocumentType || 'other').replace('-', ' ').toUpperCase()}
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                      Registered: {new Date(doctor.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                        doctor.approvalStatus
                      )}`}
                    >
                      {(doctor.approvalStatus || 'pending').charAt(0).toUpperCase() +
                        (doctor.approvalStatus || 'pending').slice(1)}
                    </span>

                    {(doctor.approvalStatus || 'pending') === 'pending' && (
                      <button
                        onClick={() => openApprovalModal(doctor)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                      >
                        Review & Approve
                      </button>
                    )}
                  </div>
                </div>

                {/* Document Preview */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Verification Documents:</p>
                  <div className="space-y-2 text-sm">
                    <p>Aadhar Card: {renderDocumentLink(doctor.aadharCardUrl, 'View Aadhar Card')}</p>
                    <p>PAN Card: {renderDocumentLink(doctor.panCardUrl, 'View PAN Card')}</p>
                    <p>
                      Registration Certificate:{' '}
                      {renderDocumentLink(
                        doctor.registrationCertificateUrl || doctor.identityDocumentUrl,
                        'View Registration Certificate'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Review Doctor Registration
              </h3>
              <p className="text-gray-600 mb-4">{selectedDoctor.name}</p>

              <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-2 text-sm">
                <p>
                  <span className="font-medium">Email:</span> {selectedDoctor.email}
                </p>
                <p>
                  <span className="font-medium">Registration:</span>{' '}
                  {selectedDoctor.registrationNumber}
                </p>
                <p>
                  <span className="font-medium">Document:</span>{' '}
                  {(selectedDoctor.identityDocumentType || 'other').replace('-', ' ')}
                </p>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Approval Note (Optional)
              </label>
              <textarea
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="Add any notes about this approval/rejection..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm h-20"
              />

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={rejectDoctor}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Reject'}
                </button>
                <button
                  onClick={approveDoctor}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
