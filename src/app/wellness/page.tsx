'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

const wellnessPillars = [
  {
    title: 'Daily Immunity Care',
    desc: 'Build strong resistance with expert-curated daily wellness essentials.',
    icon: '🛡️',
  },
  {
    title: 'Mind & Body Balance',
    desc: 'Support stress, sleep, and mood with personalized holistic routines.',
    icon: '🧘',
  },
  {
    title: 'Preventive Screening',
    desc: 'Track health markers early with timely tests and guided follow-ups.',
    icon: '🧪',
  },
  {
    title: 'Nutrition Support',
    desc: 'Choose supplements and food-support solutions for long-term vitality.',
    icon: '🥗',
  },
];

const programs = [
  {
    name: '30-Day Energy Reset',
    focus: 'Low energy and lifestyle fatigue',
    cta: 'Start Energy Plan',
  },
  {
    name: 'Immunity Build Program',
    focus: 'Seasonal wellness and resilience',
    cta: 'Build Immunity',
  },
  {
    name: 'Stress & Sleep Care',
    focus: 'Calm mind and better sleep quality',
    cta: 'Improve Sleep',
  },
];

export default function WellnessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-linear-to-br from-emerald-50 via-white to-orange-50">
          <div className="absolute -top-16 -right-8 h-44 w-44 rounded-full bg-orange-200/50 blur-3xl" />
          <div className="absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-emerald-200/50 blur-3xl" />

          <div className="max-w-7xl mx-auto px-4 py-16 sm:py-20 relative z-10">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-orange-500">MySanjeevani Wellness</p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-black leading-tight text-emerald-700">
              Your Daily Wellness,
              <span className="text-orange-500"> Designed With Care</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base sm:text-lg text-emerald-600">
              Explore complete wellness support including preventive care, habit-based health plans, and trusted products.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/medicines" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 transition">
                Explore Wellness Products
              </Link>
              <Link href="/doctor-consultation" className="rounded-xl border-2 border-orange-400 text-orange-500 font-bold px-5 py-3 hover:bg-orange-50 transition">
                Talk to a Wellness Expert
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-12 sm:py-14">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-emerald-700">Wellness Pillars</h2>
            <p className="mt-2 text-orange-500 font-medium">
              Four essentials that keep your long-term health strong and consistent.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {wellnessPillars.map((item) => (
              <article key={item.title} className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="h-12 w-12 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center text-2xl">
                  {item.icon}
                </div>
                <h3 className="mt-4 text-lg font-extrabold text-emerald-700">{item.title}</h3>
                <p className="mt-2 text-sm text-orange-500">{item.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 pb-12 sm:pb-14">
          <div className="rounded-3xl border border-orange-200 bg-linear-to-r from-orange-50 via-white to-emerald-50 p-6 sm:p-8">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-black text-emerald-700">Featured Wellness Plans</h2>
              <p className="mt-2 text-orange-500 font-medium">Choose a focused plan and start seeing better health outcomes week by week.</p>
            </div>

            <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-4">
              {programs.map((plan) => (
                <article key={plan.name} className="rounded-2xl border border-orange-200 bg-white p-5">
                  <h3 className="text-lg font-extrabold text-emerald-700">{plan.name}</h3>
                  <p className="mt-2 text-sm text-orange-500">{plan.focus}</p>
                  <button className="mt-4 w-full rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 transition">
                    {plan.cta}
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 pb-16">
          <div className="rounded-3xl bg-linear-to-r from-emerald-600 to-orange-500 p-7 sm:p-9 text-white text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-white/85">Start Today</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black">Small Daily Steps, Big Health Results</h2>
            <p className="mt-3 max-w-2xl mx-auto text-white/90">
              Join MySanjeevani wellness routines and get guided support for medicines, diagnostics, and consultations.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/signup" className="rounded-xl bg-white text-emerald-700 font-bold px-5 py-3 hover:bg-emerald-50 transition">
                Create Free Account
              </Link>
              <Link href="/offers" className="rounded-xl border border-white/75 text-white font-bold px-5 py-3 hover:bg-white/10 transition">
                View Wellness Offers
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
