'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogoImage } from '@/components/Logo';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    fullAddress: '',
    role: 'user',
    businessType: 'pharmacy',
    password: '',
    confirmPassword: '',
    // Doctor specific
    registrationNumber: '',
    identityDocumentType: 'medical-license',
  });

  const [identityDocument, setIdentityDocument] = useState<File | null>(null);
  const [identityDocumentPreview, setIdentityDocumentPreview] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [phoneVerificationToken, setPhoneVerificationToken] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldownSeconds, setOtpCooldownSeconds] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (otpCooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setOtpCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [otpCooldownSeconds]);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone: string) => /^\d{10}$/.test(phone);

  const resetOtpState = () => {
    setOtp('');
    setOtpSent(false);
    setOtpVerified(false);
    setPhoneVerificationToken('');
    setOtpCooldownSeconds(0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value;
    if (name === 'phone') {
      resetOtpState();
    }
    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
  };

  const handleSendOtp = async () => {
    setError('');

    const normalizedPhone = formData.phone.replace(/\D/g, '').trim();
    const normalizedEmail = formData.email.trim().toLowerCase();

    if (!formData.fullName.trim()) {
      setError('Full name is required before sending OTP');
      return;
    }

    if (!isValidPhone(normalizedPhone)) {
      setError('Please enter a valid 10-digit phone number before sending OTP');
      return;
    }

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      setError('Please enter a valid email address before sending OTP');
      return;
    }

    setOtpLoading(true);
    try {
      const response = await fetch('/api/auth/phone/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          fullName: formData.fullName.trim(),
          email: normalizedEmail,
          role: formData.role,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to send OTP');
        return;
      }

      setOtpSent(true);
      setOtpVerified(false);
      setOtp('');
      setOtpCooldownSeconds(Number(data.cooldownSeconds) || 60);
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    const normalizedPhone = formData.phone.replace(/\D/g, '').trim();

    if (!isValidPhone(normalizedPhone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setOtpLoading(true);
    try {
      const response = await fetch('/api/auth/phone/verify-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          otp,
          role: formData.role,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'OTP verification failed');
        return;
      }

      setOtpVerified(true);
      setPhoneVerificationToken(data.phoneVerificationToken || '');
      setError('');
    } catch (err) {
      setError('OTP verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdentityDocument(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdentityDocumentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadDocumentToCloudinary = async (): Promise<string | null> => {
    if (!identityDocument) {
      setError('Identity document is required for doctor registration');
      return null;
    }

    setUploadingDocument(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', identityDocument);

      const response = await fetch('/api/doctor/upload-document', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to upload document');
        return null;
      }

      return data.url;
    } catch (err) {
      setError('Failed to upload document');
      return null;
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = formData.email.trim().toLowerCase();
    const normalizedPhone = formData.phone.replace(/\D/g, '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!normalizedEmail) {
      setError('Email address is required');
      return;
    }

    if (!emailRegex.test(normalizedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!normalizedPhone) {
      setError('Phone number is required');
      return;
    }

    if (!phoneRegex.test(normalizedPhone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    if (!otpVerified) {
      setError('Please verify your phone number using OTP before creating your account');
      return;
    }

    if (!phoneVerificationToken) {
      setError('Phone verification session expired. Please verify OTP again');
      return;
    }

    if (!formData.fullAddress.trim()) {
      setError('Full address is required');
      return;
    }

    // Doctor specific validation
    if (formData.role === 'doctor') {
      if (!formData.registrationNumber.trim()) {
        setError('Registration number is required for doctor registration');
        return;
      }
      if (!identityDocument) {
        setError('Identity document is required for doctor registration');
        return;
      }
    }

    setLoading(true);

    try {
      // Upload document first if doctor
      let documentUrl: string | undefined;
      if (formData.role === 'doctor') {
        documentUrl = (await uploadDocumentToCloudinary()) || undefined;
        if (!documentUrl) {
          setLoading(false);
          return;
        }
      }

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: normalizedEmail,
          phone: normalizedPhone,
          fullAddress: formData.fullAddress,
          role: formData.role,
          businessType: formData.role === 'vendor' ? formData.businessType : undefined,
          password: formData.password,
          phoneVerificationToken,
          // Doctor specific
          registrationNumber: formData.role === 'doctor' ? formData.registrationNumber : undefined,
          identityDocumentUrl: formData.role === 'doctor' ? documentUrl : undefined,
          identityDocumentType: formData.role === 'doctor' ? formData.identityDocumentType : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        return;
      }

      if (data.pendingApproval && (formData.role === 'vendor' || formData.role === 'doctor')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        const roleLabel = formData.role === 'vendor' ? 'Vendor' : 'Doctor';
        alert(`${roleLabel} registration submitted successfully. Your account is pending admin approval. Please login after approval.`);
        router.push(formData.role === 'vendor' ? '/vendor/login' : '/login');
        return;
      }

      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to login
      router.push('/login');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {/* Signup Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="h-24 w-24">
                  <LogoImage />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-2">
                <span className="text-emerald-600">My</span><span className="text-orange-500">Sanjeevani</span>
              </h1>
              <p className="text-gray-600 text-sm">Join India's Trusted Healthcare Platform</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name Field */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  placeholder="John Doe"
                />
              </div>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Register As
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                >
                  <option value="user">User</option>
                  <option value="vendor">Vendor</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>

              {formData.role === 'vendor' && (
                <div>
                  <label
                    htmlFor="businessType"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Business Type
                  </label>
                  <select
                    id="businessType"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  >
                    <option value="pharmacy">Pharmacy</option>
                    <option value="clinic">Clinic</option>
                    <option value="hospital">Hospital</option>
                    <option value="lab">Lab</option>
                    <option value="supplier">Supplier</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}

              {/* Doctor specific fields */}
              {formData.role === 'doctor' && (
                <>
                  <div>
                    <label
                      htmlFor="registrationNumber"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Medical Registration Number *
                    </label>
                    <input
                      type="text"
                      id="registrationNumber"
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                      placeholder="e.g., MCI-12345 or NMC-00123"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter your medical council registration number
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="identityDocumentType"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Document Type *
                    </label>
                    <select
                      id="identityDocumentType"
                      name="identityDocumentType"
                      value={formData.identityDocumentType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    >
                      <option value="medical-license">Medical License</option>
                      <option value="doctor-id">Doctor ID</option>
                      <option value="nmc-registration">NMC Registration</option>
                      <option value="other">Other (Provide details)</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="identityDocument"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Upload Identity Document *
                    </label>
                    <input
                      type="file"
                      id="identityDocument"
                      accept="image/*,.pdf"
                      onChange={handleDocumentChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload medical license, doctor ID, or NMC registration (Image or PDF)
                    </p>
                    {identityDocumentPreview && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-700 mb-2">Preview:</p>
                        <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                          {identityDocumentPreview.includes('data:image') ? (
                            <img
                              src={identityDocumentPreview}
                              alt="Document preview"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                              PDF Document Selected
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  placeholder="your@email.com"
                />
              </div>

              {/* Phone Field */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  autoComplete="tel"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  placeholder="9876543210"
                />
              </div>

              {/* OTP Verification */}
              <div className="space-y-3 rounded-lg border border-gray-200 p-4 bg-gray-50">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading || otpCooldownSeconds > 0 || otpVerified}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
                  >
                    {otpLoading ? 'Sending...' : otpVerified ? 'Phone Verified' : otpSent ? 'Resend OTP' : 'Send OTP'}
                  </button>
                  {otpCooldownSeconds > 0 && !otpVerified && (
                    <span className="text-xs text-gray-600 self-center">Resend in {otpCooldownSeconds}s</span>
                  )}
                </div>

                {otpSent && !otpVerified && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      inputMode="numeric"
                      placeholder="Enter 6-digit OTP"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpLoading || otp.length !== 6}
                      className="px-4 py-2 border border-emerald-600 text-emerald-700 rounded-lg hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
                    >
                      {otpLoading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                )}

                {otpVerified && (
                  <p className="text-sm text-emerald-700 font-medium">Phone number verified successfully.</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="fullAddress"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Full Address
                </label>
                <input
                  type="text"
                  id="fullAddress"
                  name="fullAddress"
                  value={formData.fullAddress}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  placeholder="House/Flat, Street, City, State, Pincode"
                />
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                />
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || uploadingDocument || !otpVerified}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
              >
                {loading || uploadingDocument ? 'Processing...' : 'Create Account'}
              </button>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-gray-600 text-sm">
                  Already have an account?{' '}
                  <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                    Login here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
