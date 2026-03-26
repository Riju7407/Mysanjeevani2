'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const CATEGORIES = ['All', 'Immunity', 'Digestion', 'Stress Relief', 'Energy', 'Skin & Hair', 'Weight Management', 'Joint & Bone', "Women's Health", "Men's Health"];

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
    return ayurvedaProducts.filter((p) => {
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
  }, [ayurvedaProducts, selectedCategory, search]);

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
    <div className="min-h-screen bg-amber-50 flex flex-col">
      <Header />

      {/* Hero */}
      <div className="bg-linear-to-r from-amber-600 to-yellow-500 text-white py-10">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-extrabold mb-2">🌿 Ayurveda Store</h1>
          <p className="text-amber-100 text-lg mb-4">Ancient wisdom, modern wellness. 100% authentic Ayurvedic products.</p>
          <div className="flex flex-wrap gap-3 text-sm">
            {['100% Authentic', 'Ayush Certified', 'No Side Effects', 'Expert Curated'].map((b) => (
              <span key={b} className="bg-white/20 px-3 py-1 rounded-full">{b}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <input
            type="text"
            placeholder="Search Ayurvedic products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-96 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full md:w-48 shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-20">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Category</h3>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition ${
                      selectedCategory === cat ? 'bg-amber-100 text-amber-800 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-4">{filtered.length} products found</p>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-amber-200 p-4 animate-pulse">
                    <div className="h-16 bg-amber-50 rounded mb-3" />
                    <div className="h-4 bg-amber-50 rounded mb-2" />
                    <div className="h-3 bg-amber-50 rounded w-2/3 mb-3" />
                    <div className="h-8 bg-amber-50 rounded" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 bg-white border border-amber-200 rounded-2xl">
                <div className="text-5xl mb-3">🌿</div>
                <p className="text-gray-600 font-medium">No Ayurveda products found.</p>
                <p className="text-sm text-gray-500 mt-1">Ask vendor/admin to add approved Ayurveda products.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map((p) => (
                <article key={p._id} className="bg-white rounded-2xl border border-amber-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
                  <div className="relative h-40 bg-linear-to-br from-amber-50 to-yellow-50 flex items-center justify-center">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-6xl">{p.icon || '🌿'}</span>
                    )}
                    {!!(p.mrp && p.mrp > p.price) && (
                      <span className="absolute top-2 right-2 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                        {Math.round(((p.mrp! - p.price) / p.mrp!) * 100)}% OFF
                      </span>
                    )}
                    {(p.isPopular || p.benefit) && (
                      <span className="absolute top-2 left-2 text-[10px] px-2 py-1 rounded-full font-semibold bg-white/90 text-amber-700 border border-amber-200">
                        {p.isPopular ? 'Popular' : p.benefit}
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-[11px] uppercase tracking-wide text-amber-700 font-medium">{p.brand || 'MySanjeevani'} • {p.category}</p>
                    <h3 className="mt-1 text-sm font-semibold text-slate-900 leading-5 line-clamp-2 min-h-10">{p.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-8">{p.description || 'Authentic Ayurveda product for daily wellness support.'}</p>

                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-amber-500">★</span>
                        <span className="font-medium">{Number(p.rating || 0).toFixed(1)}</span>
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
                        className={`py-2.5 rounded-xl text-xs font-semibold text-white transition ${
                          cart[p._id] ? 'bg-slate-700 hover:bg-slate-800' : 'bg-amber-500 hover:bg-amber-600'
                        }`}
                      >
                        {cart[p._id] ? 'In Cart' : 'Add to Cart'}
                      </button>
                      <button
                        onClick={() => handleBuyNow(p)}
                        className="py-2.5 rounded-xl text-xs font-semibold text-white transition bg-emerald-500 hover:bg-emerald-600"
                      >
                        💳 Buy Now
                      </button>
                    </div>
                  </div>
                </article>
              ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
