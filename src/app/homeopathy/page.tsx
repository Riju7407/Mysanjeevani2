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
  'SBL', 'Dr. Reckeweg', 'Willmar Schwabe', 'Adel Pekana', 'Schwabe India', 'Bjain', 'R S Bhargava', 'Baksons', 'REPL', 'New Life',
  '3X', '6X', '3 CH', '6 CH', '12 CH', '30 CH', '200 CH', '1000 CH', '10M CH', '50M CH', 'CM CH',
  'Mother Tinctures', 'Biochemic', 'Triturations', 'Bio Combination', 'Bach Flower', 'Homeopathy Kits', 'Milleimal LM Potency',
  'Hair Care', 'Skin Care', 'Oral Care',
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
          vendorName: 'MySanjeevni',
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
                const productDiscount = product.mrp && product.mrp > product.price
                  ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                  : product.discount || 0;

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
                          {product.icon || '🌸'}
                        </span>
                      )}

                      <div className="absolute inset-0 flex items-start justify-end p-3 pointer-events-none">
                        {!!productDiscount && (
                          <span className="text-[11px] font-bold text-emerald-600">
                            {productDiscount}% OFF
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3 flex flex-col flex-1">
                      <p className="font-medium text-slate-500 mb-1 uppercase tracking-wide text-[10px]">
                        {product.brand || 'MySanjeevni'}
                      </p>
                      <h3 className="font-bold text-slate-900 line-clamp-2 mb-2 text-xs min-h-8">{product.name}</h3>

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <span className="text-amber-500">★</span>
                          <span className="text-xs font-semibold text-slate-900">{Number(product.rating || 0).toFixed(1)}</span>
                          <span className="text-xs text-slate-500">({product.reviews || 0})</span>
                        </div>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            (product.stock || 0) > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {(product.stock || 0) > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>

                      <div className="mb-2 flex items-end justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-black text-slate-900">₹{product.price}</span>
                        {product.mrp && product.mrp > product.price && (
                            <span className="text-xs text-slate-400 line-through">₹{product.mrp}</span>
                        )}
                        </div>
                        {product.mrp && product.mrp > product.price && (
                          <span className="text-[11px] font-bold text-emerald-600">{productDiscount}% OFF</span>
                        )}
                      </div>

                      <div className="flex gap-2 mt-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          disabled={(product.stock || 0) <= 0}
                          className={`flex-1 rounded-lg font-bold transition py-1.5 text-[11px] ${
                            (product.stock || 0) <= 0
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
                          disabled={(product.stock || 0) <= 0}
                          className={`flex-1 rounded-lg font-bold text-white transition py-1.5 text-[11px] ${
                            (product.stock || 0) <= 0 ? 'bg-slate-400 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700'
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
