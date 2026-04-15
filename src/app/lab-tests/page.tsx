'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, callback: (response: any) => void) => void;
    };
  }
}

interface LabTest {
  _id: string;
  name: string;
  description?: string;
  price: number;
  mrp?: number;
  category: string;
  image?: string;
  icon?: string;
  rating?: number;
  reviews?: number;
  productType: string;
  isActive: boolean;
}

interface Booking {
  _id: string;
  testName: string;
  testPrice: number;
  collectionType: string;
  collectionDate: string;
  collectionTime: string;
  status: string;
  paymentStatus?: string;
  createdAt: string;
  provider?: 'local' | 'thyrocare' | 'healthians';
  providerOrderId?: string;
  providerStatus?: string;
  reportUrl?: string;
  reportReady?: boolean;
  providerLastSyncedAt?: string;
}

interface BookingForm {
  testId: string;
  testName: string;
  testPrice: number;
  collectionType: 'home' | 'center';
  collectionDate: string;
  collectionTime: string;
  address: string;
  patientPincode: string;
  patientAge: string;
  patientGender: 'MALE' | 'FEMALE' | 'OTHER';
  notes: string;
}

const CATEGORIES = ['all', 'general', 'diabetic', 'cardiac', 'thyroid', 'liver', 'kidney', 'vitamin', 'infection', 'womens-health'];

const CATEGORY_LABELS: Record<string, string> = {
  all: '🔍 All Tests', general: '🧪 General', diabetic: '🩸 Diabetes', cardiac: '❤️ Cardiac', thyroid: '🦋 Thyroid',
  liver: '🫘 Liver', kidney: '💧 Kidney', vitamin: '☀️ Vitamins', infection: '🦠 Infection', 'womens-health': '💜 Women',
};

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

