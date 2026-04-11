'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Suspense } from 'react';

interface Product {
  _id: string;
  name: string;
  brand: string;
  potency?: string;
  quantity?: number;
  quantityUnit?: string;
  productType?: string;
  category: string;
  subcategory?: string;
  diseaseCategory?: string;
  diseaseSubcategory?: string;
  price: number;
  mrp?: number;
  discount?: number;
  image?: string;
  icon?: string;
  benefit?: string;
  description?: string;
  stock: number;
  rating: number;
  reviews: number;
  requiresPrescription?: boolean;
  healthConcerns?: string[];
  isActive: boolean;
  isPopular?: boolean;
}

interface ReviewSummary {
  averageRating: number;
  total: number;
  latestComment?: string;
  latestUserName?: string;
}

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

// ── Category groups for sidebar ─────────────────────────────────────────────
const MED_CATEGORIES = ['All', 'Addiction', 'Anxiety & Depression', 'Sleeplessness', 'Weak Memory', 'Acne & Pimples', 'Dark Circles & Marks', 'Wrinkles & Aging', 'Hair Fall', 'Dandruff', 'Cough', 'Asthma', 'Bronchitis', 'Indigestion/Acidity/Gas', 'Diabetes', 'Blood Pressure', 'Headache & Migraine', 'Back & Knee Pain', 'Arthritis & Joint Pains'];
const AYUR_CATEGORIES = ['All', 'Himalaya', 'Organic India', 'Baidyanath', 'Dabur', 'Zandu', 'Charak', 'Aimil', 'Ras & Sindoor', 'Bhasm & Pishti', 'Vati, Gutika & Guggulu', 'Chyawanprash', 'Honey'];
const HOMEO_CATEGORIES = ['All', 'SBL', 'Dr. Reckeweg', 'Willmar Schwabe', 'Bjain', '30 CH', '200 CH', '1000 CH', 'Mother Tinctures', 'Biochemic', 'Bach Flower'];

const TAB_CATEGORIES: Record<string, string[]> = {
  medicines: ['Addiction', 'Anxiety & Depression', 'Sleeplessness', 'Weak Memory', 'Acne & Pimples', 'Dark Circles & Marks', 'Wrinkles & Aging', 'Hair Fall', 'Dandruff', 'Cough', 'Asthma', 'Bronchitis', 'Indigestion/Acidity/Gas', 'Diabetes', 'Blood Pressure', 'Headache & Migraine', 'Back & Knee Pain', 'Arthritis & Joint Pains'],
  ayurveda: ['Ayurveda'],
  homeopathy: ['Homeopathy'],
};

const TAB_SIDEBAR: Record<string, string[]> = {
  medicines: MED_CATEGORIES,
  ayurveda: AYUR_CATEGORIES,
  homeopathy: HOMEO_CATEGORIES,
};

function normalizeCategory(category?: string) {
  const value = (category || '').trim().toLowerCase();
  if (value === 'generic' || value === 'branded') return 'Medicines';
  if (value === 'ayurvedic' || value === 'ayurveda') return 'Ayurveda';
  if (value === 'homeopathy') return 'Homeopathy';
  return category || '';
}

function normalizeText(value?: string) {
  return (value || '').trim().toLowerCase();
}

function equalsIgnoreCase(left?: string, right?: string) {
  return normalizeText(left) === normalizeText(right);
}

function getQuantityLabel(product: Product) {
  const hasQuantity = product.quantity !== undefined && product.quantity !== null;
  const hasUnit = product.quantityUnit && product.quantityUnit !== 'None';

  if (hasQuantity && hasUnit) return `${product.quantity} ${product.quantityUnit}`;
  if (hasQuantity) return String(product.quantity);
  if (hasUnit) return product.quantityUnit as string;
  return '';
}

const TAB_CONFIG = [
  { key: 'medicines', label: '💊 Medicines', color: 'emerald' },
  { key: 'ayurveda', label: '🌿 Ayurveda', color: 'amber' },
  { key: 'homeopathy', label: '🌸 Homeopathy', color: 'pink' },
];

const COLOR_MAP: Record<string, { active: string; btn: string; tag: string; ring: string }> = {
  emerald: { active: 'bg-emerald-100 text-emerald-800', btn: 'bg-orange-500 hover:bg-orange-600', tag: 'bg-emerald-50 text-emerald-700', ring: 'border-emerald-500 text-emerald-700' },
  amber:   { active: 'bg-amber-100 text-amber-800',   btn: 'bg-amber-500 hover:bg-amber-600',   tag: 'bg-amber-50 text-amber-700',   ring: 'border-amber-500 text-amber-700' },
  pink:    { active: 'bg-pink-100 text-pink-800',     btn: 'bg-pink-500 hover:bg-pink-600',     tag: 'bg-pink-50 text-pink-700',     ring: 'border-pink-500 text-pink-700' },
};

function MedicinesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlCategory = searchParams.get('category') || '';
  const urlSubcategory = searchParams.get('subcategory') || '';
  const productsSectionRef = useRef<HTMLDivElement | null>(null);
  const hasAutoScrolledRef = useRef(false);

  const [activeTab, setActiveTab] = useState<'medicines' | 'ayurveda' | 'homeopathy'>('medicines');
  const [sortOrder, setSortOrder] = useState('featured');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [search, setSearch] = useState('');
  const [sidebarCat, setSidebarCat] = useState('All');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const [reviewSummaries, setReviewSummaries] = useState<Record<string, ReviewSummary>>({});

  const redirectToLogin = () => {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    router.push(`/login?redirect=${encodeURIComponent(returnTo)}`);
  };

  // Map URL param category → tab
  useEffect(() => {
    if (!urlCategory) return;
    const lower = urlCategory.toLowerCase();
    if (lower === 'ayurveda') setActiveTab('ayurveda');
    else if (lower === 'homeopathy') setActiveTab('homeopathy');
    else setActiveTab('medicines');
  }, [urlCategory]);

  useEffect(() => {
    if (!urlSubcategory) {
      setSidebarCat('All');
      return;
    }

    const candidates = TAB_SIDEBAR[activeTab] || [];
    const found = candidates.find(
      (item) => item.toLowerCase() === urlSubcategory.toLowerCase()
    );
    setSidebarCat(found || 'All');
  }, [urlSubcategory, activeTab]);

  useEffect(() => {
    hasAutoScrolledRef.current = false;
  }, [urlCategory, urlSubcategory]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      // fetch all, we filter client-side by category group
      const res = await fetch('/api/products?limit=200', { cache: 'no-store' });
      const data = await res.json();
      setProducts(data.products || []);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const seedData = async () => {
    setSeeding(true);
    setSeedStatus(null);
    try {
      const res = await fetch('/api/seed?force=false', { method: 'POST' });
      const data = await res.json();
      if (data.seeded) {
        setSeedStatus(`✅ Seeded ${data.seeded.products} products + ${data.seeded.labTests} lab tests`);
      } else {
        setSeedStatus('Already seeded — use ?force=true to re-seed');
      }
      await fetchProducts();
    } catch { setSeedStatus('Seed failed'); }
    setSeeding(false);
  };

  const addToCart = (product: Product) => {
    setCart((prev) => ({ ...prev, [product._id]: (prev[product._id] || 0) + 1 }));
    try {
      const raw = localStorage.getItem('cart') || '[]';
      const c = JSON.parse(raw);
      const existing = c.find((i: any) => i.id === product._id);
      if (existing) existing.quantity += 1;
      else c.push({ id: product._id, name: product.name, price: product.price, quantity: 1, brand: product.brand, image: product.image || product.icon || '💊', vendorName: 'MySanjeevni' });
      localStorage.setItem('cart', JSON.stringify(c));
      window.dispatchEvent(new Event('storage'));
    } catch {}
  };

  const handleBuyNow = (product: Product) => {
    const token = localStorage.getItem('token');
    if (!token) {
      redirectToLogin();
      return;
    }
    addToCart(product);
    router.push('/cart');
  };

  // ── Filter products for current tab + sidebar category ──────────────────
  const tabCategories = TAB_CATEGORIES[activeTab];
  const tabFiltered = products.filter((p) => {
    const normalizedCategory = normalizeCategory(p.category);
    const productType = (p.productType || '').trim();
    const normalizedType = productType.toLowerCase();
    const isLabTestType = normalizedType === 'lab tests' || normalizedType === 'lab test';

    if (activeTab === 'ayurveda') {
      return (
        productType === 'Ayurveda Medicine' ||
        normalizedCategory === 'Ayurveda' ||
        AYUR_CATEGORIES.includes(normalizedCategory)
      );
    }

    if (activeTab === 'homeopathy') {
      return (
        productType === 'Homeopathy' ||
        normalizedCategory === 'Homeopathy' ||
        HOMEO_CATEGORIES.includes(normalizedCategory)
      );
    }

    return !isLabTestType && (
      productType === 'Generic Medicine' ||
      normalizedCategory === 'Medicines' ||
      tabCategories.includes(normalizedCategory)
    );
  });

  const displayed = tabFiltered.filter((p) => {
    const matchCat = sidebarCat === 'All' || p.category === sidebarCat || p.benefit === sidebarCat;

    const urlCategoryMatch = !urlCategory || (() => {
      const categoryFields = [
        p.category,
        p.subcategory,
        p.diseaseCategory,
        p.diseaseSubcategory,
        p.benefit,
        p.productType,
        normalizeCategory(p.category),
      ];

      if (equalsIgnoreCase(urlCategory, 'ayurveda')) {
        return categoryFields.some((field) => equalsIgnoreCase(field, 'Ayurveda')) || equalsIgnoreCase(p.productType, 'Ayurveda Medicine');
      }

      if (equalsIgnoreCase(urlCategory, 'homeopathy')) {
        return categoryFields.some((field) => equalsIgnoreCase(field, 'Homeopathy')) || equalsIgnoreCase(p.productType, 'Homeopathy');
      }

      return categoryFields.some((field) => equalsIgnoreCase(field, urlCategory));
    })();

    const urlSubcategoryMatch = !urlSubcategory || [
      p.category,
      p.subcategory,
      p.diseaseCategory,
      p.diseaseSubcategory,
      p.benefit,
    ].some((field) => equalsIgnoreCase(field, urlSubcategory));

    const searchText = search.trim().toLowerCase();
    const quantityText = p.quantity !== undefined && p.quantity !== null ? String(p.quantity) : '';
    const matchSearch =
      !searchText ||
      [
        p.name,
        p.brand,
        p.category,
        p.subcategory,
        p.diseaseCategory,
        p.diseaseSubcategory,
        p.potency,
        p.quantityUnit,
        quantityText,
        getQuantityLabel(p),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchText));
    return matchCat && urlCategoryMatch && urlSubcategoryMatch && matchSearch;
  });

  // Apply sorting
  const sortedDisplayed = useMemo(() => {
    let result = [...displayed];
    if (sortOrder === 'price-low') result.sort((a, b) => a.price - b.price);
    else if (sortOrder === 'price-high') result.sort((a, b) => b.price - a.price);
    else if (sortOrder === 'rating') result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return result;
  }, [displayed, sortOrder]);

  const displayedProductIds = useMemo(
    () => sortedDisplayed.map((product) => product._id).filter(Boolean).join(','),
    [sortedDisplayed]
  );

  useEffect(() => {
    const fetchReviewSummaries = async () => {
      if (!displayedProductIds) {
        setReviewSummaries({});
        return;
      }

      try {
        const res = await fetch(`/api/reviews?productIds=${encodeURIComponent(displayedProductIds)}`, {
          cache: 'no-store',
        });
        const data = await res.json();
        if (res.ok) setReviewSummaries(data.summaries || {});
      } catch {
        setReviewSummaries({});
      }
    };

    fetchReviewSummaries();
  }, [displayedProductIds]);

  useEffect(() => {
    if (loading) return;
    if (!urlCategory && !urlSubcategory) return;
    if (hasAutoScrolledRef.current) return;

    const section = productsSectionRef.current;
    if (!section) return;

    hasAutoScrolledRef.current = true;
    window.requestAnimationFrame(() => {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [loading, urlCategory, urlSubcategory]);

  const col = COLOR_MAP[TAB_CONFIG.find((t) => t.key === activeTab)!.color];

  return (
    <div className="min-h-screen bg-linear-to-b from-emerald-50 via-teal-50 to-white flex flex-col">
      <Header />

      {/* Hero */}
      <div className="w-full -mt-48">
        <img src="/OM.png" alt="Medicines Store" className="w-full h-auto object-cover block" />
      </div>

      {/* Tabs & Search Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-emerald-200 shadow-sm -mt-40">
        <div className="max-w-7xl mx-auto px-4">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {TAB_CONFIG.map((t) => (
              <button 
                key={t.key} 
                onClick={() => { setActiveTab(t.key as any); setSidebarCat('All'); }}
                className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${
                  activeTab === t.key
                    ? `text-${t.color === 'amber' ? 'amber' : t.color === 'pink' ? 'pink' : 'emerald'}-700 border-${t.color === 'amber' ? 'amber' : t.color === 'pink' ? 'pink' : 'emerald'}-600`
                    : 'text-gray-600 border-transparent hover:text-gray-800'
                }`}
                style={activeTab === t.key ? { 
                  borderBottomColor: t.color === 'amber' ? '#d97706' : t.color === 'pink' ? '#db2777' : '#059669',
                  color: t.color === 'amber' ? '#92400e' : t.color === 'pink' ? '#9d174d' : '#065f46'
                } : {}}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col gap-4 md:gap-0 md:flex-row md:items-center md:justify-between py-3">
            {/* Search Bar */}
            <div className="flex-1 md:mr-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Search by product name, brand..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border-2 border-emerald-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition text-sm"
                />
              </div>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="border-2 border-emerald-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 transition text-sm font-medium text-gray-700"
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

      {seedStatus && (
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-2 text-sm">{seedStatus}</div>
        </div>
      )}

      <div ref={productsSectionRef} className="flex-1 max-w-7xl mx-auto px-4 py-10 w-full">
        {/* Results Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {activeTab === 'medicines' ? '💊 Medicines' : activeTab === 'ayurveda' ? '🌿 Ayurveda' : '🌸 Homeopathy'}
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                {sortedDisplayed.length} {sortedDisplayed.length === 1 ? 'product' : 'products'} available
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm animate-pulse"
              >
                <div className="h-40 bg-linear-to-br from-emerald-100 to-teal-100 rounded-xl mb-4" />
                <div className="h-4 bg-gray-200 rounded mb-3 w-3/4" />
                <div className="h-3 bg-gray-200 rounded mb-2 w-full" />
                <div className="h-3 bg-gray-200 rounded mb-4 w-1/2" />
                <div className="h-10 bg-emerald-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : sortedDisplayed.length === 0 ? (
          <div className="text-center py-20 bg-white border-2 border-dashed border-emerald-200 rounded-3xl shadow-sm">
            <div className="text-7xl mb-4 opacity-50">💊</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">
              {search
                ? `We couldn't find any products matching "${search}"`
                : 'No products available in this category'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="px-6 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition"
              >
                Clear Search
              </button>
            )}
            {products.length === 0 && (
              <button
                onClick={seedData}
                disabled={seeding}
                className="ml-3 px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-60"
              >
                {seeding ? 'Loading...' : '⚡ Load Sample Products'}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sortedDisplayed.map((product) => {
                const summary = reviewSummaries[product._id];
                const productRating =
                  summary && summary.total > 0 ? summary.averageRating : Number(product.rating || 0);
                const productReviewCount =
                  summary && summary.total > 0 ? summary.total : Number(product.reviews || 0);

                return (
                  <article
                    key={product._id}
                    className="group w-full max-w-56 mx-auto bg-white/95 border border-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300 cursor-pointer"
                    onClick={() => router.push(`/medicines/${product._id}`)}
                  >
                    {/* Image Container */}
                    <div className="relative h-40 bg-linear-to-br from-white to-slate-50 flex items-center justify-center overflow-hidden">
                      <span className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-bold bg-amber-600 text-white">
                        Popular
                      </span>
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-contain p-3 group-hover:scale-105 transition duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-5xl group-hover:scale-105 transition duration-300">
                          {product.icon || '💊'}
                        </span>
                      )}

                      <div className="absolute inset-0 flex items-start justify-end p-3 pointer-events-none">
                        {product.mrp && product.mrp > product.price && (
                          <span className="text-[11px] font-bold text-emerald-600">
                            {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3 flex flex-col flex-1">
                      <p className="font-medium text-slate-500 mb-1 uppercase tracking-wide text-[10px]">
                        {product.brand || 'MySanjeevni'}
                      </p>
                      {getQuantityLabel(product) && (
                        <p className="text-[10px] font-semibold text-indigo-700 mb-1">
                          Qty: {getQuantityLabel(product)}
                        </p>
                      )}
                      <h3 className="font-bold text-slate-900 line-clamp-2 mb-2 text-xs min-h-8">{product.name}</h3>

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <span className="text-amber-500">★</span>
                          <span className="text-xs font-semibold text-slate-900">{productRating.toFixed(1)}</span>
                          <span className="text-xs text-slate-500">({productReviewCount})</span>
                        </div>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            product.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>

                      {summary?.latestComment && (
                        <p className="text-xs text-slate-600 mb-2 line-clamp-2">"{summary.latestComment}"</p>
                      )}

                      <div className="mb-2 flex items-end justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-black text-slate-900">₹{product.price}</span>
                          {product.mrp && product.mrp > product.price && (
                            <span className="text-xs text-slate-400 line-through">₹{product.mrp}</span>
                          )}
                        </div>
                        {product.mrp && product.mrp > product.price && (
                          <span className="text-[11px] font-bold text-emerald-600">
                            {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2 mt-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          disabled={product.stock <= 0}
                          className={`flex-1 rounded-lg font-bold transition py-1.5 text-[11px] ${
                            product.stock <= 0
                              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                              : cart[product._id]
                                ? 'bg-slate-700 text-white hover:bg-slate-800'
                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {cart[product._id] ? '✓ In Cart' : 'Add to Cart'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBuyNow(product);
                          }}
                          disabled={product.stock <= 0}
                          className={`flex-1 rounded-lg font-bold text-white transition py-1.5 text-[11px] ${
                            product.stock <= 0 ? 'bg-slate-400 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700'
                          }`}
                        >
                          Buy Now
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
                Showing all {sortedDisplayed.length} products • Quality certified products
              </p>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function MedicinesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <MedicinesContent />
    </Suspense>
  );
}

