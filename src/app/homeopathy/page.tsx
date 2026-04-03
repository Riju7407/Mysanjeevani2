'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface HomeopathyProduct {
  _id: string;
  name: string;
  brand?: string;
  category: string;
  price: number;
  mrp?: number;
  discount?: number;
  icon?: string;
  image?: string;
  rating?: number;
  reviews?: number;
  description?: string;
  benefit?: string;
  stock?: number;
}

const DEFAULT_CATEGORIES = [
  'Cold & Flu',
  'Skin',
  'Digestive',
  'Mental Wellness',
  'Joint & Pain',
  "Women's Health",
  'Immunity',
  'Children',
];

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

export default function HomeopathyPage() {
  const router = useRouter();

  const [products, setProducts] = useState<HomeopathyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortOrder, setSortOrder] = useState('featured');

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});

  const categories = useMemo(() => {
    const dynamicCategories = Array.from(
      new Set(
        products
          .map((product) => (product.category || '').trim())
          .filter(Boolean)
      )
    );

    const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...dynamicCategories]));
    return ['All', ...merged];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory;

      const searchText = search.trim().toLowerCase();
      const matchesSearch =
        !searchText ||
        product.name.toLowerCase().includes(searchText) ||
        (product.brand || '').toLowerCase().includes(searchText) ||
        (product.description || '').toLowerCase().includes(searchText);

      return matchesCategory && matchesSearch;
    });

    // Apply sorting
    if (sortOrder === 'price-low') result.sort((a, b) => a.price - b.price);
    else if (sortOrder === 'price-high') result.sort((a, b) => b.price - a.price);
    else if (sortOrder === 'rating') result.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    return result;
  }, [products, selectedCategory, search, sortOrder]);

  useEffect(() => {
    const fetchHomeopathyProducts = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/products?productType=Homeopathy&limit=250', {
          cache: 'no-store',
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load homeopathy products');
        }

        setProducts(data.products || []);
      } catch (err: any) {
        setProducts([]);
        setError(err.message || 'Unable to load products right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchHomeopathyProducts();
  }, []);

  const redirectToLogin = () => {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    router.push(`/login?redirect=${encodeURIComponent(returnTo)}`);
  };

  const addToCart = (product: HomeopathyProduct) => {
    setCart((prev) => ({ ...prev, [product._id]: (prev[product._id] || 0) + 1 }));

    try {
      const raw = localStorage.getItem('cart') || '[]';
      const cartItems = JSON.parse(raw);
      const existing = cartItems.find((item: any) => item.id === product._id);

      if (existing) {
        existing.quantity += 1;
      } else {
        cartItems.push({
          id: product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
          brand: product.brand || 'Homeopathy',
          image: product.image || product.icon || '🌸',
          vendorName: 'MySanjeevani',
        });
      }

      localStorage.setItem('cart', JSON.stringify(cartItems));
      window.dispatchEvent(new Event('storage'));
    } catch {
      // Silent cart fallback for local storage parsing issues.
    }
  };

  const handleBuyNow = (product: HomeopathyProduct) => {
    const token = localStorage.getItem('token');
    if (!token) {
      redirectToLogin();
      return;
    }

    addToCart(product);
    router.push('/cart');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-rose-50 to-white flex flex-col">
      <Header />

      {/* Hero */}
      <div className="w-full -mt-48">
        <img src="/HB.png" alt="Homeopathy Store" className="w-full h-auto object-cover block" />
      </div>

      {/* Search & Filter Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-pink-200 shadow-sm -mt-40">
        <div className="max-w-7xl mx-auto px-4 py-1">
          <div className="flex flex-col gap-4 md:gap-0 md:flex-row md:items-center md:justify-between">
            {/* Search Bar */}
            <div className="flex-1 md:mr-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Search homeopathy remedies, brands, benefits..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border-2 border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition text-sm"
                />
              </div>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="border-2 border-pink-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-pink-400 transition text-sm font-medium text-gray-700"
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
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full font-medium text-sm transition-all flex-shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-pink-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-pink-100'
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
                {selectedCategory === 'All' ? '🌸 All Homeopathy Remedies' : `${selectedCategory}`}
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'remedy' : 'remedies'} available
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-pink-100 p-4 shadow-sm animate-pulse"
              >
                <div className="h-40 bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl mb-4" />
                <div className="h-4 bg-gray-200 rounded mb-3 w-3/4" />
                <div className="h-3 bg-gray-200 rounded mb-2 w-full" />
                <div className="h-3 bg-gray-200 rounded mb-4 w-1/2" />
                <div className="h-10 bg-pink-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-6 text-sm">
            <p className="font-semibold mb-1">⚠️ Error Loading Products</p>
            <p>{error}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white border-2 border-dashed border-pink-200 rounded-3xl shadow-sm">
            <div className="text-7xl mb-4 opacity-50">🌸</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No remedies found</h3>
            <p className="text-gray-600 mb-6">
              {search
                ? `We couldn't find any remedies matching "${search}"`
                : 'No remedies available in this category'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="px-6 py-2 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredProducts.map((product) => {
                const productDiscount = product.mrp && product.mrp > product.price
                  ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                  : product.discount || 0;

                return (
                  <article
                    key={product._id}
                    className="bg-white rounded-2xl border border-pink-100 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col group"
                  >
                    {/* Image Container */}
                    <Link href={`/medicines/${product._id}`} className="relative h-40 bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center overflow-hidden group-hover:brightness-95 transition-all"
                    >
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-7xl group-hover:scale-125 transition-transform duration-300">
                          {product.icon || '🌸'}
                        </span>
                      )}

                      {/* Badges */}
                      <div className="absolute inset-0 flex items-start justify-between p-3 pointer-events-none">
                        <div className="flex flex-col gap-2">
                          {product.benefit && (
                            <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-white/95 text-pink-700 border border-pink-200 backdrop-blur-sm">
                              ✨ {product.benefit}
                            </span>
                          )}
                        </div>
                        {!!productDiscount && (
                          <span className="bg-green-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
                            {productDiscount}% OFF
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1">
                      {/* Brand & Category */}
                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-pink-700 bg-pink-50 px-2 py-1 rounded-full">
                          {product.brand || 'Homeopathy'}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                          {product.category}
                        </span>
                      </div>

                      {/* Product Name */}
                      <Link href={`/medicines/${product._id}`}>
                        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 min-h-9 leading-tight hover:text-pink-700 transition">
                          {product.name}
                        </h3>
                      </Link>

                      {/* Description */}
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2 min-h-8">
                        {product.description || 'Trusted homeopathy remedy for wellness support'}
                      </p>

                      {/* Ratings */}
                      <div className="flex items-center gap-3 mt-2 py-2 border-t border-gray-100">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold">
                          <span className="text-pink-400">★</span>
                          <span className="text-gray-900">{Number(product.rating || 0).toFixed(1)}</span>
                        </span>
                        <span className="text-[10px] text-gray-500">
                          ({product.reviews || 0} reviews)
                        </span>
                      </div>

                      {/* Price */}
                      <div className="mt-3 flex items-center gap-2 py-2 border-t border-gray-100">
                        <span className="text-xl font-bold text-gray-900">₹{product.price}</span>
                        {product.mrp && product.mrp > product.price && (
                          <span className="text-xs text-gray-500 line-through">₹{product.mrp}</span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => addToCart(product)}
                          className={`py-2.5 rounded-xl text-xs font-bold transition-all transform hover:scale-105 active:scale-95 ${
                            cart[product._id]
                              ? 'bg-slate-700 text-white hover:bg-slate-800'
                              : 'bg-pink-500 text-white hover:bg-pink-600'
                          }`}
                        >
                          {cart[product._id] ? '✓ In Cart' : '🛒 Add'}
                        </button>
                        <button
                          onClick={() => handleBuyNow(product)}
                          className="py-2.5 rounded-xl text-xs font-bold bg-green-500 text-white hover:bg-green-600 transition-all transform hover:scale-105 active:scale-95"
                        >
                          💳 Buy
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
                Showing all {filteredProducts.length} remedies • Certified homeopathy products
              </p>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
