'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Product {
  _id: string;
  name: string;
  brand?: string;
  category: string;
  productType?: string;
  price: number;
  mrp?: number;
  stock: number;
  image?: string;
  icon?: string;
  benefit?: string;
  description?: string;
  rating?: number;
  reviews?: number;
}

const CATEGORIES = ['All', 'Cold & Flu', 'Skin', 'Digestive', 'Mental Wellness', 'Joint & Pain', "Women's Health", 'Immunity', 'Children'];

export default function HomeopathyPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cartItems, setCartItems] = useState<Record<string, number>>({});

  const redirectToLogin = () => {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    router.push(`/login?redirect=${encodeURIComponent(returnTo)}`);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products?limit=200', { cache: 'no-store' });
      const data = await res.json();
      const homeoProducts = (data.products || []).filter(
        (p: Product) => p.productType === 'Homeopathy' && p.category
      );
      setProducts(homeoProducts);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filtered = products.filter((p) => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = (product: Product) => {
    setCartItems((prev) => ({ ...prev, [product._id]: (prev[product._id] || 0) + 1 }));
    try {
      const raw = localStorage.getItem('cart') || '[]';
      const cart = JSON.parse(raw);
      const existing = cart.find((i: any) => i.id === product._id);
      if (existing) existing.quantity += 1;
      else {
        cart.push({
          id: product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
          brand: product.brand,
          image: product.image || product.icon || '🌸',
          vendorName: 'MySanjeevani',
        });
      }
      localStorage.setItem('cart', JSON.stringify(cart));
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

  const discountPercent = (product: Product) => {
    if (!product.mrp || product.mrp <= product.price) return 0;
    return Math.round(((product.mrp - product.price) / product.mrp) * 100);
  };

  return (
    <div className="min-h-screen bg-pink-50 flex flex-col">
      <Header />

      {/* Hero */}
      <div className="bg-gradient-to-r from-pink-600 to-rose-400 text-white py-10">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-extrabold mb-2">🌸 Homeopathy Store</h1>
          <p className="text-pink-100 text-lg mb-4">Gentle, safe and effective remedies for the whole family.</p>
          <div className="flex flex-wrap gap-3 text-sm">
            {['GMP Certified', '0% Side Effects', 'Safe for Kids', 'Expert Formulated'].map((b) => (
              <span key={b} className="bg-white/20 px-3 py-1 rounded-full">{b}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Educational banner */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2"><span className="text-xl">💧</span><span>Ultra-diluted medicines trigger the body&apos;s natural healing</span></div>
          <div className="flex items-center gap-2"><span className="text-xl">🧪</span><span>No chemical reactions or drug interactions</span></div>
          <div className="flex items-center gap-2"><span className="text-xl">👨‍⚕️</span><span>Seek a homeopathic doctor for chronic conditions</span></div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <input
            type="text"
            placeholder="Search Homeopathy remedies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-96 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full md:w-48 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-20">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Category</h3>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition ${
                      selectedCategory === cat ? 'bg-pink-100 text-pink-800 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Potency guide */}
              <div className="mt-6 p-3 bg-pink-50 rounded-lg">
                <h4 className="font-semibold text-xs text-pink-800 mb-2">Potency Guide</h4>
                <div className="space-y-1 text-xs text-gray-600">
                  <div><span className="font-medium">6C, 12C:</span> Acute use</div>
                  <div><span className="font-medium">30C:</span> Most common</div>
                  <div><span className="font-medium">200C:</span> Constitutional</div>
                  <div><span className="font-medium">1M+:</span> Deep chronic</div>
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading remedies...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No remedies found. Check back soon!</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">{filtered.length} remedies found</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filtered.map((p) => (
                    <article key={p._id} className="bg-white rounded-2xl border border-pink-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
                      <div className="relative h-40 bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="h-full w-full object-contain p-4" />
                        ) : (
                          <span className="text-6xl">{p.icon || '🌸'}</span>
                        )}
                        {discountPercent(p) > 0 && (
                          <span className="absolute top-2 right-2 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                            {discountPercent(p)}% OFF
                          </span>
                        )}
                      </div>

                      <div className="p-4 flex flex-col flex-1">
                        <p className="text-[11px] uppercase tracking-wide text-pink-700 font-medium">
                          {p.brand || 'MySanjeevani'} • {p.category}
                        </p>
                        <h3 className="mt-1 text-sm font-semibold text-slate-900 leading-5 line-clamp-2 min-h-[2.5rem]">{p.name}</h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[2rem]">{p.benefit || p.description || ''}</p>

                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <span className="text-amber-500">★</span>
                            <span className="font-medium">{(p.rating || 0).toFixed(1)}</span>
                          </span>
                          <span className="text-slate-300">|</span>
                          <span>{p.reviews || 0} reviews</span>
                        </div>

                        <div className="mt-3 flex items-baseline gap-2">
                          <span className="text-lg font-bold text-slate-900">₹{p.price}</span>
                          {p.mrp && p.mrp > p.price && (
                            <span className="text-xs text-slate-400 line-through">₹{p.mrp}</span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <button
                            onClick={() => addToCart(p)}
                            disabled={p.stock <= 0}
                            className={`py-2.5 rounded-xl text-xs font-semibold text-white transition ${
                              p.stock <= 0
                                ? 'bg-gray-400 cursor-not-allowed'
                                : cartItems[p._id]
                                  ? 'bg-slate-700 hover:bg-slate-800'
                                  : 'bg-pink-500 hover:bg-pink-600'
                            }`}
                          >
                            {p.stock <= 0 ? 'Out of Stock' : cartItems[p._id] ? 'In Cart' : 'Add to Cart'}
                          </button>
                          <button
                            onClick={() => handleBuyNow(p)}
                            disabled={p.stock <= 0}
                            className={`py-2.5 rounded-xl text-xs font-semibold text-white transition ${
                              p.stock <= 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600'
                            }`}
                          >
                            💳 Buy Now
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
