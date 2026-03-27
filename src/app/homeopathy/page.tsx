'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const CATEGORIES = ['All', 'Cold & Flu', 'Skin', 'Digestive', 'Mental Wellness', 'Joint & Pain', "Women's Health", 'Immunity', 'Children'];

const PRODUCTS = [
  { id: 1, name: 'Arnica Montana 30C', brand: 'SBL', category: 'Joint & Pain', price: 85, mrp: 110, discount: 23, icon: '🌼', rating: 4.7, reviews: 1892, desc: 'Most popular remedy for bruises, trauma, muscle soreness and shock', tag: 'Best Seller' },
  { id: 2, name: 'Nux Vomica 200C', brand: 'Dr. Reckeweg', category: 'Digestive', price: 120, mrp: 160, discount: 25, icon: '🫢', rating: 4.6, reviews: 1234, desc: 'For overindulgence, digestive disturbances and irritability', tag: '' },
  { id: 3, name: 'Calcarea Carbonica 30C', brand: 'Boiron', category: 'Children', price: 165, mrp: 220, discount: 25, icon: '🐚', rating: 4.5, reviews: 876, desc: 'Constitutional remedy for slow-developing children and bone health', tag: '' },
  { id: 4, name: 'Rhus Toxicodendron 30C', brand: 'SBL', category: 'Joint & Pain', price: 85, mrp: 110, discount: 23, icon: '🍂', rating: 4.6, reviews: 1432, desc: 'For stiffness and pain relieved by movement, arthritis & sprains', tag: '' },
  { id: 5, name: 'Bryonia Alba 30C', brand: 'Masood', category: 'Cold & Flu', price: 75, mrp: 100, discount: 25, icon: '🌡️', rating: 4.4, reviews: 987, desc: 'For dry cough, headache worse by movement, fever', tag: '' },
  { id: 6, name: 'Belladonna 30C', brand: 'Dr. Reckeweg', category: 'Cold & Flu', price: 120, mrp: 160, discount: 25, icon: '🔴', rating: 4.5, reviews: 765, desc: 'Sudden high fever, throbbing headache, red face and sore throat', tag: '' },
  { id: 7, name: 'Pulsatilla 200C', brand: 'Boiron', category: "Women's Health", price: 175, mrp: 230, discount: 24, icon: '💜', rating: 4.7, reviews: 2109, desc: 'For irregular periods, weeping disposition and hormonal imbalances', tag: 'Top Rated' },
  { id: 8, name: 'Sulphur 200C', brand: 'SBL', category: 'Skin', price: 95, mrp: 130, discount: 27, icon: '🌟', rating: 4.4, reviews: 1567, desc: 'Constitutional remedy for chronic skin conditions like eczema, psoriasis', tag: '' },
  { id: 9, name: 'Gelsemium 30C', brand: 'Masood', category: 'Mental Wellness', price: 75, mrp: 99, discount: 24, icon: '🎑', rating: 4.5, reviews: 843, desc: 'For anticipation anxiety, stage fright, weakness and trembling', tag: '' },
  { id: 10, name: 'Arsenicum Album 30C', brand: 'Dr. Reckeweg', category: 'Immunity', price: 120, mrp: 160, discount: 25, icon: '🛡️', rating: 4.8, reviews: 3241, desc: 'For food poisoning, weakness, restlessness, fear of disease', tag: 'Top Rated' },
  { id: 11, name: 'Lycopodium 200C', brand: 'Boiron', category: 'Digestive', price: 175, mrp: 230, discount: 24, icon: '🌾', rating: 4.6, reviews: 1109, desc: 'Bloating, flatulence, liver complaints, lack of confidence', tag: '' },
  { id: 12, name: 'Thuja Occidentalis 30C', brand: 'SBL', category: 'Skin', price: 85, mrp: 110, discount: 23, icon: '🌲', rating: 4.5, reviews: 987, desc: 'For warts, polyps, oily skin and ill-effects of vaccination', tag: '' },
];

export default function HomeopathyPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<number[]>([]);
  const [search, setSearch] = useState('');

  const redirectToLogin = () => {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    router.push(`/login?redirect=${encodeURIComponent(returnTo)}`);
  };

  const filtered = PRODUCTS.filter((p) => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = (id: number) => {
    setCart((prev) => [...prev, id]);
    try {
      const raw = localStorage.getItem('cart') || '[]';
      const c = JSON.parse(raw);
      const prod = PRODUCTS.find((p) => p.id === id)!;
      const existing = c.find((i: any) => i.id === `homeo-${id}`);
      if (existing) existing.quantity += 1;
      else c.push({ id: `homeo-${id}`, name: prod.name, price: prod.price, quantity: 1 });
      localStorage.setItem('cart', JSON.stringify(c));
      window.dispatchEvent(new Event('storage'));
    } catch {}
  };

  const handleBuyNow = (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      redirectToLogin();
      return;
    }
    addToCart(id);
    router.push('/cart');
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
            <p className="text-sm text-gray-500 mb-4">{filtered.length} remedies found</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((p) => (
                <article key={p.id} className="bg-white rounded-2xl border border-pink-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
                  <div className="relative h-40 bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center">
                    <span className="text-6xl">{p.icon}</span>
                    {!!p.discount && (
                      <span className="absolute top-2 right-2 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                        {p.discount}% OFF
                      </span>
                    )}
                    {p.tag && (
                      <span className="absolute top-2 left-2 text-[10px] px-2 py-1 rounded-full font-semibold bg-white/90 text-pink-700 border border-pink-200">
                        {p.tag}
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-[11px] uppercase tracking-wide text-pink-700 font-medium">{p.brand} • {p.category}</p>
                    <h3 className="mt-1 text-sm font-semibold text-slate-900 leading-5 line-clamp-2 min-h-[2.5rem]">{p.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[2rem]">{p.desc}</p>

                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-amber-500">★</span>
                        <span className="font-medium">{p.rating.toFixed(1)}</span>
                      </span>
                      <span className="text-slate-300">|</span>
                      <span>{p.reviews} reviews</span>
                    </div>

                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-slate-900">₹{p.price}</span>
                      <span className="text-xs text-slate-400 line-through">₹{p.mrp}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <button
                        onClick={() => addToCart(p.id)}
                        className={`py-2.5 rounded-xl text-xs font-semibold text-white transition ${
                          cart.includes(p.id) ? 'bg-slate-700 hover:bg-slate-800' : 'bg-pink-500 hover:bg-pink-600'
                        }`}
                      >
                        {cart.includes(p.id) ? 'In Cart' : 'Add to Cart'}
                      </button>
                      <button
                        onClick={() => handleBuyNow(p.id)}
                        className="py-2.5 rounded-xl text-xs font-semibold text-white transition bg-emerald-500 hover:bg-emerald-600"
                      >
                        💳 Buy Now
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
