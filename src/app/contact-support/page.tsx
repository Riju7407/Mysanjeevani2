'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

type InquiryCategory = 'general' | 'order' | 'account' | 'payment' | 'doctor' | 'other';

export default function ContactSupportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '';

  const [category, setCategory] = useState<InquiryCategory>(orderId ? 'order' : 'general');
  const [subject, setSubject] = useState(orderId ? `Order support needed: ${orderId}` : '');
  const [message, setMessage] = useState(
    orderId
      ? `Hi team, I need help with my order ${orderId}.\n\nIssue details:`
      : ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');

  const isValid = useMemo(() => subject.trim().length >= 5 && message.trim().length >= 10, [subject, message]);

  const submitInquiry = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback('');

    const rawUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!rawUser || !token) {
      setFeedbackType('error');
      setFeedback('Please login first to contact support.');
      router.push('/login?redirect=/contact-support');
      return;
    }

    let user: any = null;
    try {
      user = JSON.parse(rawUser);
    } catch {
      setFeedbackType('error');
      setFeedback('Your session is invalid. Please login again.');
      return;
    }

    const userId = String(user?.id || user?._id || '').trim();
    const userName = String(user?.fullName || user?.name || '').trim();
    const userEmail = String(user?.email || '').trim();
    const userRole = String(user?.role || 'user').trim();

    if (!userId || !userName || !userEmail) {
      setFeedbackType('error');
      setFeedback('Profile details are missing. Please login again.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-user-name': userName,
          'x-user-email': userEmail,
          'x-user-role': userRole,
        },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setFeedbackType('error');
        setFeedback(data.error || 'Failed to submit support request.');
        return;
      }

      setFeedbackType('success');
      setFeedback('Support request submitted successfully. Our team will contact you soon.');
      setSubject(orderId ? `Order support needed: ${orderId}` : '');
      setMessage(orderId ? `Hi team, I need help with my order ${orderId}.\n\nIssue details:` : '');
      setCategory(orderId ? 'order' : 'general');
    } catch {
      setFeedbackType('error');
      setFeedback('Something went wrong while submitting your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8">
          <h1 className="text-3xl font-bold text-slate-900">Contact Support</h1>
          <p className="text-slate-600 mt-2">
            Raise a support request and our team will help you as soon as possible.
          </p>

          {orderId && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 text-sm">
              Linked order id: <span className="font-semibold">{orderId}</span>
            </div>
          )}

          <form onSubmit={submitInquiry} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as InquiryCategory)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="general">General</option>
                <option value="order">Order</option>
                <option value="account">Account</option>
                <option value="payment">Payment</option>
                <option value="doctor">Doctor Consultation</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Write a short subject"
                maxLength={120}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue in detail"
                rows={7}
                maxLength={2000}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {feedback && (
              <div
                className={`rounded-lg px-4 py-3 text-sm ${
                  feedbackType === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {feedback}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting || !isValid}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/orders')}
                className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-6 py-2.5 rounded-lg"
              >
                Back to Orders
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
