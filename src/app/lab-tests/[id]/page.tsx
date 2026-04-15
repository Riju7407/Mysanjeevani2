'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/hooks/useAuth';
import { OTPVerificationModal } from '@/components/OTPVerificationModal';

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
  isActive: boolean;
  homeCollectionAvailable?: boolean;
  centerCollectionAvailable?: boolean;
  sampleType?: string;
  reportTime?: string;
  fasting?: boolean;
  fastingHours?: number;
  testsIncluded?: string;
  createdAt?: string;
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

const TIME_SLOTS = [
  '7:00 AM – 9:00 AM',
  '9:00 AM – 11:00 AM',
  '11:00 AM – 1:00 PM',
  '2:00 PM – 4:00 PM',
  '4:00 PM – 6:00 PM',
];

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, callback: (response: any) => void) => void;
    };
  }
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

export default function LabTestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuth();
  const testId = params.id as string;

  const [test, setTest] = useState<LabTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [isOTPVerified, setIsOTPVerified] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    testId: testId,
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

  useEffect(() => {
    fetchTestDetails();
  }, [testId]);

  const fetchTestDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/lab-tests/${testId}`);
      if (!response.ok) {
        throw new Error('Lab test not found');
      }
      const data = await response.json();
      setTest(data.test);
      setBookingForm((prev) => ({
        ...prev,
        testId: data.test._id,
        testName: data.test.name,
        testPrice: data.test.price,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load test details');
    } finally {
      setLoading(false);
    }
  };

  const redirectToLogin = () => {
    const returnTo = `/lab-tests/${testId}`;
    router.push(`/login?redirect=${encodeURIComponent(returnTo)}`);
  };

  const openBooking = () => {
    if (!isAuthenticated) {
      redirectToLogin();
      return;
    }
    if (!bookingForm.collectionDate || !bookingForm.collectionTime) {
      alert('Please select date and time');
      return;
    }
    setIsOTPVerified(false);
    setShowBookingForm(true);
  };

  const handleBooking = async () => {
    // First check if OTP is verified
    if (!isOTPVerified) {
      setShowOTPModal(true);
      return;
    }

    if (!isAuthenticated || !token) {
      redirectToLogin();
      return;
    }

    if (bookingForm.testId.startsWith('thyrocare_') || bookingForm.testId.startsWith('healthians_')) {
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

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Failed to load payment gateway');
        return;
      }

      const orderResponse = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: bookingForm.testPrice,
          currency: 'INR',
          description: `Lab Test: ${bookingForm.testName}`,
          receipt: `lab_test_${bookingForm.testId}_${Date.now()}`,
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const orderData = await orderResponse.json();

      if (!orderData.success || !orderData.order) {
        throw new Error(orderData.error || 'Invalid order response from server');
      }

      // Validate user data before opening checkout
      if (!user?.email || !user?.email.includes('@')) {
        throw new Error('Invalid email address. Please update your profile.');
      }

      if (!user?.phone || user.phone.length < 10) {
        throw new Error('Invalid phone number. Please update your profile.');
      }

      const razorpay = new (window.Razorpay as any)({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: orderData.order.id,
        amount: orderData.order.amount,
        currency: 'INR',
        name: 'MySanjeevni Lab Tests',
        description: `Lab Test Booking: ${bookingForm.testName}`,
        prefill: {
          name: user.fullName || 'User',
          email: user.email,
          contact: user.phone,
        },
        theme: { 
          color: '#059669',
          hide_topbar: false,
        },
        timeout: 900,
        retry: {
          enabled: true,
          max_count: 3,
        },
        handler: async (paymentResponse: any) => {
          const storedUserRaw = localStorage.getItem('user');
          const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
          const userId = String(storedUser?.id || storedUser?._id || '').trim();
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
            setShowBookingForm(false);
            setTimeout(() => {
              router.push('/lab-tests?tab=bookings');
            }, 2000);
          } else {
            const data = await res.json();
            alert(data.error || 'Failed to book test after payment');
          }
        },
      });

      razorpay.on('payment.failed', (failure: any) => {
        console.error('Razorpay payment failed:', failure);
        const errorCode = failure?.error?.code;
        const errorDescription = failure?.error?.description;
        
        let userMessage = 'Payment failed. ';
        
        if (errorCode === 'BAD_REQUEST_ERROR') {
          userMessage = 'Payment request invalid. Please check your card details and try again.';
        } else if (errorCode === 'GATEWAY_ERROR') {
          userMessage = 'Payment gateway error. Please try again in a moment.';
        } else if (errorCode === 'SERVER_ERROR') {
          userMessage = 'Our payment server is temporarily unavailable. Please try again later.';
        } else if (errorDescription) {
          userMessage += errorDescription;
        } else {
          userMessage += 'Please try again or contact support.';
        }
        
        alert(userMessage);
      });

      razorpay.open();
    } catch (err) {
      console.error('Booking error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error booking test';
      alert(`${errorMessage}\n\nPlease check your details and try again.`);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const discountPercent = test && test.mrp && test.mrp > test.price ? Math.round(((test.mrp - test.price) / test.mrp) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">⏳</div>
            <p className="text-gray-500">Loading test details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">❌</div>
            <p className="text-gray-500 mb-4">{error || 'Lab test not found'}</p>
            <button
              onClick={() => router.back()}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700"
            >
              Go Back
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
          >
            ← Back to Lab Tests
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Image & Info */}
          <div className="lg:col-span-2">
            {/* Header with Badge */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full mb-3">
                    {test.category || 'General Test'}
                  </span>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{test.name}</h1>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span className="text-2xl">★</span>
                      <span className="text-xl font-bold text-gray-900">{Number(test.rating || 0).toFixed(1)}</span>
                      <span className="text-gray-500">({test.reviews || 0} reviews)</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${test.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {test.isActive ? '✓ Available' : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Image Section */}
              <div className="bg-linear-to-br from-emerald-50 to-teal-50 rounded-lg p-8 mb-6 h-64 flex items-center justify-center">
                {test.image ? (
                  <img
                    src={test.image}
                    alt={test.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="text-8xl">{test.icon || '🧪'}</div>
                )}
              </div>

              {/* Price Section */}
              <div className="bg-emerald-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Price</p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-bold text-emerald-700">₹{test.price}</span>
                      {test.mrp && test.mrp > test.price && (
                        <>
                          <span className="text-lg text-gray-400 line-through">₹{test.mrp}</span>
                          <span className="text-2xl font-bold text-red-600">{discountPercent}% OFF</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-6xl">💚</div>
                </div>
              </div>

              {/* Description */}
              {test.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">About This Test</h3>
                  <p className="text-gray-700 leading-relaxed">{test.description}</p>
                </div>
              )}
            </div>

            {/* Test Details Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Test Details</h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {test.sampleType && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-gray-600 text-sm mb-1">Sample Type</p>
                    <p className="text-blue-900 font-semibold text-lg capitalize">{test.sampleType}</p>
                  </div>
                )}

                {test.reportTime && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-gray-600 text-sm mb-1">Report Time</p>
                    <p className="text-purple-900 font-semibold text-lg">{test.reportTime}</p>
                  </div>
                )}

                {test.fasting !== undefined && (
                  <div className={`rounded-lg p-4 ${test.fasting ? 'bg-orange-50' : 'bg-green-50'}`}>
                    <p className="text-gray-600 text-sm mb-1">Fasting Required</p>
                    <p className={`font-semibold text-lg ${test.fasting ? 'text-orange-900' : 'text-green-900'}`}>
                      {test.fasting ? (
                        <>
                          Yes - {test.fastingHours || 8} hours
                        </>
                      ) : (
                        'No Fasting Required'
                      )}
                    </p>
                  </div>
                )}

                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-gray-600 text-sm mb-1">Sample Collection</p>
                  <p className="text-gray-900 font-semibold">
                    {test.homeCollectionAvailable && test.centerCollectionAvailable
                      ? '🏠 Home & 🏥 Center'
                      : test.homeCollectionAvailable
                      ? '🏠 Home Only'
                      : '🏥 Center Only'}
                  </p>
                </div>
              </div>

              {/* Tests Included */}
              {test.testsIncluded && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-bold text-amber-900 mb-2">Tests Included</h4>
                  <p className="text-amber-800 text-sm">{test.testsIncluded}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-20">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Book This Test</h3>

              {bookingSuccess ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">✅</div>
                  <h4 className="text-xl font-bold text-green-600 mb-2">Booking Successful!</h4>
                  <p className="text-gray-600 text-sm mb-4">Your test booking has been confirmed.</p>
                  <button
                    onClick={() => router.push('/lab-tests?tab=bookings')}
                    className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition"
                  >
                    View My Bookings
                  </button>
                </div>
              ) : !showBookingForm ? (
                <div className="space-y-4">
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <p className="text-gray-600 text-sm mb-1">Total Price</p>
                    <p className="text-2xl font-bold text-emerald-700">₹{test.price}</p>
                  </div>

                  <button
                    onClick={openBooking}
                    disabled={!test.isActive}
                    className={`w-full py-3 rounded-lg font-bold text-white transition ${
                      test.isActive
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {test.isActive ? 'Book Now' : 'Out of Stock'}
                  </button>

                  <div className="space-y-2 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <span>✓</span> Free home collection
                    </p>
                    <p className="flex items-center gap-2">
                      <span>✓</span> Secure & private
                    </p>
                    <p className="flex items-center gap-2">
                      <span>✓</span> 24-48 hrs report
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Collection Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Collection Type
                    </label>
                    <div className="space-y-2">
                      {(['home', 'center'] as const).map((type) => (
                        <label
                          key={type}
                          className={`flex items-center gap-3 border-2 rounded-lg px-3 py-2 cursor-pointer transition ${
                            bookingForm.collectionType === type
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="collectionType"
                            value={type}
                            checked={bookingForm.collectionType === type}
                            onChange={(e) =>
                              setBookingForm({
                                ...bookingForm,
                                collectionType: e.target.value as 'home' | 'center',
                              })
                            }
                            className="sr-only"
                          />
                          <span className="text-sm font-medium text-gray-900">
                            {type === 'home' ? '🏠 Home Collection' : '🏥 Visit Centre'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Collection Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      min={todayStr}
                      value={bookingForm.collectionDate}
                      onChange={(e) =>
                        setBookingForm({
                          ...bookingForm,
                          collectionDate: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>

                  {/* Time Slot */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Collection Time <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={bookingForm.collectionTime}
                      onChange={(e) =>
                        setBookingForm({
                          ...bookingForm,
                          collectionTime: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    >
                      <option value="">Select time slot</option>
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Address */}
                  {bookingForm.collectionType === 'home' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        placeholder="Enter your home address"
                        value={bookingForm.address}
                        onChange={(e) =>
                          setBookingForm({
                            ...bookingForm,
                            address: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        rows={3}
                      />
                    </div>
                  )}

                  {(bookingForm.testId.startsWith('thyrocare_') || bookingForm.testId.startsWith('healthians_')) && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Pincode <span className="text-red-500">*</span>
                        </label>
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
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Age <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={120}
                            placeholder="Years"
                            value={bookingForm.patientAge}
                            onChange={(e) =>
                              setBookingForm({
                                ...bookingForm,
                                patientAge: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Gender <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={bookingForm.patientGender}
                            onChange={(e) =>
                              setBookingForm({
                                ...bookingForm,
                                patientGender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER',
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      placeholder="e.g., Please come after 9 AM, any allergies, etc."
                      value={bookingForm.notes}
                      onChange={(e) =>
                        setBookingForm({
                          ...bookingForm,
                          notes: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      rows={2}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowBookingForm(false)}
                      className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleBooking}
                      disabled={!bookingForm.collectionDate || !bookingForm.collectionTime}
                      className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      {isOTPVerified ? 'Confirm Booking' : 'Verify OTP & Book'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* OTP VERIFICATION MODAL */}
      <OTPVerificationModal
        isOpen={showOTPModal}
        userPhone={user?.phone || ''}
        onVerifySuccess={() => {
          setIsOTPVerified(true);
          setShowOTPModal(false);
        }}
        onClose={() => setShowOTPModal(false)}
      />
    </div>
  );
}
