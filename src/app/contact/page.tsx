'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface SessionUser {
  id?: string;
  _id?: string;
  fullName?: string;
  email?: string;
  role?: string;
}

export default function ContactPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const userRaw = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userRaw || !token) {
      setIsLoggedIn(false);
      setUser(null);
      return;
    }

    try {
      const parsed = JSON.parse(userRaw);
      setUser(parsed);
      setIsLoggedIn(true);
    } catch {
      setIsLoggedIn(false);
      setUser(null);
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormMessage('');

    if (!isLoggedIn || !user) {
      setFormError('Please login to submit an inquiry.');
      return;
    }

    if (!subject.trim() || !message.trim()) {
      setFormError('Subject and message are required.');
      return;
    }

    setSubmitting(true);
    try {
      const userId = user.id || user._id || '';
      const userName = user.fullName || 'User';
      const userEmail = user.email || '';
      const userRole = user.role || 'user';

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
          subject,
          category,
          message,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit inquiry');
      }

      setFormMessage('Inquiry submitted successfully. Our admin team will review it soon.');
      setSubject('');
      setCategory('general');
      setMessage('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-linear-to-br from-emerald-50 via-white to-orange-50">
          <div className="absolute -top-20 right-0 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl" />

          <div className="max-w-6xl mx-auto px-4 py-14 sm:py-16 relative z-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Contact Us</p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-black text-emerald-700">We Are Here to Help</h1>
            <p className="mt-4 text-emerald-600 max-w-3xl mx-auto text-sm sm:text-base">
              Logged-in users can submit inquiries directly. Admin reviews inquiries from the admin panel.
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-10 sm:py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-emerald-700">Email Support</h2>
              <p className="mt-2 text-sm text-slate-700">For account, order, and policy support.</p>
              <a href="mailto:MYSANJEEVNI3693@GMAIL.COM" className="mt-3 inline-block text-emerald-700 font-semibold hover:text-emerald-800">
                MYSANJEEVNI3693@GMAIL.COM
              </a>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-emerald-700">Phone</h2>
              <p className="mt-2 text-sm text-slate-700">Monday to Saturday, business hours.</p>
              <a href="tel:9289996241" className="mt-3 inline-block text-emerald-700 font-semibold hover:text-emerald-800">
                9289996241
              </a>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-emerald-700">Office Address</h2>
              <p className="mt-2 text-sm text-slate-700 leading-6">
                L-2/51 A, New Mahavir Nagar, Opp. Kangra Niketan, New Delhi-110018
              </p>
            </article>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-white p-6 sm:p-8 shadow-sm">
            <h2 className="text-2xl font-black text-emerald-700">Submit an Inquiry</h2>
            <p className="text-slate-600 mt-1 text-sm">This form is available only after login.</p>

            {!isLoggedIn ? (
              <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-4">
                <p className="text-sm text-orange-700 font-semibold">Please login to submit your inquiry.</p>
                <Link
                  href="/login?redirect=/contact"
                  className="inline-block mt-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-semibold"
                >
                  Login to Continue
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      maxLength={120}
                      placeholder="Example: Delay in order delivery"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="general">General</option>
                      <option value="order">Order</option>
                      <option value="account">Account</option>
                      <option value="payment">Payment</option>
                      <option value="doctor">Doctor Consultation</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    maxLength={2000}
                    placeholder="Describe your issue or inquiry in detail..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                {formError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {formError}
                  </div>
                )}

                {formMessage && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {formMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Submit Inquiry'}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