const TIME_SLOTS = ['7:00 AM – 9:00 AM', '9:00 AM – 11:00 AM', '11:00 AM – 1:00 PM', '2:00 PM – 4:00 PM', '4:00 PM – 6:00 PM'];

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-amber-100 text-amber-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function normalizeProviderStatus(status?: string) {
  return String(status || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

function getProviderTimelineStep(status?: string) {
  const normalized = normalizeProviderStatus(status);

  if (
    normalized.includes('REPORT_READY') ||
    normalized.includes('COMPLETED') ||
    normalized.includes('DELIVERED')
  ) {
    return 3;
  }

  if (
    normalized.includes('PROCESSING') ||
    normalized.includes('IN_PROGRESS') ||
    normalized.includes('LAB_RECEIVED')
  ) {
    return 2;
  }

  if (
    normalized.includes('COLLECTED') ||
    normalized.includes('SAMPLE_COLLECTED') ||
    normalized.includes('PHLEBO_VISITED')
  ) {
    return 1;
  }

  return 0;
}

function formatProviderName(provider?: string) {
  if (!provider) return 'Partner';
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

async function loadRazorpayScript() {
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

export default function LabTestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'tests' | 'bookings'>('tests');
  const [tests, setTests] = useState<LabTest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('featured');
  const [bookingModal, setBookingModal] = useState<LabTest | null>(null);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    testId: '',
    testName: '',
    testPrice: 0,
    collectionType: 'home',
    collectionDate: '',
    collectionTime: '',
    address: '',
    patientPincode: '',
    patientAge: '',
    patientGender: 'MALE',
    notes: '',
  });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [syncingBookings, setSyncingBookings] = useState(false);
  const [syncingBookingId, setSyncingBookingId] = useState<string | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);

  const redirectToLogin = () => {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    router.push(`/login?redirect=${encodeURIComponent(returnTo)}`);
  };

  const fetchTests = useCallback(async () => {
    try {
      setLoading(true);
      const q = new URLSearchParams();
      if (category !== 'all') q.set('category', category);
      if (search) q.set('search', search);
      const res = await fetch(`/api/lab-tests?${q}`);
      const data = await res.json();
      setTests(data.tests || []);
    } catch {}
    finally { setLoading(false); }
  }, [category, search]);

  const fetchBookings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      const userId = String(user?.id || user?._id || '').trim();
      if (!token) return;
      const res = await fetch('/api/lab-test-bookings', {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(userId ? { 'x-user-id': userId } : {}),
        },
      });
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch {}
  }, []);

  const seedTests = async () => {
    setSeeding(true);
    try {
      await fetch('/api/lab-tests/seed', { method: 'POST' });
      await fetchTests();
    } catch {}
    setSeeding(false);
  };

  useEffect(() => { fetchTests(); }, [fetchTests]);

  useEffect(() => {
    const tabParam = String(searchParams.get('tab') || '').trim().toLowerCase();
    if (tabParam === 'bookings') {
      setActiveTab('bookings');
    }
  }, [searchParams]);

  useEffect(() => { if (activeTab === 'bookings') fetchBookings(); }, [activeTab, fetchBookings]);

  useEffect(() => {
    const currentTabParam = String(searchParams.get('tab') || '').trim().toLowerCase();
    const targetTabParam = activeTab === 'bookings' ? 'bookings' : '';
    if (currentTabParam === targetTabParam) return;

    const q = new URLSearchParams(Array.from(searchParams.entries()));
    if (activeTab === 'bookings') {
      q.set('tab', 'bookings');
    } else {
      q.delete('tab');
    }
    const query = q.toString();
    router.replace(query ? `/lab-tests?${query}` : '/lab-tests');
  }, [activeTab, router, searchParams]);

  const openBooking = (test: LabTest) => {
    const token = localStorage.getItem('token');
    if (!token) {
      redirectToLogin();
      return;
    }

    setBookingForm({
      testId: test._id,
      testName: test.name,
      testPrice: test.price,
      collectionType: 'home',
      collectionDate: '',
      collectionTime: '',
      address: '',
      patientPincode: '',
      patientAge: '',
      patientGender: 'MALE',
      notes: '',
    });
    setBookingModal(test);
    setBookingSuccess(false);
  };

  const syncProviderStatuses = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      const userId = String(user?.id || user?._id || '').trim();
      if (!token) return;

      setSyncingBookings(true);
      const res = await fetch('/api/lab-test-bookings/sync', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          ...(userId ? { 'x-user-id': userId } : {}),
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to sync provider status');
      }

      await fetchBookings();
    } catch {
      alert('Failed to sync provider status');
    } finally {
      setSyncingBookings(false);
    }
  }, [fetchBookings]);

  const syncSingleBooking = useCallback(async (bookingId: string) => {
    try {
      const token = localStorage.getItem('token');
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      const userId = String(user?.id || user?._id || '').trim();
      if (!token) return;

      setSyncingBookingId(bookingId);
      const res = await fetch(`/api/lab-test-bookings/${bookingId}/sync`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          ...(userId ? { 'x-user-id': userId } : {}),
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to sync this booking');
      }

      await fetchBookings();
    } catch {
      alert('Failed to sync this booking');
    } finally {
      setSyncingBookingId(null);
    }
  }, [fetchBookings]);

  const cancelBooking = useCallback(async (booking: Booking) => {
    if (booking.status === 'cancelled') {
      alert('This booking is already cancelled.');
      return;
    }

    if (booking.status === 'completed') {
      alert('Completed bookings cannot be cancelled.');
      return;
    }

    const ok = confirm('Cancel this booking? If paid online, refund will be initiated to your original payment account.');
    if (!ok) return;

    try {
      const token = localStorage.getItem('token');
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      const userId = String(user?.id || user?._id || '').trim();
      if (!token) {
        alert('Please login first.');
        return;
      }

      setCancellingBookingId(booking._id);
      const res = await fetch(`/api/lab-test-bookings/${booking._id}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          ...(userId ? { 'x-user-id': userId } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to cancel booking');
      }

      await fetchBookings();
      alert(data?.message || 'Booking cancelled successfully');
    } catch (error: any) {
      alert(error?.message || 'Failed to cancel booking');
    } finally {
      setCancellingBookingId(null);
    }
  }, [fetchBookings]);

  const submitBooking = async () => {
    try {
      const token = localStorage.getItem('token');
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      if (!token) { alert('Please login to book a test.'); return; }
      if (!bookingForm.collectionDate || !bookingForm.collectionTime) { alert('Please select collection date and time.'); return; }
      if (bookingForm.collectionType === 'home' && !bookingForm.address) { alert('Please enter your address for home collection.'); return; }

      const isPartnerTest = bookingForm.testId.startsWith('thyrocare_') || bookingForm.testId.startsWith('healthians_');
      if (isPartnerTest) {
        if (!/^\d{6}$/.test(bookingForm.patientPincode.trim())) {
          alert('Please enter a valid 6-digit pincode for partner lab booking.');
          return;
        }

        const age = Number(bookingForm.patientAge);
        if (!Number.isInteger(age) || age < 0 || age > 120) {
          alert('Please enter a valid age between 0 and 120.');
          return;
        }
      }

      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded || !window.Razorpay) {
        alert('Unable to load Razorpay. Please try again.');
        return;
      }

      const orderRes = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: bookingForm.testPrice,
          receipt: `lab_${Date.now()}`,
          notes: {
            flow: 'lab-test',
            testId: bookingForm.testId,
            userId: user?._id || '',
          },
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        alert(orderData.error || 'Unable to initiate payment');
        return;
      }

      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'MySanjeevni',
        description: `Lab Test: ${bookingForm.testName}`,
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
          name: user?.fullName || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: '#059669' },
        handler: async (paymentResponse: any) => {
          const userId = String(user?.id || user?._id || '').trim();
          const res = await fetch('/api/lab-test-bookings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
              ...(userId ? { 'x-user-id': userId } : {}),
            },
            body: JSON.stringify({
              ...bookingForm,
              patientPincode: bookingForm.patientPincode || undefined,
              patientAge: bookingForm.patientAge ? Number(bookingForm.patientAge) : undefined,
              patientGender: bookingForm.patientGender,
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpaySignature: paymentResponse.razorpay_signature,
            }),
          });
          if (res.ok) {
            setBookingSuccess(true);
            fetchBookings();
          } else {
            const data = await res.json();
            alert(data.error || 'Failed to book test after payment');
          }
        },
      });

      razorpay.on('payment.failed', (failure: any) => {
        const reason = failure?.error?.description || 'Payment failed. Please try again.';
        alert(reason);
      });

      razorpay.open();
    } catch { alert('Error booking test. Please try again.'); }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const discountPercent = (test: LabTest) => {
    if (!test.mrp || test.mrp <= test.price) return 0;
    return Math.round(((test.mrp - test.price) / test.mrp) * 100);
  };

  const filteredAndSortedTests = useMemo(() => {
    let result = tests.filter((test) => {
      const matchesCategory = category === 'all' || test.category === category;
      const searchText = search.trim().toLowerCase();
      const matchesSearch =
        !searchText ||
        test.name.toLowerCase().includes(searchText) ||
        (test.description || '').toLowerCase().includes(searchText);
      return matchesCategory && matchesSearch && test.isActive;
    });

    // Apply sorting
    if (sortOrder === 'price-low') result.sort((a, b) => a.price - b.price);
    else if (sortOrder === 'price-high') result.sort((a, b) => b.price - a.price);
    else if (sortOrder === 'rating') result.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    return result;
  }, [tests, category, search, sortOrder]);

  return (
    <div className="min-h-screen bg-linear-to-b from-emerald-50 via-teal-50 to-white flex flex-col">
      <Header />

      {/* Hero */}
      <div className="w-full -mt-48">
        <img src="/LB.png" alt="Lab Tests" className="w-full h-auto object-cover block" />
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
                  placeholder="🔍 Search lab tests, health packages, categories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full font-medium text-sm transition-all shrink-0 ${
                  category === cat
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-emerald-100'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div id="products-section" className="flex-1 max-w-7xl mx-auto px-4 py-10 w-full">
        <div className="mb-6">
          <div className="inline-flex rounded-xl border border-emerald-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('tests')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                activeTab === 'tests'
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Lab Tests
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                activeTab === 'bookings'
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              My Booking History
            </button>
          </div>
        </div>

        {activeTab === 'tests' && (
          <>
            {/* Results Header */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {category === 'all' ? '🧪 All Lab Tests' : `${CATEGORY_LABELS[category]}`}
                  </h1>
                  <p className="text-gray-600 mt-1 text-sm">
                    {filteredAndSortedTests.length} {filteredAndSortedTests.length === 1 ? 'test' : 'tests'} available
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm animate-pulse"
                  >
                    <div className="h-40 bg-linear-to-br from-emerald-100 to-teal-100 rounded-xl mb-4" />
                    <div className="h-4 bg-gray-200 rounded mb-3 w-3/4" />
                    <div className="h-3 bg-gray-200 rounded mb-2 w-full" />
                    <div className="h-3 bg-gray-200 rounded mb-4 w-1/2" />
                    <div className="h-10 bg-emerald-100 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : filteredAndSortedTests.length === 0 ? (
              <div className="text-center py-20 bg-white border-2 border-dashed border-emerald-200 rounded-3xl shadow-sm">
                <div className="text-7xl mb-4 opacity-50">🧪</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No tests found</h3>
                <p className="text-gray-600 mb-6">
                  {search
                    ? `We couldn't find any tests matching "${search}"`
                    : tests.length === 0
                    ? 'No tests available. Click "Load Sample Tests" to add tests to the database.'
                    : 'No tests available in this category'}
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
                {/* Tests Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredAndSortedTests.map((test) => (
                    <article
                      key={test._id}
                      className="group w-full max-w-56 mx-auto bg-white/95 border border-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300 cursor-pointer flex flex-col"
                      onClick={() => router.push(`/lab-tests/${test._id}`)}
                    >
                      {/* Image Container */}
                      <div className="relative h-40 bg-linear-to-br from-white to-slate-50 flex items-center justify-center overflow-hidden">
                        <span className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-bold bg-amber-600 text-white">
                          Popular
                        </span>
                        {test.image ? (
                          <img
                            src={test.image}
                            alt={test.name}
                            className="h-full w-full object-contain p-3 group-hover:scale-105 transition duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-5xl group-hover:scale-105 transition duration-300">
                            {test.icon || '🧪'}
                          </span>
                        )}

                        <div className="absolute inset-0 flex items-start justify-end p-3 pointer-events-none">
                          {test.mrp && test.mrp > test.price && (
                            <span className="text-[11px] font-bold text-emerald-600">
                              {discountPercent(test)}% OFF
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-3 flex flex-col flex-1">
                        <p className="font-medium text-slate-500 mb-1 uppercase tracking-wide text-[10px]">
                          MySanjeevni
                        </p>

                        <h3 className="font-bold text-slate-900 line-clamp-2 mb-2 text-xs min-h-8">
                          {test.name}
                        </h3>

                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1">
                            <span className="text-amber-500">★</span>
                            <span className="text-xs font-semibold text-slate-900">{Number(test.rating || 0).toFixed(1)}</span>
                            <span className="text-xs text-slate-500">({test.reviews || 0})</span>
                          </div>
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">
                            In Stock
                          </span>
                        </div>

                        <div className="mb-2 flex items-end justify-between">
                          <div className="flex items-baseline gap-2">
                            <span className="text-base font-black text-slate-900">₹{test.price}</span>
                            {test.mrp && test.mrp > test.price && (
                              <span className="text-xs text-slate-400 line-through">₹{test.mrp}</span>
                            )}
                          </div>
                          {test.mrp && test.mrp > test.price && (
                            <span className="text-[11px] font-bold text-emerald-600">{discountPercent(test)}% OFF</span>
                          )}
                        </div>

                        <div className="flex gap-2 mt-auto">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/lab-tests/${test._id}`);
                            }}
                            className="flex-1 rounded-lg font-bold transition py-1.5 text-[11px] bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                          >
                            Add to Cart
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openBooking(test);
                            }}
                            className="flex-1 rounded-lg font-bold text-white transition py-1.5 text-[11px] bg-amber-600 hover:bg-amber-700"
                          >
                            Buy Now
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Results Footer */}
                <div className="mt-12 text-center">
                  <p className="text-gray-600 text-sm">
                    Showing {filteredAndSortedTests.length} of {tests.filter(t => t.isActive).length} tests • Certified laboratory partners
                  </p>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === 'bookings' && (
          <>
            {bookings.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">📋</div>
                <p className="text-gray-500 mb-4">No bookings yet.</p>
                <button onClick={() => setActiveTab('tests')} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700">
                  Browse Tests
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={syncProviderStatuses}
                    disabled={syncingBookings}
                    className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 disabled:opacity-50"
                  >
                    {syncingBookings ? 'Syncing...' : 'Sync Provider Status'}
                  </button>
                </div>
                {bookings.map((b) => (
                  <div key={b._id} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{b.testName}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          📅 {new Date(b.collectionDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })} · ⏰ {b.collectionTime}
                        </p>
                        <p className="text-sm text-gray-500">
                          {b.collectionType === 'home' ? '🏠 Home Collection' : '🏥 Centre Visit'} · ₹{b.testPrice}
                        </p>
                        {b.provider && b.provider !== 'local' && (
                          <>
                            <p className="text-xs text-gray-500 mt-1">
                              Provider: {formatProviderName(b.provider)}{b.providerOrderId ? ` • Order ID: ${b.providerOrderId}` : ''}
                            </p>
                            <p className="text-xs text-emerald-700 mt-0.5">
                              Provider Status: {b.providerStatus || 'Pending sync'}
                            </p>
                            <div className="mt-3 p-3 rounded-lg border border-emerald-100 bg-emerald-50/50">
                              <p className="text-[11px] font-semibold text-emerald-800 mb-2">Provider Timeline</p>
                              <div className="flex items-start">
                                {['Booked', 'Collected', 'Processing', 'Report Ready'].map((label, idx) => {
                                  const active = getProviderTimelineStep(b.providerStatus) >= idx;
                                  return (
                                    <div key={label} className="flex-1">
                                      <div className="flex items-center mb-1">
                                        <span
                                          className={`w-3 h-3 rounded-full ${
                                            active ? 'bg-emerald-600' : 'bg-gray-300'
                                          }`}
                                        />
                                        {idx < 3 && (
                                          <span
                                            className={`flex-1 h-0.5 mx-1 ${
                                              getProviderTimelineStep(b.providerStatus) > idx
                                                ? 'bg-emerald-500'
                                                : 'bg-gray-300'
                                            }`}
                                          />
                                        )}
                                      </div>
                                      <p className={`text-[10px] ${active ? 'text-emerald-800 font-semibold' : 'text-gray-500'}`}>
                                        {label}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            {b.providerOrderId && (
                              <button
                                onClick={() => syncSingleBooking(b._id)}
                                disabled={syncingBookingId === b._id}
                                className="inline-block mt-2 text-xs font-semibold bg-white border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-md hover:bg-emerald-50 disabled:opacity-50"
                              >
                                {syncingBookingId === b._id ? 'Refreshing...' : 'Refresh This Booking'}
                              </button>
                            )}
                            {b.reportReady && b.reportUrl && (
                              <a
                                href={b.reportUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                              >
                                View Report
                              </a>
                            )}
                          </>
                        )}
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-600'}`}>
                        {b.status}
                      </span>
                    </div>
                    {b.status !== 'cancelled' && b.status !== 'completed' && (
                      <div className="mt-3">
                        <button
                          onClick={() => cancelBooking(b)}
                          disabled={cancellingBookingId === b._id}
                          className="text-xs font-semibold bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 disabled:opacity-50"
                        >
                          {cancellingBookingId === b._id ? 'Cancelling...' : 'Cancel & Refund'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Booking Modal */}
      {bookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-screen overflow-y-auto">
            <div className="bg-emerald-600 text-white p-5 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">Book Test</h2>
                  <p className="text-emerald-100 text-sm mt-0.5">{bookingModal.name}</p>
                </div>
                <button onClick={() => { setBookingModal(null); setBookingSuccess(false); }} className="text-white/80 hover:text-white text-2xl leading-none">×</button>
              </div>
            </div>
            <div className="p-5">
              {bookingSuccess ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
                  <p className="text-gray-500 text-sm mb-2">Your test has been booked successfully.</p>
                  <p className="text-gray-500 text-sm mb-6">Our team will contact you to confirm the appointment.</p>
                  <button onClick={() => { setBookingModal(null); setBookingSuccess(false); setActiveTab('bookings'); }}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700">
                    View My Bookings
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Test info */}
                  <div className="bg-emerald-50 rounded-lg p-3 flex justify-between">
                    <span className="text-sm text-gray-700 font-medium">{bookingModal.name}</span>
                    <span className="font-bold text-emerald-700">₹{bookingModal.price}</span>
                  </div>

                  {/* Collection type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Collection Type</label>
                    <div className="flex gap-3">
                      {(['home', 'center'] as const).map((type) => (
                        <label key={type} className={`flex-1 flex items-center gap-2 border-2 rounded-lg p-3 cursor-pointer transition ${bookingForm.collectionType === type ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
                          <input type="radio" name="collectionType" value={type} checked={bookingForm.collectionType === type}
                            onChange={(e) => setBookingForm({ ...bookingForm, collectionType: e.target.value as 'home' | 'center' })} className="sr-only" />
                          <span>{type === 'home' ? '🏠 Home Collection' : '🏥 Visit Centre'}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Collection Date <span className="text-red-500">*</span></label>
                    <input type="date" min={todayStr} value={bookingForm.collectionDate}
                      onChange={(e) => setBookingForm({ ...bookingForm, collectionDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  </div>

                  {/* Time slot */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Time <span className="text-red-500">*</span></label>
                    <div className="space-y-2">
                      {TIME_SLOTS.map((slot) => (
                        <label key={slot} className={`flex items-center gap-3 border-2 rounded-lg px-3 py-2 cursor-pointer transition ${bookingForm.collectionTime === slot ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <input type="radio" name="time" value={slot} checked={bookingForm.collectionTime === slot}
                            onChange={(e) => setBookingForm({ ...bookingForm, collectionTime: e.target.value })} className="sr-only" />
                          <span className="text-sm">⏰ {slot}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Address (home only) */}
                  {bookingForm.collectionType === 'home' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Full Address <span className="text-red-500">*</span></label>
                      <textarea rows={3} placeholder="Flat/House No., Street, City, Pincode"
                        value={bookingForm.address} onChange={(e) => setBookingForm({ ...bookingForm, address: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    </div>
                  )}

                  {(bookingForm.testId.startsWith('thyrocare_') || bookingForm.testId.startsWith('healthians_')) && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Pincode <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          maxLength={6}
                          inputMode="numeric"
                          placeholder="6-digit pincode"
                          value={bookingForm.patientPincode}
                          onChange={(e) =>
                            setBookingForm({
                              ...bookingForm,
                              patientPincode: e.target.value.replace(/\D/g, '').slice(0, 6),
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Age <span className="text-red-500">*</span></label>
                          <input
                            type="number"
                            min={0}
                            max={120}
                            placeholder="Years"
                            value={bookingForm.patientAge}
                            onChange={(e) => setBookingForm({ ...bookingForm, patientAge: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Gender <span className="text-red-500">*</span></label>
                          <select
                            value={bookingForm.patientGender}
                            onChange={(e) =>
                              setBookingForm({
                                ...bookingForm,
                                patientGender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER',
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          >
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Notes (optional)</label>
                    <input type="text" placeholder="Any special instructions..."
                      value={bookingForm.notes} onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  </div>

                  {/* Submit */}
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setBookingModal(null)} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-50">
                      Cancel
                    </button>
                    <button onClick={submitBooking} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-semibold transition">
                      Confirm Booking
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

