'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';

interface WellnessPillar {
  _id: string;
  title: string;
  desc: string;
  benefits: string;
  imageUrl?: string;
  icon?: string;
  rating: number;
  reviews: number;
  price: number;
  mrp?: number;
}

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

export default function WellnessPage() {
  const [sortOrder, setSortOrder] = useState('featured');
  const [search, setSearch] = useState('');
  const [pillars, setPillars] = useState<WellnessPillar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPillars = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/wellness-pillars', { cache: 'no-store' });
        const data = await response.json();
        if (response.ok && data.success) {
          setPillars(data.data || []);
        } else {
          setPillars([]);
        }
      } catch {
        setPillars([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPillars();
  }, []);

  const sortedPillars = useMemo(() => {
    let result = pillars.filter((pillar) => {
      const searchText = search.trim().toLowerCase();
      return (
        !searchText ||
        pillar.title.toLowerCase().includes(searchText) ||
        pillar.desc.toLowerCase().includes(searchText) ||
        pillar.benefits.toLowerCase().includes(searchText)
      );
    });

    // Apply sorting
    if (sortOrder === 'price-low') result.sort((a, b) => a.price - b.price);
    else if (sortOrder === 'price-high') result.sort((a, b) => b.price - a.price);
    else if (sortOrder === 'rating') result.sort((a, b) => b.rating - a.rating);

    return result;
  }, [pillars, search, sortOrder]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-emerald-50 flex flex-col">
      <Header />

      {/* Hero */}
      <div className="w-full -mt-48">
        <img src="/WB.png" alt="Wellness" className="w-full h-auto object-cover block" />
      </div>

      {/* Search & Filter Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-orange-200 shadow-sm -mt-40">
        <div className="max-w-7xl mx-auto px-4 py-1">
          <div className="flex flex-col gap-4 md:gap-0 md:flex-row md:items-center md:justify-between">
            {/* Search Bar */}
            <div className="flex-1 md:mr-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Search wellness programs, benefits, solutions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border-2 border-orange-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition text-sm"
                />
              </div>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="border-2 border-orange-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 transition text-sm font-medium text-gray-700"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-10 w-full">
        {/* Results Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                💚 Wellness Pillars
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                {sortedPillars.length} {sortedPillars.length === 1 ? 'program' : 'programs'} available
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm animate-pulse"
              >
                <div className="h-40 bg-gradient-to-br from-orange-100 to-emerald-100 rounded-xl mb-4" />
                <div className="h-4 bg-gray-200 rounded mb-3 w-3/4" />
                <div className="h-3 bg-gray-200 rounded mb-2 w-full" />
                <div className="h-3 bg-gray-200 rounded mb-4 w-1/2" />
                <div className="h-10 bg-orange-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : sortedPillars.length === 0 ? (
          <div className="text-center py-20 bg-white border-2 border-dashed border-orange-200 rounded-3xl shadow-sm">
            <div className="text-7xl mb-4 opacity-50">💚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No wellness programs found</h3>
            <p className="text-gray-600 mb-6">
              {search
                ? `We couldn't find any programs matching "${search}"`
                : 'No wellness programs available'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Wellness Programs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {sortedPillars.map((pillar) => {
                const discount = pillar.mrp && pillar.mrp > pillar.price
                  ? Math.round(((pillar.mrp - pillar.price) / pillar.mrp) * 100)
                  : 0;

                return (
                  <article
                    key={pillar._id}
                    className="bg-white rounded-2xl border border-orange-100 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col group"
                  >
                    {/* Image Container */}
                    <div className="relative h-40 bg-gradient-to-br from-orange-50 to-emerald-50 flex items-center justify-center overflow-hidden group-hover:brightness-95 transition-all">
                      {pillar.imageUrl ? (
                        <img
                          src={pillar.imageUrl}
                          alt={pillar.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-7xl group-hover:scale-125 transition-transform duration-300">
                          {pillar.icon || '💚'}
                        </span>
                      )}
                      
                      {/* Discount Badge */}
                      {discount > 0 && (
                        <div className="absolute top-3 right-3">
                          <span className="bg-green-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
                            {discount}% OFF
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1">
                      {/* Category Badge */}
                      <span className="text-[10px] uppercase tracking-wider font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded-full w-fit mb-2">
                        Wellness Care
                      </span>

                      {/* Program Name */}
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-2 min-h-9 leading-tight">
                        {pillar.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2 min-h-8">
                        {pillar.benefits}
                      </p>

                      {/* Ratings */}
                      <div className="flex items-center gap-3 mt-2 py-2 border-t border-gray-100">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold">
                          <span className="text-orange-400">★</span>
                          <span className="text-gray-900">{Number(pillar.rating).toFixed(1)}</span>
                        </span>
                        <span className="text-[10px] text-gray-500">
                          ({pillar.reviews} reviews)
                        </span>
                      </div>

                      {/* Price */}
                      <div className="mt-3 flex items-center gap-2 py-2 border-t border-gray-100">
                        <span className="text-xl font-bold text-gray-900">₹{pillar.price}</span>
                        {pillar.mrp && pillar.mrp > pillar.price && (
                          <span className="text-xs text-gray-500 line-through">₹{pillar.mrp}</span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100">
                        <button className="py-2.5 rounded-xl text-xs font-bold bg-white border border-orange-300 text-orange-700 hover:bg-orange-50 transition-all transform hover:scale-105 active:scale-95">
                          Learn More
                        </button>
                        <button className="py-2.5 rounded-xl text-xs font-bold bg-orange-500 text-white hover:bg-orange-600 transition-all transform hover:scale-105 active:scale-95">
                          🛒 Start
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Results Footer */}
            <div className="mt-12 text-center">
              <p className="text-gray-600 text-sm">
                Showing {sortedPillars.length} of {pillars.length} wellness programs • Expert-curated packages
              </p>
            </div>
          </>
        )}

        {/* Featured Plans Section */}
        <section className="mt-16">
          <div className="rounded-3xl border border-orange-200 bg-linear-to-r from-orange-50 via-white to-emerald-50 p-6 sm:p-8">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-black text-emerald-700">Featured Wellness Plans</h2>
              <p className="mt-2 text-orange-500 font-medium">Choose a focused plan and start seeing better health outcomes week by week.</p>
            </div>

            <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
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
              ].map((plan) => (
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
        {/* CTA Section */}
        <section className="mt-16">
          <div className="rounded-3xl bg-linear-to-r from-emerald-600 to-orange-500 p-7 sm:p-9 text-white text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-white/85">Start Today</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black">Small Daily Steps, Big Health Results</h2>
            <p className="mt-3 max-w-2xl mx-auto text-white/90">
              Join MySanjeevni wellness routines and get guided support for medicines, diagnostics, and consultations.
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
