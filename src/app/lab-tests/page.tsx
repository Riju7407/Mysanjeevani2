'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  createdAt: string;
}

interface BookingForm {
  testId: string;
  testName: string;
  testPrice: number;
  collectionType: 'home' | 'center';
  collectionDate: string;
  collectionTime: string;
  address: string;
  notes: string;
}

const CATEGORIES = ['all', 'general', 'diabetic', 'cardiac', 'thyroid', 'liver', 'kidney', 'vitamin', 'infection', 'womens-health'];

const CATEGORY_LABELS: Record<string, string> = {
  all: '🔍 All Tests', general: '🧪 General', diabetic: '🩸 Diabetes', cardiac: '❤️ Cardiac', thyroid: '🦋 Thyroid',
  liver: '🫘 Liver', kidney: '💧 Kidney', vitamin: '☀️ Vitamins', infection: '🦠 Infection', 'womens-health': '💜 Women',
};

const TIME_SLOTS = ['7:00 AM – 9:00 AM', '9:00 AM – 11:00 AM', '11:00 AM – 1:00 PM', '2:00 PM – 4:00 PM', '4:00 PM – 6:00 PM'];

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

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
  const [activeTab, setActiveTab] = useState<'tests' | 'bookings'>('tests');
  const [tests, setTests] = useState<LabTest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [bookingModal, setBookingModal] = useState<LabTest | null>(null);
  const [bookingForm, setBookingForm] = useState<BookingForm>({ testId: '', testName: '', testPrice: 0, collectionType: 'home', collectionDate: '', collectionTime: '', address: '', notes: '' });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [seeding, setSeeding] = useState(false);

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
      if (!token) return;
      const res = await fetch('/api/lab-test-bookings', { headers: { Authorization: `Bearer ${token}` } });
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
  useEffect(() => { if (activeTab === 'bookings') fetchBookings(); }, [activeTab, fetchBookings]);

  const openBooking = (test: LabTest) => {
    const token = localStorage.getItem('token');
    if (!token) {
      redirectToLogin();
      return;
    }

    setBookingForm({ testId: test._id, testName: test.name, testPrice: test.price, collectionType: 'home', collectionDate: '', collectionTime: '', address: '', notes: '' });
    setBookingModal(test);
    setBookingSuccess(false);
  };

  const submitBooking = async () => {
    try {
      const token = localStorage.getItem('token');
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      if (!token) { alert('Please login to book a test.'); return; }
      if (!bookingForm.collectionDate || !bookingForm.collectionTime) { alert('Please select collection date and time.'); return; }
      if (bookingForm.collectionType === 'home' && !bookingForm.address) { alert('Please enter your address for home collection.'); return; }

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
        name: 'MySanjeevani',
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
          const res = await fetch('/api/lab-test-bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              ...bookingForm,
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Hero */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-10">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-extrabold mb-2">🧪 Book Lab Tests at Home</h1>
          <p className="text-emerald-100 text-lg mb-4">Free sample collection · ISO certified labs · Reports in 24-48 hrs</p>
          <div className="flex flex-wrap gap-4 text-sm">
            {[['🏠', 'Free Home Collection'], ['⚡', 'Quick Reports'], ['💯', 'Accurate Results'], ['🔒', 'Secure & Private']].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                <span>{icon}</span><span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-0">
            {['tests', 'bookings'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as 'tests' | 'bookings')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition ${activeTab === tab ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab === 'tests' ? '🔬 Browse Tests' : '📋 My Bookings'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {activeTab === 'tests' && (
          <>
            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input type="text" placeholder="Search tests..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              <button onClick={fetchTests} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition">Search</button>
              {tests.length === 0 && !loading && (
                <button onClick={seedTests} disabled={seeding}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition disabled:opacity-60">
                  {seeding ? 'Loading...' : '+ Load Sample Tests'}
                </button>
              )}
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${category === cat ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-400'}`}>
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-20 text-gray-400">Loading tests...</div>
            ) : tests.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🧪</div>
                <p className="text-gray-500 mb-4">No tests found. Click &ldquo;Load Sample Tests&rdquo; to add tests to the database.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                {tests.map((test) => (
                  <article
                    key={test._id}
                    className="group h-full w-full max-w-72 mx-auto bg-white/95 border border-slate-300 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300 cursor-pointer flex flex-col"
                    onClick={() => setBookingModal(test)}
                  >
                    <div className="relative bg-linear-to-br from-white to-slate-50 h-44 flex items-center justify-center overflow-hidden">
                      <span className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-bold bg-violet-600 text-white">
                        Popular
                      </span>
                      {test.image ? (
                        <img
                          src={test.image}
                          alt={test.name}
                          className="h-full w-full object-contain p-4 group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="text-5xl">{test.icon || '🔬'}</div>
                      )}
                    </div>

                    <div className="p-4 flex flex-col flex-1">
                      <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">MySanjeevani</p>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 min-h-10 mb-2">{test.name}</h3>

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <span className="text-amber-500">★</span>
                          <span className="text-xs font-semibold text-slate-900">{Number(test.rating || 0).toFixed(1)}</span>
                          <span className="text-xs text-slate-500">({test.reviews || 0})</span>
                        </div>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            test.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {test.isActive ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>

                      {test.description && (
                        <p className="text-xs text-slate-600 mb-2 line-clamp-2">"{test.description}"</p>
                      )}

                      <div className="mb-3 flex items-end justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-slate-900">₹{test.price}</span>
                          {test.mrp && test.mrp > test.price && (
                            <span className="text-xs text-slate-400 line-through">₹{test.mrp}</span>
                          )}
                        </div>
                        {test.mrp && test.mrp > test.price && (
                          <span className="text-xs font-bold text-emerald-600">{discountPercent(test)}% OFF</span>
                        )}
                      </div>

                      <div className="flex gap-2 mt-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setBookingModal(test);
                          }}
                          disabled={!test.isActive}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                            !test.isActive
                              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          View Details
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openBooking(test);
                          }}
                          disabled={!test.isActive}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold text-white transition ${
                            !test.isActive ? 'bg-slate-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700'
                          }`}
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
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
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-600'}`}>
                        {b.status}
                      </span>
                    </div>
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

