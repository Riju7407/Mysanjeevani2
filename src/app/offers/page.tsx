'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const OFFERS = [
  { id: 1, title: '20% OFF on all Lab Tests', subtitle: 'Book online & get tested at home', code: 'LAB20', bg: 'from-blue-600 to-blue-400', icon: '🧪', expiry: '31 Dec 2025', cat: 'Lab Tests' },
  { id: 2, title: 'Buy 2 Get 1 Free', subtitle: 'On all Ayurvedic supplements', code: 'AYUR3FOR2', bg: 'from-amber-600 to-yellow-400', icon: '🌿', expiry: '15 Jan 2026', cat: 'Ayurveda' },
  { id: 3, title: '15% OFF First Consultation', subtitle: 'Book a doctor consultation today', code: 'NEWDOC15', bg: 'from-green-600 to-emerald-400', icon: '👨‍⚕️', expiry: '28 Feb 2026', cat: 'Consultation' },
  { id: 4, title: 'Flat ₹100 OFF on Medicines', subtitle: 'On orders above ₹500', code: 'MED100', bg: 'from-purple-600 to-violet-400', icon: '💊', expiry: '31 Mar 2026', cat: 'Medicines' },
  { id: 5, title: 'Free Home Sample Collection', subtitle: 'On all diagnostic tests', code: 'FREEHOME', bg: 'from-teal-600 to-cyan-400', icon: '🏠', expiry: '31 Dec 2025', cat: 'Lab Tests' },
  { id: 6, title: '30% OFF Homeopathy Remedies', subtitle: 'Gentle healing for the whole family', code: 'HOMEO30', bg: 'from-pink-600 to-rose-400', icon: '🌸', expiry: '20 Jan 2026', cat: 'Homeopathy' },
  { id: 7, title: 'Complete Health Checkup ₹999', subtitle: 'Includes 80+ tests (MRP ₹3500)', code: 'HEALTH999', bg: 'from-red-600 to-orange-400', icon: '❤️', expiry: '28 Feb 2026', cat: 'Lab Tests' },
  { id: 8, title: '10% Cashback on UPI', subtitle: 'On orders above ₹299', code: 'UPI10', bg: 'from-indigo-600 to-blue-400', icon: '📱', expiry: '31 Dec 2025', cat: 'All' },
];

const FEATURED_DEALS = [
  { name: 'Diabetes Care Pack', items: '3 tests + consultation', mrp: 2999, price: 1499, discount: 50, icon: '🩸' },
  { name: 'Thyroid Profile', items: 'T3, T4, TSH + Vitamin D', mrp: 1800, price: 799, discount: 56, icon: '🦋' },
  { name: 'CBC + Lipid Profile', items: 'Complete blood count + cholesterol', mrp: 1200, price: 499, discount: 58, icon: '💉' },
  { name: 'Immunity Booster Kit', items: 'Chyawanprash + Guduchi + Vitamin C', mrp: 899, price: 499, discount: 44, icon: '🛡️' },
];

export default function OffersPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Hero */}
      <div className="bg-gradient-to-r from-orange-600 to-red-500 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold mb-2">🎁 Exclusive Offers</h1>
          <p className="text-orange-100 text-lg">Enjoy the best deals on medicines, lab tests, consultations & more!</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Featured Deals */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">⚡ Featured Deals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {FEATURED_DEALS.map((d) => (
            <div key={d.name} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">{d.icon}</span>
                <span className="bg-red-100 text-red-700 text-sm font-bold px-2 py-0.5 rounded-full">{d.discount}% OFF</span>
              </div>
              <h3 className="font-bold text-gray-900 text-sm">{d.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{d.items}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xl font-bold text-green-600">₹{d.price}</span>
                <span className="text-sm text-gray-400 line-through">₹{d.mrp}</span>
              </div>
              <button className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white py-1.5 rounded-lg text-sm font-semibold transition">
                Book Now
              </button>
            </div>
          ))}
        </div>

        {/* Coupon Codes */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🏷️ Coupon Codes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {OFFERS.map((offer) => (
            <div key={offer.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition">
              <div className={`bg-gradient-to-r ${offer.bg} text-white px-5 py-4 flex items-center gap-4`}>
                <span className="text-4xl">{offer.icon}</span>
                <div>
                  <h3 className="font-bold text-lg">{offer.title}</h3>
                  <p className="text-sm text-white/80">{offer.subtitle}</p>
                </div>
              </div>
              <div className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="border-2 border-dashed border-gray-300 rounded px-3 py-1 font-mono font-bold text-gray-700">
                      {offer.code}
                    </div>
                    <button
                      onClick={() => copyCode(offer.code)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm font-semibold transition"
                    >
                      {copiedCode === offer.code ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Valid till: {offer.expiry} · {offer.cat}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Terms */}
        <div className="mt-10 p-5 bg-gray-100 rounded-xl text-xs text-gray-500">
          <strong>Terms & Conditions:</strong> All offers are subject to availability. Coupon codes are case-sensitive. Can not be combined with other offers. MySanjeevani reserves the right to modify or withdraw any offer without prior notice.
        </div>
      </div>
      <Footer />
    </div>
  );
}
