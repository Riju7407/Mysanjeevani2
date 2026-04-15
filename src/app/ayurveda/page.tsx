'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const CATEGORIES = ['All', 'Himalaya', 'Organic India', 'Baidyanath', 'Dabur', 'Zandu', 'Charak', 'Aimil', 'Ras & Sindoor', 'Bhasm & Pishti', 'Vati, Gutika & Guggulu', 'Asava Arishta & Kadha', 'Loha & Mandur', 'Churan, Powder, Avaleha & Pak', 'Tailam & Ghrita', 'Chyawanprash', 'Honey', 'Digestives', 'Herbal & Vegetable Juice'];
const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

const AYURVEDA_CATEGORY_ALIASES: Record<string, string> = {
  'vati & gutika & guggulu': 'Vati, Gutika & Guggulu',
  'churan & powder & avleha & pak': 'Churan, Powder, Avaleha & Pak',
};

interface Product {
  _id: string;
  name: string;
  brand?: string;
  category: string;
  subcategory?: string;
  price: number;
  mrp?: number;
  icon?: string;
  image?: string;
  rating?: number;
  reviews?: number;
  description?: string;
  benefit?: string;
  productType?: string;
  potency?: string;
  diseaseCategory?: string;
  diseaseSubcategory?: string;
  quantity?: number;
  quantityUnit?: string;
  healthConcerns?: string[];
  isPopular?: boolean;
}

function normalizeCategory(value?: string) {
  const category = (value || '').trim().toLowerCase();
  if (category === 'ayurvedic' || category === 'ayurveda') return 'Ayurveda';
  return value || '';
}

function normalizeText(value?: string) {
  return (value || '').trim().toLowerCase();
}

function equalsIgnoreCase(left?: string, right?: string) {
  return normalizeText(left) === normalizeText(right);
}

function isAyurvedaProduct(product: Product) {
  const productType = (product.productType || '').trim().toLowerCase();
  const normalizedCategory = normalizeCategory(product.category);
  const normalizedBrand = normalizeText(product.brand);

  const hasAyurvedaCategoryMatch = CATEGORIES.some((category) =>
    equalsIgnoreCase(category, product.category)
  );
  const hasAyurvedaBrandMatch = CATEGORIES.some((category) =>
    equalsIgnoreCase(category, normalizedBrand)
  );

  return (
    productType === 'ayurveda medicine' ||
    String(normalizedCategory).toLowerCase() === 'ayurveda' ||
    hasAyurvedaCategoryMatch ||
    hasAyurvedaBrandMatch
  );
}

function AyurvedaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get('category') || '';
  const urlSearch = searchParams.get('search') || '';
  const productsSectionRef = useRef<HTMLDivElement | null>(null);
  const hasAutoScrolledRef = useRef(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('featured');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const normalizedCategory = AYURVEDA_CATEGORY_ALIASES[urlCategory.trim().toLowerCase()] || urlCategory;
    setSelectedCategory(normalizedCategory && CATEGORIES.includes(normalizedCategory) ? normalizedCategory : 'All');
    setSearch(urlSearch);
    hasAutoScrolledRef.current = false;
  }, [urlCategory, urlSearch]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/products?limit=300', { cache: 'no-store' });
        const data = await res.json();
        setProducts(Array.isArray(data.products) ? data.products : []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const redirectToLogin = () => {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    router.push(`/login?redirect=${encodeURIComponent(returnTo)}`);
  };

  const ayurvedaProducts = useMemo(() => products.filter(isAyurvedaProduct), [products]);

  const filtered = useMemo(() => {
    let result = ayurvedaProducts.filter((p) => {
      const matchCat =
        selectedCategory === 'All' ||
        equalsIgnoreCase(p.category, selectedCategory) ||
        equalsIgnoreCase(p.subcategory, selectedCategory) ||
        equalsIgnoreCase(p.benefit, selectedCategory) ||
        equalsIgnoreCase(p.brand, selectedCategory);
      const keyword = search.toLowerCase().trim();
      const concatenatedHealthConcerns = Array.isArray(p.healthConcerns) ? p.healthConcerns.join(' ') : '';
      const matchSearch =
        !keyword ||
        p.name.toLowerCase().includes(keyword) ||
        (p.brand || '').toLowerCase().includes(keyword) ||
        (p.description || '').toLowerCase().includes(keyword) ||
        (p.category || '').toLowerCase().includes(keyword) ||
        (p.subcategory || '').toLowerCase().includes(keyword) ||
        (p.benefit || '').toLowerCase().includes(keyword) ||
        (p.productType || '').toLowerCase().includes(keyword) ||
        (p.potency || '').toLowerCase().includes(keyword) ||
        (p.diseaseCategory || '').toLowerCase().includes(keyword) ||
        (p.diseaseSubcategory || '').toLowerCase().includes(keyword) ||
        String(p.quantity || '').toLowerCase().includes(keyword) ||
        (p.quantityUnit || '').toLowerCase().includes(keyword) ||
        concatenatedHealthConcerns.toLowerCase().includes(keyword);
      return matchCat && matchSearch;
    });

    // Apply sorting
    if (sortOrder === 'price-low') result.sort((a, b) => a.price - b.price);
    else if (sortOrder === 'price-high') result.sort((a, b) => b.price - a.price);
    else if (sortOrder === 'rating') result.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    return result;
  }, [ayurvedaProducts, selectedCategory, search, sortOrder]);

  useEffect(() => {
    if (loading) return;
    if (!urlCategory && !urlSearch) return;
    if (hasAutoScrolledRef.current) return;

    const section = productsSectionRef.current;
    if (!section) return;

    hasAutoScrolledRef.current = true;
    window.requestAnimationFrame(() => {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [loading, urlCategory, urlSearch, filtered.length]);

  const addToCart = (product: Product) => {
    setCart((prev) => ({ ...prev, [product._id]: (prev[product._id] || 0) + 1 }));
    // Also update localStorage cart
    try {
      const raw = localStorage.getItem('cart') || '[]';
      const c = JSON.parse(raw);
      const existing = c.find((i: any) => i.id === product._id);
      if (existing) existing.quantity += 1;
      else c.push({ id: product._id, name: product.name, price: product.price, quantity: 1, brand: product.brand, image: product.image || product.icon || '🌿', vendorName: 'MySanjeevni' });
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-yellow-50 to-white flex flex-col">
      <Header />

      {/* Hero */}
      <div className="w-full -mt-48">
        <img src="/AB.png" alt="Ayurveda Store" className="w-full h-auto object-cover block" />
      </div>

      {/* Search & Filter Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-amber-200 shadow-sm -mt-40">
        <div className="max-w-7xl mx-auto px-4 py-1">
          <div className="flex flex-col gap-4 md:gap-0 md:flex-row md:items-center md:justify-between">
            {/* Search Bar */}
            <div className="flex-1 md:mr-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Search Ayurvedic products, brands, benefits..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border-2 border-amber-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition text-sm"
                />
              </div>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="border-2 border-amber-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition text-sm font-medium text-gray-700"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Horizontal Category Scroll */}
        <div className="max-w-7xl mx-auto px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full font-medium text-sm transition-all flex-shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-amber-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div id="products-section" ref={productsSectionRef} className="flex-1 max-w-7xl mx-auto px-4 py-10 w-full">
        {/* Results Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {selectedCategory === 'All' ? '🌿 All Ayurveda Products' : `${selectedCategory}`}
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                {filtered.length} {filtered.length === 1 ? 'product' : 'products'} available
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-amber-100 p-4 shadow-sm animate-pulse"
              >
                <div className="h-40 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-xl mb-4" />
                <div className="h-4 bg-gray-200 rounded mb-3 w-3/4" />
                <div className="h-3 bg-gray-200 rounded mb-2 w-full" />
                <div className="h-3 bg-gray-200 rounded mb-4 w-1/2" />
                <div className="h-10 bg-amber-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white border-2 border-dashed border-amber-200 rounded-3xl shadow-sm">
            <div className="text-7xl mb-4 opacity-50">🌿</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">
              {search
                ? `We couldn't find any products matching "${search}"`
                : 'No products available in this category'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="px-6 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((p) => (
                <article
                  key={p._id}
                  onClick={() => router.push(`/medicines/${p._id}`)}
                  className="group w-full max-w-56 mx-auto bg-white/95 border border-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300 flex flex-col cursor-pointer"
                >
                  {/* Image Container */}
                  <div className="relative h-40 bg-linear-to-br from-white to-slate-50 flex items-center justify-center overflow-hidden">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-full w-full object-contain p-3 group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <span className="text-5xl group-hover:scale-105 transition duration-300">
                        {p.icon || '🌿'}
                      </span>
                    )}

                    {/* Badges */}
                    <div className="absolute inset-0 flex items-start justify-end p-3 pointer-events-none">
                      {!!(p.mrp && p.mrp > p.price) && (
                        <span className="text-[11px] font-bold text-emerald-600">
                          {Math.round(((p.mrp! - p.price) / p.mrp!) * 100)}% OFF
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3 flex flex-col flex-1">
                    {/* Brand & Category */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                        {p.brand || 'MySanjeevni'}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">
                        {p.category}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3 className="font-bold text-slate-900 text-xs line-clamp-2 min-h-8 mb-2 leading-tight">
                      {p.name}
                    </h3>

                    {/* Ratings */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold">
                        <span className="text-amber-500">★</span>
                        <span className="text-slate-900">{Number(p.rating || 0).toFixed(1)}</span>
                      </span>
                      <span className="text-xs text-slate-500">
                        ({p.reviews || 0} reviews)
                      </span>
                    </div>

                    {/* Price */}
                    <div className="mb-2 flex items-end justify-between">
                      <span className="text-base font-black text-slate-900">₹{p.price}</span>
                      {p.mrp && p.mrp > p.price && (
                        <span className="text-xs text-slate-400 line-through">₹{p.mrp}</span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <button
                        onClick={() => addToCart(p)}
                        className={`py-1.5 rounded-lg text-[11px] font-bold transition ${
                          cart[p._id]
                            ? 'bg-slate-700 text-white hover:bg-slate-800'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {cart[p._id] ? '✓ In Cart' : '🛒 Add'}
                      </button>
                      <button
                        onClick={() => handleBuyNow(p)}
                        className="py-1.5 rounded-lg text-[11px] font-bold bg-amber-600 text-white hover:bg-amber-700 transition"
                      >
                        💳 Buy
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Results Footer */}
            <div className="mt-12 text-center">
              <p className="text-gray-600 text-sm">
                Showing all {filtered.length} products • Curated for authentic wellness
              </p>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function AyurvedaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AyurvedaContent />
    </Suspense>
  );
}
