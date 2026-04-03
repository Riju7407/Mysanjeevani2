'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const CATEGORIES = ['All', 'Immunity', 'Digestion', 'Stress Relief', 'Energy', 'Skin & Hair', 'Weight Management', 'Joint & Bone', "Women's Health", "Men's Health"];
const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

interface Product {
  _id: string;
  name: string;
  brand?: string;
  category: string;
  price: number;
  mrp?: number;
  icon?: string;
  image?: string;
  rating?: number;
  reviews?: number;
  description?: string;
  benefit?: string;
  productType?: string;
  isPopular?: boolean;
}

function normalizeCategory(value?: string) {
  const category = (value || '').trim().toLowerCase();
  if (category === 'ayurvedic' || category === 'ayurveda') return 'Ayurveda';
  return value || '';
}

function isAyurvedaProduct(product: Product) {
  const productType = (product.productType || '').trim().toLowerCase();
  const normalizedCategory = normalizeCategory(product.category);
  return (
    productType === 'ayurveda medicine' ||
    String(normalizedCategory).toLowerCase() === 'ayurveda' ||
    CATEGORIES.includes(product.category)
  );
}

export default function AyurvedaPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('featured');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
        p.category === selectedCategory ||
        p.benefit === selectedCategory;
      const keyword = search.toLowerCase();
      const matchSearch =
        !keyword ||
        p.name.toLowerCase().includes(keyword) ||
        (p.brand || '').toLowerCase().includes(keyword) ||
        (p.description || '').toLowerCase().includes(keyword);
      return matchCat && matchSearch;
    });

    // Apply sorting
    if (sortOrder === 'price-low') result.sort((a, b) => a.price - b.price);
    else if (sortOrder === 'price-high') result.sort((a, b) => b.price - a.price);
    else if (sortOrder === 'rating') result.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    return result;
  }, [ayurvedaProducts, selectedCategory, search, sortOrder]);

  const addToCart = (product: Product) => {
    setCart((prev) => ({ ...prev, [product._id]: (prev[product._id] || 0) + 1 }));
    // Also update localStorage cart
    try {
      const raw = localStorage.getItem('cart') || '[]';
      const c = JSON.parse(raw);
      const existing = c.find((i: any) => i.id === product._id);
      if (existing) existing.quantity += 1;
      else c.push({ id: product._id, name: product.name, price: product.price, quantity: 1, brand: product.brand, image: product.image || product.icon || '🌿', vendorName: 'MySanjeevani' });
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
      <div className="flex-1 max-w-7xl mx-auto px-4 py-10 w-full">
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filtered.map((p) => (
                <article
                  key={p._id}
                  className="bg-white rounded-2xl border border-amber-100 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col group"
                >
                  {/* Image Container */}
                  <div className="relative h-48 bg-gradient-to-br from-amber-50 to-yellow-50 flex items-center justify-center overflow-hidden">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-7xl group-hover:scale-125 transition-transform duration-300">
                        {p.icon || '🌿'}
                      </span>
                    )}

                    {/* Badges */}
                    <div className="absolute inset-0 flex items-start justify-between p-3 pointer-events-none">
                      <div className="flex flex-col gap-2">
                        {(p.isPopular || p.benefit) && (
                          <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-white/95 text-amber-700 border border-amber-200 backdrop-blur-sm">
                            {p.isPopular ? '⭐ Popular' : `✨ ${p.benefit}`}
                          </span>
                        )}
                      </div>
                      {!!(p.mrp && p.mrp > p.price) && (
                        <span className="bg-green-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
                          {Math.round(((p.mrp! - p.price) / p.mrp!) * 100)}% OFF
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    {/* Brand & Category */}
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                        {p.brand || 'MySanjeevani'}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                        {p.category}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-2 min-h-9 leading-tight">
                      {p.name}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2 min-h-8">
                      {p.description || 'Authentic Ayurveda wellness product'}
                    </p>

                    {/* Ratings */}
                    <div className="flex items-center gap-3 mt-2 py-2 border-t border-gray-100">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold">
                        <span className="text-amber-400">★</span>
                        <span className="text-gray-900">{Number(p.rating || 0).toFixed(1)}</span>
                      </span>
                      <span className="text-[10px] text-gray-500">
                        ({p.reviews || 0} reviews)
                      </span>
                    </div>

                    {/* Price */}
                    <div className="mt-3 flex items-center gap-2 py-2 border-t border-gray-100">
                      <span className="text-xl font-bold text-gray-900">₹{p.price}</span>
                      {p.mrp && p.mrp > p.price && (
                        <span className="text-xs text-gray-500 line-through">₹{p.mrp}</span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => addToCart(p)}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-all transform hover:scale-105 active:scale-95 ${
                          cart[p._id]
                            ? 'bg-slate-700 text-white hover:bg-slate-800'
                            : 'bg-amber-500 text-white hover:bg-amber-600'
                        }`}
                      >
                        {cart[p._id] ? '✓ In Cart' : '🛒 Add'}
                      </button>
                      <button
                        onClick={() => handleBuyNow(p)}
                        className="py-2.5 rounded-xl text-xs font-bold bg-green-500 text-white hover:bg-green-600 transition-all transform hover:scale-105 active:scale-95"
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
