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
    vendorMedicineType: 'allopathic',
    password: '',
    confirmPassword: '',
    // Doctor specific
    registrationNumber: '',
    doctorStudyPlace: '', // Where Doctor completed his Study
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  type DocumentKey =
    | 'vendorAadhar'
    | 'vendorPan'
    | 'vendorGst'
    | 'vendorDrugLicense'
    | 'doctorAadhar'
    | 'doctorPan'
    | 'doctorRegistrationCertificate';

  const [documents, setDocuments] = useState<Record<DocumentKey, File | null>>({
    vendorAadhar: null,
    vendorPan: null,
    vendorGst: null,
    vendorDrugLicense: null,
    doctorAadhar: null,
    doctorPan: null,
    doctorRegistrationCertificate: null,
  });
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
          studyPlace: formData.role === 'doctor' ? formData.doctorStudyPlace : undefined,
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

  const handleDocumentChange = (key: DocumentKey, file: File | null) => {
    setDocuments((prev) => ({ ...prev, [key]: file }));
  };

  const uploadDocumentToCloudinary = async (
    file: File | null,
    errorMessage: string
  ): Promise<string | null> => {
    if (!file) {
      setError(errorMessage);
      return null;
    }

    setUploadingDocument(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);

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

    // Vendor specific validation
    if (formData.role === 'vendor') {
      if (!documents.vendorAadhar) {
        setError('Aadhar card is mandatory for vendor registration');
        return;
      }
      if (!documents.vendorPan) {
        setError('PAN card is mandatory for vendor registration');
        return;
      }
      const requiresDrugLicense = formData.vendorMedicineType !== 'ayurveda';
      if (requiresDrugLicense && !documents.vendorDrugLicense) {
        setError('Drug license is mandatory for allopathic and homeopathy vendors');
        return;
      }
    }

    // Doctor specific validation
    if (formData.role === 'doctor') {
      if (!formData.registrationNumber.trim()) {
        setError('Registration number is required for doctor registration');
        return;
      }
      if (!documents.doctorAadhar) {
        setError('Aadhar card is mandatory for doctor registration');
        return;
      }
      if (!documents.doctorPan) {
        setError('PAN card is mandatory for doctor registration');
        return;
      }
      if (!documents.doctorRegistrationCertificate) {
        setError('Registration certificate is mandatory for doctor registration');
        return;
      }
    }

    setLoading(true);

    try {
      // Upload documents before signup payload submission
      let vendorAadharCardUrl: string | undefined;
      let vendorPanCardUrl: string | undefined;
      let vendorGstCertificateUrl: string | undefined;
      let vendorDrugLicenseUrl: string | undefined;
      let doctorAadharCardUrl: string | undefined;
      let doctorPanCardUrl: string | undefined;
      let doctorRegistrationCertificateUrl: string | undefined;

      if (formData.role === 'vendor') {
        vendorAadharCardUrl = (await uploadDocumentToCloudinary(
          documents.vendorAadhar,
          'Aadhar card is mandatory for vendor registration'
        )) || undefined;
        if (!vendorAadharCardUrl) {
          setLoading(false);
          return;
        }

        vendorPanCardUrl = (await uploadDocumentToCloudinary(
          documents.vendorPan,
          'PAN card is mandatory for vendor registration'
        )) || undefined;
        if (!vendorPanCardUrl) {
          setLoading(false);
          return;
        }

        if (documents.vendorGst) {
          vendorGstCertificateUrl =
            (await uploadDocumentToCloudinary(documents.vendorGst, 'Failed to upload GST certificate')) ||
            undefined;
        }

        const requiresDrugLicense = formData.vendorMedicineType !== 'ayurveda';
        if (requiresDrugLicense || documents.vendorDrugLicense) {
          vendorDrugLicenseUrl =
            (await uploadDocumentToCloudinary(
              documents.vendorDrugLicense,
              'Drug license is mandatory for allopathic and homeopathy vendors'
            )) || undefined;

          if (requiresDrugLicense && !vendorDrugLicenseUrl) {
            setLoading(false);
            return;
          }
        }
      }

      if (formData.role === 'doctor') {
        doctorAadharCardUrl = (await uploadDocumentToCloudinary(
          documents.doctorAadhar,
          'Aadhar card is mandatory for doctor registration'
        )) || undefined;
        if (!doctorAadharCardUrl) {
          setLoading(false);
          return;
        }

        doctorPanCardUrl = (await uploadDocumentToCloudinary(
          documents.doctorPan,
          'PAN card is mandatory for doctor registration'
        )) || undefined;
        if (!doctorPanCardUrl) {
          setLoading(false);
          return;
        }

        doctorRegistrationCertificateUrl = (await uploadDocumentToCloudinary(
          documents.doctorRegistrationCertificate,
          'Registration certificate is mandatory for doctor registration'
        )) || undefined;
        if (!doctorRegistrationCertificateUrl) {
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
          vendorMedicineType: formData.role === 'vendor' ? formData.vendorMedicineType : undefined,
          vendorAadharCardUrl: formData.role === 'vendor' ? vendorAadharCardUrl : undefined,
          vendorPanCardUrl: formData.role === 'vendor' ? vendorPanCardUrl : undefined,
          vendorGstCertificateUrl: formData.role === 'vendor' ? vendorGstCertificateUrl : undefined,
          vendorDrugLicenseUrl: formData.role === 'vendor' ? vendorDrugLicenseUrl : undefined,
          password: formData.password,
          phoneVerificationToken,
          // Doctor specific
          registrationNumber: formData.role === 'doctor' ? formData.registrationNumber : undefined,
          doctorAadharCardUrl: formData.role === 'doctor' ? doctorAadharCardUrl : undefined,
          doctorPanCardUrl: formData.role === 'doctor' ? doctorPanCardUrl : undefined,
          doctorRegistrationCertificateUrl:
            formData.role === 'doctor' ? doctorRegistrationCertificateUrl : undefined,
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition placeholder:text-gray-600 text-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-gray-900"
                >
                  <option value="user">User</option>
                  <option value="vendor">Vendor</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>

              {formData.role === 'vendor' && (
                <>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-gray-900"
                    >
                      <option value="pharmacy">Pharmacy</option>
                      <option value="clinic">Clinic</option>
                      <option value="hospital">Hospital</option>
                      <option value="lab">Lab</option>
                      <option value="supplier">Supplier</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="vendorMedicineType"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Product Type
                    </label>
                    <select
                      id="vendorMedicineType"
                      name="vendorMedicineType"
                      value={formData.vendorMedicineType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-gray-900"
                    >
                      <option value="allopathic">Allopathic Medicine</option>
                      <option value="homeopathy">Homeopathy Medicine</option>
                      <option value="ayurveda">Ayurveda Products</option>
                      <option value="mixed">Mixed (Allopathic/Homeopathy/Ayurveda)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Drug license is mandatory for allopathic/homeopathy, optional for ayurveda-only vendors.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aadhar Card *
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleDocumentChange('vendorAadhar', e.target.files?.[0] || null)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PAN Card *
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleDocumentChange('vendorPan', e.target.files?.[0] || null)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GST Certificate (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleDocumentChange('vendorGst', e.target.files?.[0] || null)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Drug License {formData.vendorMedicineType === 'ayurveda' ? '(Optional)' : '*'}
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleDocumentChange('vendorDrugLicense', e.target.files?.[0] || null)}
                      required={formData.vendorMedicineType !== 'ayurveda'}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                </>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition placeholder:text-gray-600 text-gray-900"
                      placeholder="e.g., MCI-12345 or NMC-00123"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter your medical council registration number
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="doctorStudyPlace"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Where did you complete your study? *
                    </label>
                    <input
                      type="text"
                      id="doctorStudyPlace"
                      name="doctorStudyPlace"
                      value={formData.doctorStudyPlace}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition placeholder:text-gray-600 text-gray-900"
                      placeholder="e.g., AIIMS Delhi, CMC Vellore, etc."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the name of the college/university/institute where you completed your medical study
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="doctorAadhar"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Aadhar Card *
                    </label>
                    <input
                      type="file"
                      id="doctorAadhar"
                      accept="image/*,.pdf"
                      onChange={(e) => handleDocumentChange('doctorAadhar', e.target.files?.[0] || null)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="doctorPan"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      PAN Card *
                    </label>
                    <input
                      type="file"
                      id="doctorPan"
                      accept="image/*,.pdf"
                      onChange={(e) => handleDocumentChange('doctorPan', e.target.files?.[0] || null)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="doctorRegistrationCertificate"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Registration Certificate *
                    </label>
                    <input
                      type="file"
                      id="doctorRegistrationCertificate"
                      accept="image/*,.pdf"
                      onChange={(e) =>
                        handleDocumentChange('doctorRegistrationCertificate', e.target.files?.[0] || null)
                      }
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    />
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition placeholder:text-gray-600 text-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition placeholder:text-gray-600 text-gray-900"
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
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition placeholder:text-gray-600 text-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition placeholder:text-gray-600 text-gray-900"
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
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition placeholder:text-gray-600 text-gray-900"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 focus:outline-none"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-4.753 4.753m4.753-4.753L3.3 3.3m9.943 9.943L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition placeholder:text-gray-600 text-gray-900"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 focus:outline-none"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-4.753 4.753m4.753-4.753L3.3 3.3m9.943 9.943L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
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
