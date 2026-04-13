'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  maxPatients: number;
  isActive: boolean;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DEPARTMENTS = [
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

export default function DoctorProfileSetup() {
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const [formData, setFormData] = useState({
    department: 'General Medicine',
    specialization: '',
    experience: 0,
    qualification: '',
    bio: '',
    consultationFee: 500,
  });

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(
    DAYS.map((day) => ({
      day,
      startTime: '09:00',
      endTime: '17:00',
      maxPatients: 20,
      isActive: true,
    }))
  );

  useEffect(() => {
    checkApprovalStatus();
  }, []);

  const checkApprovalStatus = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login');
        return;
      }

      const user = JSON.parse(userStr);
      if (user.role !== 'doctor') {
        router.push('/');
        return;
      }

      // Check if doctor is approved
      const res = await fetch(`/api/doctor/check-approval?userId=${user.id}`);
      const data = await res.json();

      if (data.isApproved) {
        setIsApproved(true);
        // Load existing profile if available
        if (data.doctor) {
          if (data.doctor.department) setFormData((prev) => ({ ...prev, department: data.doctor.department }));
          if (data.doctor.specialization) setFormData((prev) => ({ ...prev, specialization: data.doctor.specialization }));
          if (data.doctor.experience) setFormData((prev) => ({ ...prev, experience: data.doctor.experience }));
          if (data.doctor.qualification) setFormData((prev) => ({ ...prev, qualification: data.doctor.qualification }));
          if (data.doctor.bio) setFormData((prev) => ({ ...prev, bio: data.doctor.bio }));
          if (data.doctor.consultationFee !== undefined) setFormData((prev) => ({ ...prev, consultationFee: data.doctor.consultationFee }));
          if (data.doctor.timeSlots) setTimeSlots(data.doctor.timeSlots);
        }
      } else {
        setError('Your account is still pending approval. Please wait for admin approval.');
      }
    } catch (err) {
      console.error('Error checking approval status:', err);
      setError('Failed to load your approval status');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'experience' || name === 'consultationFee' ? parseInt(value) : value,
    }));
  };

  const handleTimeSlotChange = (index: number, field: string, value: any) => {
    const newSlots = [...timeSlots];
    newSlots[index] = {
      ...newSlots[index],
      [field]: field === 'maxPatients' ? parseInt(value) : field === 'isActive' ? !newSlots[index].isActive : value,
    };
    setTimeSlots(newSlots);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      const res = await fetch('/api/doctor/profile-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          userId: user?.id,
          ...formData,
          timeSlots,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to save profile');
        return;
      }

      alert('Profile setup completed successfully!');
      router.push('/doctor/panel');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          Loading...
        </div>
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
              <h1 className="text-2xl font-bold text-yellow-900 mb-4">Pending Approval</h1>
              <p className="text-yellow-800 mb-6">
                Your doctor registration is pending admin approval. Once approved, you'll be able to set up your profile and start consulting with patients.
              </p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <div className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Doctor Profile</h1>
            <p className="text-gray-600">Set up your professional details and availability</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-8">
            {/* Professional Details Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Professional Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Specialization */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization *
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Cardiac Surgery, Pediatric Care"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience *
                  </label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* Qualification */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qualification *
                  </label>
                  <input
                    type="text"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., MBBS, MD, DM"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* Consultation Fee */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consultation Fee (₹) *
                  </label>
                  <input
                    type="number"
                    name="consultationFee"
                    value={formData.consultationFee}
                    onChange={handleInputChange}
                    min="0"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professional Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Write a brief bio about yourself, your expertise, and approach to patient care..."
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
                />
              </div>

            </div>

            {/* Availability Section */}
            <div className="border-t pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Availability & Time Slots</h2>
              <p className="text-sm text-gray-600 mb-6">
                Set your availability and maximum patients per time slot
              </p>

              <div className="space-y-4">
                {timeSlots.map((slot, index) => (
                  <div key={slot.day} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-24">
                        <label className="block text-sm font-medium text-gray-700">{slot.day}</label>
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">Start Time</label>
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => handleTimeSlotChange(index, 'startTime', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-gray-600 block mb-1">End Time</label>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => handleTimeSlotChange(index, 'endTime', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-gray-600 block mb-1">Max Patients</label>
                          <input
                            type="number"
                            value={slot.maxPatients}
                            onChange={(e) => handleTimeSlotChange(index, 'maxPatients', e.target.value)}
                            min="1"
                            max="100"
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex items-end">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={slot.isActive}
                            onChange={(e) => handleTimeSlotChange(index, 'isActive', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-gray-700">Active</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="border-t pt-8 flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/doctor/panel')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Skip for Now
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                {saving ? 'Saving...' : 'Complete Profile Setup'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
