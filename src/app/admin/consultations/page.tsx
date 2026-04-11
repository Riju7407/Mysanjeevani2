'use client';

import { useState, useEffect, useCallback } from 'react';

const DEPARTMENTS = [
  'General Medicine', 'Cardiology', 'Dermatology', 'Pediatrics',
  'Orthopedics', 'Neurology', 'Gynecology', 'ENT', 'Ophthalmology',
  'Psychiatry', 'Oncology', 'Urology', 'Gastroenterology', 'Endocrinology', 'Pulmonology',
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  'in-progress': 'bg-purple-100 text-purple-700 border-purple-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

interface TimeSlot { _id?: string; day: string; startTime: string; endTime: string; maxPatients: number; isActive: boolean; }
interface Doctor {
  _id: string; name: string; email: string; phone: string;
  department: string; specialization: string; experience: number;
  qualification: string; bio: string; consultationFee: number;
  timeSlots: TimeSlot[]; isAvailable: boolean; avatar: string;
  rating: number; totalReviews: number;
}
interface UnlinkedDoctorUser {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
}
interface Consultation {
  _id: string; patientName: string; patientEmail: string; patientPhone: string;
  doctorName: string; doctorDepartment: string; doctorSpecialization: string;
  appointmentDate: string; preferredTimeSlot: string; allottedTime: string;
  consultationType: string; queueNumber: number; patientsAhead: number;
  status: string; fees: number; symptoms: string; notes: string;
}

const EMPTY_DOCTOR = {
  name: '', email: '', phone: '', department: 'General Medicine',
  specialization: '', experience: 0, qualification: '', bio: '',
  consultationFee: 0, timeSlots: [] as TimeSlot[], avatar: '👨‍⚕️', isAvailable: true,
};

export default function AdminConsultations() {
  const [activeTab, setActiveTab] = useState<'consultations' | 'doctors'>('consultations');

  // ── CONSULTATION STATE ──
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loadingC, setLoadingC] = useState(false);
  const [cSearch, setCSearch] = useState('');
  const [cStatus, setCStatus] = useState('');
  const [cDate, setCDate] = useState('');
  const [allotModal, setAllotModal] = useState<Consultation | null>(null);
  const [allotNote, setAllotNote] = useState('');
  const [allotStatus, setAllotStatus] = useState('confirmed');

  // ── DOCTOR STATE ──
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingD, setLoadingD] = useState(false);
  const [unlinkedDoctors, setUnlinkedDoctors] = useState<UnlinkedDoctorUser[]>([]);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [docForm, setDocForm] = useState({ ...EMPTY_DOCTOR });
  const [docError, setDocError] = useState('');
  const [docSubmitting, setDocSubmitting] = useState(false);
  const [newSlot, setNewSlot] = useState<TimeSlot>({ day: 'Monday', startTime: '09:00', endTime: '13:00', maxPatients: 20, isActive: true });

  // ── FETCH CONSULTATIONS ──
  const fetchConsultations = useCallback(async () => {
    setLoadingC(true);
    try {
      const params = new URLSearchParams();
      if (cStatus) params.set('status', cStatus);
      if (cDate) params.set('date', cDate);
      if (cSearch) params.set('search', cSearch);
      const res = await fetch(`/api/admin/consultations?${params}`);
      const data = await res.json();
      setConsultations(data.consultations || []);
    } catch { setConsultations([]); }
    finally { setLoadingC(false); }
  }, [cStatus, cDate, cSearch]);

  // ── FETCH DOCTORS ──
  const fetchDoctors = useCallback(async () => {
    setLoadingD(true);
    try {
      const res = await fetch('/api/admin/doctors');
      const data = await res.json();
      setDoctors(data.doctors || []);
      setUnlinkedDoctors(data.unlinkedDoctorUsers || []);
    } catch {
      setDoctors([]);
      setUnlinkedDoctors([]);
    }
    finally { setLoadingD(false); }
  }, []);

  useEffect(() => { fetchConsultations(); }, [fetchConsultations]);
  useEffect(() => { if (activeTab === 'doctors') fetchDoctors(); }, [activeTab, fetchDoctors]);

  // ── ALLOT TIME SLOT ──
  const handleAllot = async () => {
    if (!allotModal) return;
    try {
      const res = await fetch(`/api/admin/consultations/${allotModal._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: allotNote, status: allotStatus }),
      });
      if (res.ok) { fetchConsultations(); setAllotModal(null); }
    } catch {}
  };

  // ── UPDATE CONSULTATION STATUS ──
  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/admin/consultations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchConsultations();
    } catch {}
  };

  // ── DELETE CONSULTATION ──
  const deleteConsultation = async (id: string) => {
    if (!confirm('Delete this consultation record?')) return;
    try {
      await fetch(`/api/admin/consultations/${id}`, { method: 'DELETE' });
      fetchConsultations();
    } catch {}
  };

  // ── OPEN DOCTOR MODAL ──
  const openAddDoctor = () => {
    setEditingDoctor(null);
    setDocForm({ ...EMPTY_DOCTOR });
    setDocError('');
    setShowDoctorModal(true);
  };

  const openAddDoctorFromUser = (u: UnlinkedDoctorUser) => {
    setEditingDoctor(null);
    setDocForm({
      ...EMPTY_DOCTOR,
      name: u.fullName || '',
      email: u.email || '',
      phone: u.phone || '',
    });
    setDocError('');
    setShowDoctorModal(true);
  };

  const openEditDoctor = (doc: Doctor) => {
    setEditingDoctor(doc);
    setDocForm({
      name: doc.name, email: doc.email, phone: doc.phone || '',
      department: doc.department, specialization: doc.specialization,
      experience: doc.experience, qualification: doc.qualification || '',
      bio: doc.bio || '', consultationFee: doc.consultationFee,
      timeSlots: doc.timeSlots || [], avatar: doc.avatar || '👨‍⚕️',
      isAvailable: doc.isAvailable,
    });
    setDocError('');
    setShowDoctorModal(true);
  };

  const addSlot = () => {
    setDocForm({ ...docForm, timeSlots: [...docForm.timeSlots, { ...newSlot }] });
    setNewSlot({ day: 'Monday', startTime: '09:00', endTime: '13:00', maxPatients: 20, isActive: true });
  };

  const removeSlot = (idx: number) => {
    setDocForm({ ...docForm, timeSlots: docForm.timeSlots.filter((_, i) => i !== idx) });
  };

  // ── SAVE DOCTOR ──
  const saveDoctor = async () => {
    if (!docForm.name || !docForm.email || !docForm.specialization || !docForm.consultationFee) {
      setDocError('Name, email, specialization and fee are required.'); return;
    }
    setDocSubmitting(true); setDocError('');
    try {
      const currentUserRaw = localStorage.getItem('user');
      const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
      const currentRole = currentUser?.role || 'user';

      const url = editingDoctor ? `/api/admin/doctors/${editingDoctor._id}` : '/api/admin/doctors';
      const method = editingDoctor ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentRole,
        },
        body: JSON.stringify(docForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      fetchDoctors();
      setShowDoctorModal(false);
    } catch (e: any) {
      setDocError(e.message);
    } finally {
      setDocSubmitting(false);
    }
  };

  // ── TOGGLE DOCTOR AVAILABILITY ──
  const toggleAvailability = async (doc: Doctor) => {
    try {
      await fetch(`/api/admin/doctors/${doc._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !doc.isAvailable }),
      });
      fetchDoctors();
    } catch {}
  };

  // ── DELETE DOCTOR ──
  const deleteDoctor = async (id: string) => {
    if (!confirm('Delete this doctor? This will permanently delete doctor profile and login account.')) return;
    try {
      await fetch(`/api/admin/doctors/${id}`, { method: 'DELETE' });
      fetchDoctors();
    } catch {}
  };

  const deletePendingDoctorUser = async (u: UnlinkedDoctorUser) => {
    if (!confirm('Delete this pending doctor account? This will permanently delete login account.')) return;
    try {
      const currentUserRaw = localStorage.getItem('user');
      const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
      const currentRole = currentUser?.role || 'user';

      const res = await fetch(`/api/admin/doctors/pending-user/${u._id}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': currentRole,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete pending doctor account');
      }

      setUnlinkedDoctors((prev) => prev.filter((item) => item._id !== u._id));
    } catch (e: any) {
      alert(e?.message || 'Failed to delete pending doctor account');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultation Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage doctors, bookings, and time slots</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { key: 'consultations', label: '📋 All Consultations' },
          { key: 'doctors', label: '👨‍⚕️ Manage Doctors' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-5 py-2.5 font-medium text-sm border-b-2 -mb-px transition ${
              activeTab === tab.key
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── CONSULTATIONS TAB ── */}
      {activeTab === 'consultations' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <input
              type="text"
              placeholder="Search patient / doctor..."
              value={cSearch}
              onChange={(e) => setCSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchConsultations()}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 w-64"
            />
            <select
              value={cStatus}
              onChange={(e) => setCStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input
              type="date"
              value={cDate}
              onChange={(e) => setCDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <button
              onClick={fetchConsultations}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700"
            >
              Apply Filters
            </button>
            <button
              onClick={() => { setCSearch(''); setCStatus(''); setCDate(''); setTimeout(fetchConsultations, 0); }}
              className="text-gray-500 border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Clear
            </button>
          </div>

          {loadingC ? (
            <div className="text-center py-20 text-gray-500">Loading consultations...</div>
          ) : consultations.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-3">📋</div>
              <p className="text-lg font-medium">No consultations found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {consultations.map((c) => (
                <div key={c._id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">

                    {/* Patient + Doctor info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900">{c.patientName}</span>
                        <span className={`text-xs border px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-600'}`}>
                          {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                        </span>
                        <span className="text-xs text-gray-400">Token #{c.queueNumber}</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">{c.patientEmail} {c.patientPhone && `· ${c.patientPhone}`}</p>
                      <p className="text-sm font-medium text-emerald-700">
                        {c.doctorName} · <span className="text-gray-500 font-normal">{c.doctorSpecialization}, {c.doctorDepartment}</span>
                      </p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                        <span>📅 {new Date(c.appointmentDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {c.preferredTimeSlot && <span>⏰ Preferred: {c.preferredTimeSlot}</span>}
                        {c.allottedTime && <span className="text-blue-700 font-medium">✅ Allotted: {c.allottedTime}</span>}
                        <span>Type: {c.consultationType}</span>
                        <span>₹{c.fees}</span>
                      </div>
                      {c.symptoms && <p className="text-xs text-gray-500 mt-1">Symptoms: {c.symptoms}</p>}
                      {c.notes && <p className="text-xs bg-yellow-50 text-yellow-800 rounded px-2 py-1 mt-1">📝 {c.notes}</p>}
                    </div>

                    {/* Queue badge */}
                    {['pending', 'confirmed'].includes(c.status) && (
                      <div className="flex-shrink-0 text-center bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 min-w-[100px]">
                        <p className="text-xs text-gray-400 mb-0.5">Token</p>
                        <p className="text-3xl font-extrabold text-emerald-700">#{c.queueNumber}</p>
                        <p className="text-xs text-gray-500">{c.patientsAhead === 0 ? 'First' : `${c.patientsAhead} ahead`}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex-shrink-0 flex flex-wrap gap-2 items-center">
                      {/* Status dropdown */}
                      <select
                        value={c.status}
                        onChange={(e) => updateStatus(c._id, e.target.value)}
                        className="border border-gray-200 rounded-lg text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      {/* Allot time slot */}
                      <button
                        onClick={() => { setAllotModal(c); setAllotNote(c.notes || ''); setAllotStatus(c.status); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg transition"
                      >
                        Update Status/Note
                      </button>

                      <button
                        onClick={() => deleteConsultation(c._id)}
                        className="text-red-500 hover:text-red-700 text-xs border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── DOCTORS TAB ── */}
      {activeTab === 'doctors' && (
        <>
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600 text-sm">{doctors.length} doctor(s) registered</p>
            <button
              onClick={openAddDoctor}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-medium text-sm transition"
            >
              + Add Doctor
            </button>
          </div>

          {unlinkedDoctors.length > 0 && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-semibold text-amber-900">Registered doctor accounts pending profile setup</h3>
                  <p className="text-sm text-amber-800 mt-1">
                    These users signed up as doctor but are not yet in Doctor Master. Add them here so doctor panel links correctly.
                  </p>
                </div>
                <span className="text-xs bg-amber-200 text-amber-900 px-2 py-1 rounded-full font-semibold">
                  {unlinkedDoctors.length} pending
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {unlinkedDoctors.map((u) => (
                  <div key={u._id} className="bg-white border border-amber-200 rounded-lg p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{u.fullName || 'Doctor User'}</p>
                      <p className="text-xs text-gray-600 truncate">{u.email}</p>
                      {u.phone && <p className="text-xs text-gray-500">{u.phone}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openAddDoctorFromUser(u)}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-medium"
                      >
                        Create Profile
                      </button>
                      <button
                        onClick={() => deletePendingDoctorUser(u)}
                        className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-medium"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loadingD ? (
            <div className="text-center py-20 text-gray-500">Loading doctors...</div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-3">👨‍⚕️</div>
              <p className="text-lg font-medium">No doctors yet</p>
              <button onClick={openAddDoctor} className="mt-4 bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">
                Add First Doctor
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {doctors.map((doc) => (
                <div key={doc._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 flex items-center gap-3">
                    <div className="text-4xl">{doc.avatar || '👨‍⚕️'}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{doc.name}</h3>
                      <p className="text-emerald-700 text-xs font-medium">{doc.specialization}</p>
                      <p className="text-gray-500 text-xs">{doc.department}</p>
                    </div>
                    <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${doc.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {doc.isAvailable ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>🏥 {doc.experience} yrs</span>
                      <span className="font-bold text-gray-900">₹{doc.consultationFee}</span>
                    </div>
                    {doc.qualification && <p className="text-xs text-gray-400 mb-2">🎓 {doc.qualification}</p>}
                    {doc.timeSlots?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {doc.timeSlots.slice(0, 3).map((s, i) => (
                          <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${s.isActive ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                            {s.day.slice(0, 3)} {s.startTime}–{s.endTime}
                          </span>
                        ))}
                        {doc.timeSlots.length > 3 && <span className="text-xs text-gray-400">+{doc.timeSlots.length - 3} more</span>}
                      </div>
                    )}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button onClick={() => openEditDoctor(doc)} className="flex-1 text-sm border border-gray-300 rounded-lg py-1.5 hover:bg-gray-50 transition">
                        Edit
                      </button>
                      <button onClick={() => toggleAvailability(doc)} className={`flex-1 text-sm border rounded-lg py-1.5 transition ${doc.isAvailable ? 'border-orange-200 text-orange-600 hover:bg-orange-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                        {doc.isAvailable ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => deleteDoctor(doc._id)} className="text-red-400 hover:text-red-600 border border-red-100 rounded-lg px-2.5 hover:bg-red-50 transition">
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── UPDATE CONSULTATION MODAL ── */}
      {allotModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold">Update Consultation</h2>
                  <p className="text-blue-100 text-sm mt-0.5">Token #{allotModal.queueNumber} · {allotModal.patientName}</p>
                </div>
                <button onClick={() => setAllotModal(null)} className="text-white/80 hover:text-white text-xl">✕</button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                <p><strong>Doctor:</strong> {allotModal.doctorName}</p>
                <p><strong>Date:</strong> {new Date(allotModal.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                {allotModal.preferredTimeSlot && <p><strong>Patient preferred:</strong> {allotModal.preferredTimeSlot}</p>}
                {allotModal.allottedTime && <p><strong>Doctor confirmed time:</strong> {allotModal.allottedTime}</p>}
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Exact consultation time can only be set by the doctor from the doctor panel.
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
                <select
                  value={allotStatus}
                  onChange={(e) => setAllotStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes for Patient</label>
                <textarea
                  rows={3}
                  value={allotNote}
                  onChange={(e) => setAllotNote(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  placeholder="E.g. Please arrive 10 mins early, bring previous reports..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setAllotModal(null)} className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleAllot} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-medium transition">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT DOCTOR MODAL ── */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 rounded-t-2xl sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">{editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</h2>
                <button onClick={() => setShowDoctorModal(false)} className="text-white/80 hover:text-white text-xl">✕</button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {docError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">{docError}</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input type="text" value={docForm.name} onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="Dr. Full Name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" value={docForm.email} onChange={(e) => setDocForm({ ...docForm, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="doctor@email.com" />
                  <p className="text-xs text-amber-700 mt-1">
                    Important: this email must exactly match the doctor login account email for panel linking.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={docForm.phone} onChange={(e) => setDocForm({ ...docForm, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <select value={docForm.department} onChange={(e) => setDocForm({ ...docForm, department: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400">
                    {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialization *</label>
                  <input type="text" value={docForm.specialization} onChange={(e) => setDocForm({ ...docForm, specialization: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="e.g. Cardiologist" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                  <input type="number" value={docForm.experience} min={0} onChange={(e) => setDocForm({ ...docForm, experience: +e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                  <input type="text" value={docForm.qualification} onChange={(e) => setDocForm({ ...docForm, qualification: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="MBBS, MD..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₹) *</label>
                  <input type="number" value={docForm.consultationFee} min={0} onChange={(e) => setDocForm({ ...docForm, consultationFee: +e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Avatar (emoji)</label>
                  <input type="text" value={docForm.avatar} onChange={(e) => setDocForm({ ...docForm, avatar: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="👨‍⚕️" />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input type="checkbox" id="avail" checked={docForm.isAvailable} onChange={(e) => setDocForm({ ...docForm, isAvailable: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                  <label htmlFor="avail" className="text-sm font-medium text-gray-700">Available for bookings</label>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea rows={2} value={docForm.bio} onChange={(e) => setDocForm({ ...docForm, bio: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" placeholder="Brief description..." />
              </div>

              {/* Time Slots */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Time Slots</h3>
                {docForm.timeSlots.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {docForm.timeSlots.map((slot, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm">
                        <span className={`w-2 h-2 rounded-full ${slot.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="font-medium w-24">{slot.day}</span>
                        <span>{slot.startTime} – {slot.endTime}</span>
                        <span className="text-gray-400 ml-1">({slot.maxPatients} max)</span>
                        <button onClick={() => removeSlot(idx)} className="ml-auto text-red-400 hover:text-red-600 text-xs">Remove</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new slot */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm font-medium text-blue-700 mb-3">Add Time Slot</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Day</label>
                      <select value={newSlot.day} onChange={(e) => setNewSlot({ ...newSlot, day: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                        {DAYS.map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Start</label>
                      <input type="time" value={newSlot.startTime} onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">End</label>
                      <input type="time" value={newSlot.endTime} onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Max Patients</label>
                      <input type="number" min={1} value={newSlot.maxPatients} onChange={(e) => setNewSlot({ ...newSlot, maxPatients: +e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </div>
                  <button onClick={addSlot} className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-700 transition">
                    + Add Slot
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowDoctorModal(false)} className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={saveDoctor} disabled={docSubmitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2.5 font-medium transition disabled:opacity-60">
                  {docSubmitting ? 'Saving...' : editingDoctor ? 'Update Doctor' : 'Add Doctor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

