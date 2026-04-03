'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const AgoraConsultationCall = dynamic(() => import('@/components/AgoraConsultationCall'), {
  ssr: false,
});

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, callback: (response: any) => void) => void;
    };
  }
}

const DEPARTMENTS = [
  'All',
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Orthopedics',
  'Neurology',
  'Gynecology',
  'ENT',
  'Ophthalmology',
  'Psychiatry',
  'Oncology',
  'Urology',
  'Gastroenterology',
  'Endocrinology',
  'Pulmonology',
];

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'fee-low', label: 'Fee: Low to High' },
  { value: 'fee-high', label: 'Fee: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'experience', label: 'Most Experienced' },
];

interface TimeSlot {
  _id: string;
  day: string;
  startTime: string;
  endTime: string;
  maxPatients: number;
  isActive: boolean;
}

interface Doctor {
  _id: string;
  name: string;
  department: string;
  specialization: string;
  experience: number;
  qualification: string;
  consultationFee: number;
  rating: number;
  totalReviews: number;
  timeSlots: TimeSlot[];
  isAvailable: boolean;
  avatar: string;
  bio: string;
}

interface Consultation {
  _id: string;
  doctorName: string;
  doctorDepartment: string;
  doctorSpecialization: string;
  appointmentDate: string;
  preferredTimeSlot: string;
  allottedTime: string;
  consultationType: 'in-person' | 'video' | 'audio';
  queueNumber: number;
  patientsAhead: number;
  status: string;
  fees: number;
  symptoms: string;
  notes: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

async function loadRazorpayScript() {
  if (typeof window === 'undefined') return false;
  if (window.Razorpay) return true;

  return new Promise<boolean>((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function DoctorConsultationPage() {
  const router = useRouter();
  const isImageUrl = (value?: string) => !!value && /^(https?:\/\/|\/)/i.test(value);

  const [activeTab, setActiveTab] = useState<'find' | 'mine'>('find');
  const [sortOrder, setSortOrder] = useState('featured');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingConsultations, setLoadingConsultations] = useState(false);
  const [selectedDept, setSelectedDept] = useState('All');
  const [search, setSearch] = useState('');
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<Consultation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeCall, setActiveCall] = useState<Consultation | null>(null);

  const redirectToLogin = () => {
    if (typeof window === 'undefined') return;
    const returnTo = `${window.location.pathname}${window.location.search}`;
    router.push(`/login?redirect=${encodeURIComponent(returnTo)}`);
  };

  const [form, setForm] = useState({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    appointmentDate: '',
    consultationType: 'in-person',
    symptoms: '',
  });

  const getUserData = () => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const fetchDoctors = useCallback(async () => {
    setLoadingDoctors(true);
    try {
      const params = new URLSearchParams();
      if (selectedDept !== 'All') params.set('department', selectedDept);
      if (search) params.set('search', search);
      const res = await fetch(`/api/doctors?${params}`);
      const data = await res.json();
      setDoctors(data.doctors || []);
    } catch {
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  }, [selectedDept, search]);

  const fetchConsultations = useCallback(async () => {
    const user = getUserData();
    if (!user?._id) return;
    setLoadingConsultations(true);
    try {
      const res = await fetch(`/api/consultations?userId=${user._id}`);
      const data = await res.json();
      setConsultations(data.consultations || []);
    } catch {
      setConsultations([]);
    } finally {
      setLoadingConsultations(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  useEffect(() => {
    if (activeTab === 'mine') fetchConsultations();
  }, [activeTab, fetchConsultations]);

  const openBooking = (doctor: Doctor) => {
    const user = getUserData();
    if (!user) {
      redirectToLogin();
      return;
    }

    setBookingDoctor(doctor);
    setForm({
      patientName: user?.fullName || '',
      patientPhone: user?.phone || '',
      patientEmail: user?.email || '',
      appointmentDate: '',
      consultationType: 'in-person',
      symptoms: '',
    });
    setError('');
    setShowBookingModal(true);
  };

  const handleBook = async () => {
    const user = getUserData();
    if (!user) { setError('Please log in to book a consultation.'); return; }
    if (!form.patientName || !form.appointmentDate) { setError('Please fill in all required fields.'); return; }
    if (!bookingDoctor) return;
    setSubmitting(true);
    setError('');
    try {
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded || !window.Razorpay) {
        throw new Error('Unable to load Razorpay. Please try again.');
      }

      const orderRes = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: bookingDoctor.consultationFee,
          receipt: `consult_${Date.now()}`,
          notes: {
            flow: 'doctor-consultation',
            userId: user._id,
            doctorId: bookingDoctor._id,
          },
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Unable to initiate payment');

      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'MySanjeevani',
        description: `Consultation with Dr. ${bookingDoctor.name}`,
        order_id: orderData.order.id,
        method: {
          card: true,
          netbanking: true,
          upi: true,
          wallet: true,
          paylater: false,
          emi: false,
        },
        retry: {
          enabled: true,
          max_count: 2,
        },
        prefill: {
          name: form.patientName,
          email: form.patientEmail || user.email || '',
          contact: form.patientPhone || '',
        },
        theme: { color: '#059669' },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
          },
        },
        handler: async (paymentResponse: any) => {
          try {
            const res = await fetch('/api/consultations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user._id,
                doctorId: bookingDoctor._id,
                ...form,
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpaySignature: paymentResponse.razorpay_signature,
              }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Booking failed after payment');
            setBookingSuccess(data.consultation);
            setShowBookingModal(false);
            setSubmitting(false);
          } catch (innerError: any) {
            setError(innerError.message || 'Booking failed after successful payment. Please contact support.');
            setSubmitting(false);
          }
        },
      });

      razorpay.on('payment.failed', (failure: any) => {
        const reason = failure?.error?.description || 'Payment failed. Please try again.';
        setError(reason);
        setSubmitting(false);
      });

      razorpay.open();
    } catch (e: any) {
      setError(e.message);
      setSubmitting(false);
    }
  };

  const cancelConsultation = async (id: string) => {
    if (!confirm('Cancel this consultation?')) return;
    try {
      await fetch(`/api/consultations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      fetchConsultations();
    } catch {}
  };

  const canJoinLiveCall = (consultation: Consultation) => {
    const isLiveMode = consultation.consultationType === 'video' || consultation.consultationType === 'audio';
    const isJoinableStatus = consultation.status === 'confirmed' || consultation.status === 'in-progress';
    return isLiveMode && isJoinableStatus;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Apply sorting to doctors
  const sortedDoctors = useMemo(() => {
    let result = [...doctors];
    if (sortOrder === 'fee-low') result.sort((a, b) => a.consultationFee - b.consultationFee);
    else if (sortOrder === 'fee-high') result.sort((a, b) => b.consultationFee - a.consultationFee);
    else if (sortOrder === 'rating') result.sort((a, b) => b.rating - a.rating);
    else if (sortOrder === 'experience') result.sort((a, b) => b.experience - a.experience);
    return result;
  }, [doctors, sortOrder]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-teal-50 to-white flex flex-col">
      <Header />

      {/* Hero */}
      <div className="w-full -mt-48">
        <img src="/CD.png" alt="Doctor Consultation" className="w-full h-auto object-cover block" />
      </div>

      {/* Search & Filter Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-emerald-200 shadow-sm -mt-40">
        <div className="max-w-7xl mx-auto px-4 py-1">
          <div className="flex flex-col gap-4 md:gap-0 md:flex-row md:items-center md:justify-between">
            {/* Search Bar */}
            <div className="flex-1 md:mr-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Search by doctor name, specialization, department..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchDoctors()}
                  className="w-full border-2 border-emerald-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition text-sm"
                />
              </div>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="border-2 border-emerald-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 transition text-sm font-medium text-gray-700"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Horizontal Category Scroll */}
        <div className="max-w-7xl mx-auto px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`whitespace-nowrap px-4 py-2 rounded-full font-medium text-sm transition-all flex-shrink-0 ${
                  selectedDept === dept
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-emerald-100'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Booking success banner */}
        {bookingSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-green-800 text-lg mb-1">✅ Consultation Booked!</h3>
              <p className="text-green-700">
                <strong>Doctor:</strong> {bookingSuccess.doctorName} &nbsp;|&nbsp;
                <strong>Date:</strong> {new Date(bookingSuccess.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-green-700 mt-1">
                <strong>Your Token:</strong>{' '}
                <span className="text-2xl font-bold text-emerald-700">#{bookingSuccess.queueNumber}</span>
                &nbsp;—&nbsp;
                {bookingSuccess.patientsAhead === 0 ? "You're first in queue!" : `${bookingSuccess.patientsAhead} patient(s) ahead of you`}
              </p>
              <p className="text-sm text-green-600 mt-1">Doctor will confirm your exact consultation time after reviewing your booking.</p>
            </div>
            <button onClick={() => setBookingSuccess(null)} className="text-green-500 hover:text-green-700 text-xl">✕</button>
          </div>
        )}

      <div className="flex-1 max-w-7xl mx-auto px-4 py-10 w-full">

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('find')}
            className={`px-6 py-3 font-semibold text-base transition-colors border-b-2 ${
              activeTab === 'find' 
                ? 'text-emerald-700 border-emerald-700' 
                : 'text-gray-600 border-transparent hover:text-emerald-600'
            }`}
          >
            🔍 Find Doctors
          </button>
          <button
            onClick={() => setActiveTab('mine')}
            className={`px-6 py-3 font-semibold text-base transition-colors border-b-2 ${
              activeTab === 'mine' 
                ? 'text-emerald-700 border-emerald-700' 
                : 'text-gray-600 border-transparent hover:text-emerald-600'
            }`}
          >
            📋 My Consultations
          </button>
        </div>
        {activeTab === 'find' && (
          <>
            {/* Results Header */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {selectedDept === 'All' ? '👨‍⚕️ Find a Doctor' : `🏥 ${selectedDept}`}
                  </h1>
                  <p className="text-gray-600 mt-1 text-sm">
                    {sortedDoctors.length} {sortedDoctors.length === 1 ? 'doctor' : 'doctors'} available
                  </p>
                </div>
              </div>
            </div>

            {loadingDoctors ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm animate-pulse"
                  >
                    <div className="h-48 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl mb-4" />
                    <div className="h-4 bg-gray-200 rounded mb-3 w-3/4" />
                    <div className="h-3 bg-gray-200 rounded mb-2 w-full" />
                    <div className="h-3 bg-gray-200 rounded mb-4 w-1/2" />
                    <div className="h-10 bg-emerald-100 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : sortedDoctors.length === 0 ? (
              <div className="text-center py-20 bg-white border-2 border-dashed border-emerald-200 rounded-3xl shadow-sm">
                <div className="text-7xl mb-4 opacity-50">👨‍⚕️</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No doctors found</h3>
                <p className="text-gray-600 mb-6">
                  {search
                    ? `We couldn't find any doctors matching "${search}"`
                    : 'No doctors available in this department'}
                </p>
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="px-6 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Doctors Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {sortedDoctors.map((doctor) => (
                    <article
                      key={doctor._id}
                      className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col group"
                    >
                      {/* Avatar Container */}
                      <div className="relative h-48 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center overflow-hidden">
                        {isImageUrl(doctor.avatar) ? (
                          <img
                            src={doctor.avatar}
                            alt={doctor.name}
                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-7xl group-hover:scale-125 transition-transform duration-300">
                            {doctor.avatar || '👨‍⚕️'}
                          </span>
                        )}

                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md ${
                              doctor.isAvailable
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                            }`}
                          >
                            {doctor.isAvailable ? '🟢 Available' : 'Unavailable'}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex flex-col flex-1">
                        {/* Doctor Name */}
                        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 min-h-9 leading-tight">
                          {doctor.name}
                        </h3>

                        {/* Specialization */}
                        <p className="text-xs font-semibold text-emerald-700 mt-1">
                          {doctor.specialization}
                        </p>

                        {/* Department & Qualification */}
                        <div className="flex items-center gap-1 mb-2 mt-2 flex-wrap">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                            {doctor.department}
                          </span>
                          {doctor.qualification && (
                            <span className="text-[10px] uppercase tracking-wider font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
                              {doctor.qualification.split(' ')[0]}
                            </span>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3 mt-2 py-2 border-t border-gray-100 text-xs">
                          <span>🏥 {doctor.experience} yrs</span>
                          <span className="text-gray-300">|</span>
                          <span className="font-semibold">
                            ⭐ {doctor.rating > 0 ? doctor.rating.toFixed(1) : 'New'}
                          </span>
                          {doctor.totalReviews > 0 && (
                            <span className="text-gray-500">({doctor.totalReviews})</span>
                          )}
                        </div>

                        {/* Time Slots */}
                        {doctor.timeSlots?.some((s) => s.isActive) && (
                          <div className="mt-2 flex flex-wrap gap-1 min-h-[20px]">
                            {doctor.timeSlots
                              .filter((s) => s.isActive)
                              .slice(0, 2)
                              .map((slot) => (
                                <span
                                  key={slot._id}
                                  className="bg-teal-50 text-teal-700 text-[10px] px-2 py-1 rounded-full border border-teal-200 font-medium"
                                >
                                  {slot.day.slice(0, 3)} {slot.startTime}
                                </span>
                              ))}
                          </div>
                        )}

                        {/* Fee & Button */}
                        <div className="mt-auto pt-3 border-t border-gray-100">
                          <div className="mb-3">
                            <p className="text-[10px] text-gray-500">Consultation Fee</p>
                            <p className="text-xl font-bold text-gray-900">₹{doctor.consultationFee}</p>
                          </div>

                          {doctor.isAvailable ? (
                            <button
                              onClick={() => openBooking(doctor)}
                              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-bold transition-all transform hover:scale-105 active:scale-95"
                            >
                              📅 Book Now
                            </button>
                          ) : (
                            <button
                              disabled
                              className="w-full bg-gray-200 text-gray-500 py-2.5 rounded-xl text-sm font-bold cursor-not-allowed"
                            >
                              Unavailable
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Results Footer */}
                <div className="mt-12 text-center">
                  <p className="text-gray-600 text-sm">
                    Showing all {sortedDoctors.length} doctors • Verified & experienced professionals
                  </p>
                </div>
              </>
            )}
          </>
        )}

        {/* MY CONSULTATIONS TAB */}
        {activeTab === 'mine' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Consultations</h2>
              <button
                onClick={fetchConsultations}
                className="text-emerald-600 text-sm font-medium border border-emerald-300 px-4 py-2 rounded-lg hover:bg-emerald-50"
              >
                ↻ Refresh
              </button>
            </div>

            {loadingConsultations ? (
              <div className="text-center py-20 text-gray-500">Loading...</div>
            ) : consultations.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-lg font-medium">No consultations yet</p>
                <button
                  onClick={() => setActiveTab('find')}
                  className="mt-4 bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
                >
                  Book Your First Consultation
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {consultations.map((c) => (
                  <div key={c._id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-gray-900 text-lg">{c.doctorName}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-600'}`}>
                            {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-emerald-700 font-medium mb-1">{c.doctorSpecialization} · {c.doctorDepartment}</p>
                        <p className="text-sm text-gray-600">
                          📅 {new Date(c.appointmentDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          {!c.allottedTime && <span> · ⏰ Exact time pending</span>}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Consultation Type: <span className="capitalize font-medium">{c.consultationType || 'in-person'}</span>
                        </p>
                        {c.allottedTime && (
                          <p className="text-sm text-blue-700 font-medium mt-1">✅ Doctor confirmed time: <strong>{c.allottedTime}</strong></p>
                        )}
                        {c.symptoms && <p className="text-sm text-gray-500 mt-1">Symptoms: {c.symptoms}</p>}
                        {c.notes && (
                          <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded px-3 py-2">📝 {c.notes}</p>
                        )}
                      </div>

                      {['pending', 'confirmed'].includes(c.status) && (
                        <div className="flex-shrink-0 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 text-center min-w-[140px]">
                          <p className="text-xs text-gray-500 mb-1">Your Token No.</p>
                          <p className="text-4xl font-extrabold text-emerald-700">#{c.queueNumber}</p>
                          <p className="text-xs text-gray-600 mt-1 font-medium">
                            {c.patientsAhead === 0 ? "🎉 You're first!" : `${c.patientsAhead} patient(s) ahead`}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">Fees: ₹{c.fees}</p>
                        </div>
                      )}

                      {c.status === 'completed' && (
                        <div className="flex-shrink-0 bg-green-50 border border-green-200 rounded-xl p-4 text-center min-w-[110px]">
                          <p className="text-3xl">✅</p>
                          <p className="text-sm font-medium text-green-700 mt-1">Completed</p>
                          <p className="text-xs text-gray-400">₹{c.fees}</p>
                        </div>
                      )}
                    </div>

                    {['pending', 'confirmed'].includes(c.status) && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex flex-wrap items-center gap-2">
                          {canJoinLiveCall(c) && (
                            <button
                              onClick={() => setActiveCall(c)}
                              className="text-emerald-700 hover:text-emerald-900 text-sm border border-emerald-200 px-4 py-1.5 rounded-lg hover:bg-emerald-50 transition font-medium"
                            >
                              Join {c.consultationType === 'video' ? 'Video' : 'Audio'} Call
                            </button>
                          )}

                          <button
                            onClick={() => cancelConsultation(c._id)}
                            className="text-red-500 hover:text-red-700 text-sm border border-red-200 px-4 py-1.5 rounded-lg hover:bg-red-50 transition"
                          >
                            Cancel Consultation
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* BOOKING MODAL */}
      {showBookingModal && bookingDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-200">
            <div className="relative bg-gradient-to-br from-emerald-700 via-teal-600 to-cyan-600 text-white p-6 sm:p-8">
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
              <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/10" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Doctor Consultation</p>
                  <h2 className="text-2xl sm:text-3xl font-bold mt-1">Complete Your Booking</h2>
                  <p className="text-emerald-100 text-sm mt-2">
                    Fill in your details to lock your appointment slot.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="h-10 w-10 rounded-full bg-white/15 hover:bg-white/25 text-white text-xl leading-none transition"
                  aria-label="Close booking modal"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
              <aside className="lg:col-span-1 bg-slate-50 border-r border-slate-200 p-5 sm:p-6">
                <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-100 text-3xl flex items-center justify-center overflow-hidden">
                      {bookingDoctor.avatar || '👨‍⚕️'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{bookingDoctor.name}</p>
                      <p className="text-sm text-emerald-700 truncate">{bookingDoctor.specialization}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p>Department: <span className="font-medium text-slate-800">{bookingDoctor.department}</span></p>
                    <p>Experience: <span className="font-medium text-slate-800">{bookingDoctor.experience} years</span></p>
                    <p>Consultation Fee: <span className="font-semibold text-emerald-700">₹{bookingDoctor.consultationFee}</span></p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Doctor confirms exact time after booking. Queue token is generated instantly.
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Booking Steps</p>
                  <ol className="mt-3 space-y-2 text-sm text-slate-700">
                    <li>1. Enter patient details</li>
                    <li>2. Choose date and preferred slot</li>
                    <li>3. Confirm consultation type</li>
                  </ol>
                </div>
              </aside>

              <div className="lg:col-span-2 p-5 sm:p-6">
                {error && (
                  <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Patient Name *</label>
                    <input
                      type="text"
                      value={form.patientName}
                      onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={form.patientPhone}
                      onChange={(e) => setForm({ ...form, patientPhone: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                      placeholder="10-digit mobile number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={form.patientEmail}
                      onChange={(e) => setForm({ ...form, patientEmail: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                      placeholder="name@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Appointment Date *</label>
                    <input
                      type="date"
                      min={todayStr}
                      value={form.appointmentDate}
                      onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Consultation Type</label>
                    <select
                      value={form.consultationType}
                      onChange={(e) => setForm({ ...form, consultationType: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                    >
                      <option value="in-person">In-Person Visit</option>
                      <option value="video">Video Call</option>
                      <option value="audio">Audio Call</option>
                    </select>
                  </div>
                </div>

                <div className="mt-5">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Symptoms / Reason</label>
                  <textarea
                    rows={4}
                    value={form.symptoms}
                    onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 resize-none"
                    placeholder="Describe symptoms, concerns, or reason for consultation"
                  />
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="w-full sm:w-auto border border-slate-300 text-slate-700 rounded-xl px-6 py-2.5 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleBook}
                    disabled={submitting}
                    className="w-full sm:w-auto rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 font-semibold transition disabled:opacity-60"
                  >
                    {submitting ? 'Booking...' : `Confirm Booking • ₹${bookingDoctor.consultationFee}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeCall && (
        <AgoraConsultationCall
          isOpen={!!activeCall}
          consultationId={activeCall._id}
          consultationType={activeCall.consultationType === 'video' ? 'video' : 'audio'}
          participantType="patient"
          participantLabel="Patient"
          onClose={() => setActiveCall(null)}
        />
      )}

      <Footer />
    </div>
  );
}

