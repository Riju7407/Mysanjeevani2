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

export default function HomeopathyPage() {
  const router = useRouter();

  const [products, setProducts] = useState<HomeopathyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    return products.filter((product) => {
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
  }, [products, selectedCategory, search]);

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
    <div className="min-h-screen bg-pink-50 flex flex-col">
      <Header />

      <div className="bg-linear-to-r from-pink-600 to-rose-400 text-white py-10">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-extrabold mb-2">🌸 Homeopathy Store</h1>
          <p className="text-pink-100 text-lg mb-4">
            Dynamic catalog powered by products added from admin and vendor panel.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            {['GMP Certified', '0% Side Effects', 'Safe for Kids', 'Expert Formulated'].map((badge) => (
              <span key={badge} className="bg-white/20 px-3 py-1 rounded-full">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2"><span className="text-xl">💧</span><span>Ultra-diluted medicines trigger the body's natural healing</span></div>
          <div className="flex items-center gap-2"><span className="text-xl">🧪</span><span>No chemical reactions or drug interactions</span></div>
          <div className="flex items-center gap-2"><span className="text-xl">👨‍⚕️</span><span>Seek a homeopathic doctor for chronic conditions</span></div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <input
            type="text"
            placeholder="Search homeopathy remedies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-96 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="flex flex-col md:flex-row gap-6">
          <aside className="w-full md:w-52 shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-20">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Category</h3>
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition ${
                      selectedCategory === category
                        ? 'bg-pink-100 text-pink-800 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {category}
                    <span className="float-right text-xs text-gray-400">
                      {category === 'All'
                        ? products.length
                        : products.filter((product) => product.category === category).length}
                    </span>
                  </button>
                ))}
              </div>

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

          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                    <div className="h-28 bg-gray-100 rounded mb-3" />
                    <div className="h-4 bg-gray-100 rounded mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-2/3 mb-3" />
                    <div className="h-8 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-4 text-sm">
                {error}
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">{filteredProducts.length} remedies found</p>

                {filteredProducts.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
                    <p className="text-gray-600 font-medium">No homeopathy products found.</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Add Homeopathy products from admin/vendor panel and approved active items will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map((product) => {
                      const productDiscount = product.mrp && product.mrp > product.price
                        ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                        : product.discount || 0;

                      return (
                        <article
                          key={product._id}
                          className="bg-white rounded-2xl border border-pink-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
                        >
                          <Link href={`/medicines/${product._id}`} className="relative h-40 bg-linear-to-br from-pink-50 to-rose-50 flex items-center justify-center">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-6xl">{product.icon || '🌸'}</span>
                            )}

                            {!!productDiscount && (
                              <span className="absolute top-2 right-2 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                {productDiscount}% OFF
                              </span>
                            )}

                            {!!product.benefit && (
                              <span className="absolute top-2 left-2 text-[10px] px-2 py-1 rounded-full font-semibold bg-white/90 text-pink-700 border border-pink-200">
                                {product.benefit}
                              </span>
                            )}
                          </Link>

                          <div className="p-4 flex flex-col flex-1">
                            <p className="text-[11px] uppercase tracking-wide text-pink-700 font-medium">
                              {product.brand || 'Homeopathy'} • {product.category}
                            </p>

                            <h3 className="mt-1 text-sm font-semibold text-slate-900 leading-5 line-clamp-2 min-h-[2.5rem]">
                              {product.name}
                            </h3>

                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[2rem]">
                              {product.description || 'Trusted homeopathy remedy for daily wellness support.'}
                            </p>

                            <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                              <span className="inline-flex items-center gap-1">
                                <span className="text-amber-500">★</span>
                                <span className="font-medium">{Number(product.rating || 0).toFixed(1)}</span>
                              </span>
                              <span className="text-slate-300">|</span>
                              <span>{product.reviews || 0} reviews</span>
                            </div>

                            <div className="mt-3 flex items-baseline gap-2">
                              <span className="text-lg font-bold text-slate-900">₹{product.price}</span>
                              {product.mrp ? (
                                <span className="text-xs text-slate-400 line-through">₹{product.mrp}</span>
                              ) : null}
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-4">
                              <button
                                onClick={() => addToCart(product)}
                                className={`py-2.5 rounded-xl text-xs font-semibold text-white transition ${
                                  cart[product._id]
                                    ? 'bg-slate-700 hover:bg-slate-800'
                                    : 'bg-pink-500 hover:bg-pink-600'
                                }`}
                              >
                                {cart[product._id] ? `In Cart (${cart[product._id]})` : 'Add to Cart'}
                              </button>

                              <button
                                onClick={() => handleBuyNow(product)}
                                className="py-2.5 rounded-xl text-xs font-semibold text-white transition bg-emerald-500 hover:bg-emerald-600"
                              >
                                Buy Now
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
