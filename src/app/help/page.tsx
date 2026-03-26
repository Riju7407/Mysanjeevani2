'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

const faqItems = [
  {
    q: 'How can I track my order?',
    a: 'Go to the Track page, enter your order ID, and view live status updates with delivery steps.',
  },
  {
    q: 'How do I book a doctor consultation?',
    a: 'Use Consult Doctor in the header, choose a specialist, select slot, and confirm the booking.',
  },
  {
    q: 'Are medicines authentic?',
    a: 'Yes. Products are sourced from verified pharmacies and trusted partners with quality checks.',
  },
  {
    q: 'Can I cancel an order?',
    a: 'You can cancel eligible orders before shipment from the Orders section in your account.',
  },
  {
    q: 'How quickly is delivery completed?',
    a: 'Most orders are delivered in 2-3 days depending on your location and item availability.',
  },
  {
    q: 'How do I contact support?',
    a: 'Use Help options below and share your order ID for faster resolution.',
  },
];

const quickActions = [
  { title: 'Track My Order', href: '/track', icon: '📦' },
  { title: 'Consult a Doctor', href: '/doctor-consultation', icon: '👨‍⚕️' },
  { title: 'Browse Medicines', href: '/medicines', icon: '💊' },
  { title: 'View Offers', href: '/offers', icon: '🏷️' },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-linear-to-br from-emerald-50 via-white to-orange-50">
          <div className="absolute -top-16 right-0 h-52 w-52 rounded-full bg-orange-200/40 blur-3xl" />
          <div className="absolute -bottom-16 left-0 h-52 w-52 rounded-full bg-emerald-200/40 blur-3xl" />

          <div className="max-w-7xl mx-auto px-4 py-14 sm:py-16 relative z-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Support Center</p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-black text-emerald-700">How Can We Help You Today?</h1>
            <p className="mt-3 text-emerald-600 max-w-2xl mx-auto text-sm sm:text-base">
              Find answers quickly, track requests, and get support for medicines, consultations, and deliveries.
            </p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-10 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                <div className="h-11 w-11 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center text-xl">
                  {action.icon}
                </div>
                <h3 className="mt-3 font-extrabold text-emerald-700">{action.title}</h3>
                <p className="mt-1 text-sm text-orange-500">Open now</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 pb-14 sm:pb-16">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-3xl font-black text-emerald-700">Frequently Asked Questions</h2>
              <p className="text-orange-500 mt-1">Quick answers to common customer queries.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {faqItems.map((item) => (
                <article key={item.q} className="rounded-2xl border border-orange-200 bg-orange-50/50 p-4">
                  <h3 className="font-bold text-emerald-700">{item.q}</h3>
                  <p className="text-sm text-slate-600 mt-2">{item.a}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
