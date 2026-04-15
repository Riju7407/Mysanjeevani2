'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogoImage } from './Logo';
import CategoryNav from './CategoryNav';

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'bn', label: 'Bengali' },
  { code: 'te', label: 'Telugu' },
  { code: 'mr', label: 'Marathi' },
  { code: 'ta', label: 'Tamil' },
  { code: 'ur', label: 'Urdu' },
  { code: 'gu', label: 'Gujarati' },
  { code: 'kn', label: 'Kannada' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'pa', label: 'Punjabi' },
  { code: 'or', label: 'Odia' },
] as const;

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchRedirecting, setIsSearchRedirecting] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const router = useRouter();

  const getRootDomain = (hostname: string) => {
    const parts = hostname.split('.').filter(Boolean);
    if (parts.length < 2) return '';
    return `.${parts.slice(-2).join('.')}`;
  };

  const setTranslateCookies = (languageCode: string) => {
    const cookieValue = `/en/${languageCode}`;
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    const baseAttrs = `path=/; SameSite=Lax${secure}`;

    // Clear existing cookie variants first to avoid domain/path precedence issues.
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${baseAttrs}`;

    const hostname = window.location.hostname;
    if (hostname && hostname !== 'localhost' && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${baseAttrs}; domain=${hostname}`;
      const rootDomain = getRootDomain(hostname);
      if (rootDomain) {
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${baseAttrs}; domain=${rootDomain}`;
      }
    }

    // Set cookie on current host.
    document.cookie = `googtrans=${cookieValue}; ${baseAttrs}`;

    // Set additional domain-scoped variants for deployed environments.
    if (hostname && hostname !== 'localhost' && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      document.cookie = `googtrans=${cookieValue}; ${baseAttrs}; domain=${hostname}`;
      const rootDomain = getRootDomain(hostname);
      if (rootDomain) {
        document.cookie = `googtrans=${cookieValue}; ${baseAttrs}; domain=${rootDomain}`;
      }
    }
  };

  useEffect(() => {
    // Get user data from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }

    // Get cart count
    const cartStr = localStorage.getItem('cart');
    if (cartStr) {
      const cart = JSON.parse(cartStr);
      const count = cart.reduce((sum: number, item: any) => sum + item.quantity, 0);
      setCartCount(count);
    }

    // Listen for storage changes (cart updates from other components)
    const handleStorageChange = () => {
      const cartStr = localStorage.getItem('cart');
      if (cartStr) {
        const cart = JSON.parse(cartStr);
        const count = cart.reduce((sum: number, item: any) => sum + item.quantity, 0);
        setCartCount(count);
      } else {
        setCartCount(0);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const storedLanguage = localStorage.getItem('siteLanguage') || 'en';
    setSelectedLanguage(storedLanguage);
    setTranslateCookies(storedLanguage);

    if (!document.getElementById('google-translate-script')) {
      window.googleTranslateElementInit = () => {
        if (!window.google?.translate?.TranslateElement) return;
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            autoDisplay: false,
            includedLanguages: LANGUAGE_OPTIONS.map((opt) => opt.code).join(','),
          },
          'google_translate_element'
        );
      };

      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const changeLanguage = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    localStorage.setItem('siteLanguage', languageCode);
    setTranslateCookies(languageCode);
    setIsLanguageMenuOpen(false);
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('vendorToken');
    localStorage.removeItem('vendorInfo');
    setUser(null);
    setIsUserMenuOpen(false);
    window.dispatchEvent(new Event('storage'));
    router.replace('/');
  };

  const getSearchSection = (product: any) => {
    const productType = String(product?.productType || '').toLowerCase();
    const category = String(product?.category || '').toLowerCase();
    const subcategory = String(product?.subcategory || '').toLowerCase();

    if (productType.includes('ayurveda') || category.includes('ayurveda') || subcategory.includes('ayurveda')) {
      return 'ayurveda';
    }

    if (productType.includes('homeopathy') || category.includes('homeopathy') || subcategory.includes('homeopathy')) {
      return 'homeopathy';
    }

    return 'medicines';
  };

  const getBestSearchRoute = (products: any[]) => {
    const score = {
      medicines: 0,
      ayurveda: 0,
      homeopathy: 0,
    };

    for (const product of products) {
      const section = getSearchSection(product);
      score[section] += 1;
    }

    const bestSection = Object.entries(score).sort((a, b) => b[1] - a[1])[0]?.[0] || 'medicines';
    return bestSection;
  };

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) {
      router.push('/medicines#products-section');
      return;
    }

    setIsSearchRedirecting(true);
    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=120`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        router.push(`/medicines?search=${encodeURIComponent(q)}#products-section`);
        return;
      }

      const data = await response.json();
      const products = Array.isArray(data?.products) ? data.products : [];

      if (products.length === 0) {
        router.push(`/medicines?search=${encodeURIComponent(q)}#products-section`);
        return;
      }

      const bestSection = getBestSearchRoute(products);

      if (bestSection === 'ayurveda') {
        router.push(`/ayurveda?search=${encodeURIComponent(q)}`);
        return;
      }

      if (bestSection === 'homeopathy') {
        router.push(`/homeopathy?search=${encodeURIComponent(q)}`);
        return;
      }

      router.push(`/medicines?search=${encodeURIComponent(q)}#products-section`);
    } catch {
      router.push(`/medicines?search=${encodeURIComponent(q)}#products-section`);
    } finally {
      setIsSearchRedirecting(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      {/* Top Bar - Similar to 1mg */}
      <div className="bg-linear-to-r from-emerald-600 to-emerald-500 text-white py-2 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[11px] sm:text-sm gap-3">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <span className="truncate">Trusted by 5 Crore+ Indians</span>
            <span className="text-emerald-100 hidden sm:inline">|</span>
            <span className="hidden sm:inline">India's Healthcare Platform</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 shrink-0">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLanguageMenuOpen((prev) => !prev)}
                className="hover:text-emerald-100"
                aria-label="Change website language"
              >
                Language
              </button>
              {isLanguageMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-lg bg-white text-gray-800 shadow-lg border border-gray-200 z-60 max-h-72 overflow-auto">
                  {LANGUAGE_OPTIONS.map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => changeLanguage(option.code)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 ${
                        selectedLanguage === option.code ? 'bg-emerald-50 text-emerald-700 font-semibold' : ''
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link href="/help" className="hover:text-emerald-100">
              Help
            </Link>
            <Link href="/track" className="hover:text-emerald-100">
              Track Orders
            </Link>
          </div>
        </div>
      </div>

      <div id="google_translate_element" className="hidden" />

      {/* Main Navigation */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center gap-3">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                <LogoImage />
              </div>
              <div className="text-lg sm:text-xl font-bold hidden sm:block">
                <span className="text-emerald-600">My</span><span className="text-orange-500">Sanjeevni</span>
              </div>
            </Link>

            {/* Search Bar - Like 1mg */}
            <div className="hidden md:flex flex-1 mx-8">
              <div className="w-full relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  placeholder="Search for medicines, health conditions, products..."
                  className="w-full px-4 py-3 rounded-lg bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={isSearchRedirecting}
                  className="absolute right-3 top-3 text-gray-400 hover:text-emerald-600"
                  aria-label="Search"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Right Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/cart"
                className="relative flex items-center gap-2 text-emerald-700 hover:text-orange-500 transition"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m10 0l2-9m-8 9h8m-8 0a1 1 0 11-2 0 1 1 0 012 0zm8 0a1 1 0 11-2 0 1 1 0 012 0z"
                  />
                </svg>
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 text-emerald-700 hover:text-orange-500 transition"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50">
                    {user ? (
                      <>
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                          <p className="text-sm font-semibold text-gray-900">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-gray-600">{user.email}</p>
                        </div>
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          👤 My Profile
                        </Link>
                        <Link
                          href="/orders"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          📦 My Orders
                        </Link>
                        <Link
                          href="/addresses"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          🏠 Addresses
                        </Link>
                        {user.role === 'admin' && (
                          <>
                            <div className="border-t border-gray-100 my-2"></div>
                            <Link
                              href="/admin"
                              className="block px-4 py-2 text-blue-600 hover:bg-blue-50 font-medium"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              ⚙️ Admin Panel
                            </Link>
                          </>
                        )}
                        {user.role === 'doctor' && (
                          <>
                            <div className="border-t border-gray-100 my-2"></div>
                            <Link
                              href="/admin/consultations"
                              className="block px-4 py-2 text-emerald-600 hover:bg-emerald-50 font-medium"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              👨‍⚕️ Doctor Panel
                            </Link>
                          </>
                        )}
                        {user.role === 'vendor' && (
                          <>
                            <div className="border-t border-gray-100 my-2"></div>
                            <Link
                              href="/vendor/dashboard"
                              className="block px-4 py-2 text-emerald-600 hover:bg-emerald-50 font-medium"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              🏪 Vendor Dashboard
                            </Link>
                          </>
                        )}
                        <div className="border-t border-gray-100 my-2"></div>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                        >
                          🚪 Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          className="block px-4 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 font-medium transition duration-200"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          SignIn
                        </Link>
                        <Link
                          href="/signup"
                          className="block px-4 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 font-medium transition duration-200"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          SignUp
                        </Link>
                        <div className="border-t border-gray-100 my-2"></div>
                        <Link
                          href="/vendor/register"
                          className="block px-4 py-2 text-emerald-600 hover:bg-emerald-50 font-semibold"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          🏪 Become a Vendor
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="md:hidden flex items-center gap-2">
              <Link
                href="/cart"
                className="relative rounded-lg border border-gray-200 p-2 text-emerald-700"
                aria-label="Cart"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m10 0l2-9m-8 9h8m-8 0a1 1 0 11-2 0 1 1 0 012 0zm8 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 rounded-lg border border-gray-200 p-2"
                aria-label="Open menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden mt-3">
            <div className="w-full relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                placeholder="Search medicines and products..."
                className="w-full px-4 py-2.5 rounded-lg bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={isSearchRedirecting}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-emerald-600"
                aria-label="Search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Category Navigation */}
          <CategoryNav />
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 p-4 space-y-2 max-h-[75vh] overflow-y-auto">
          <CategoryNav isMobile={true} />
          <div className="border-t border-gray-100 pt-3"></div>
          <div className="rounded-lg border border-gray-200 p-3">
            <button
              type="button"
              onClick={() => setIsLanguageMenuOpen((prev) => !prev)}
              className="w-full flex items-center justify-between text-sm font-semibold text-emerald-700"
              aria-label="Change website language"
            >
              <span>
                Language: {LANGUAGE_OPTIONS.find((option) => option.code === selectedLanguage)?.label || 'English'}
              </span>
              <span className="text-gray-500">{isLanguageMenuOpen ? '▲' : '▼'}</span>
            </button>
            {isLanguageMenuOpen && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {LANGUAGE_OPTIONS.map((option) => (
                  <button
                    key={`mobile-${option.code}`}
                    type="button"
                    onClick={() => changeLanguage(option.code)}
                    className={`rounded-md border px-2 py-1.5 text-xs text-left ${
                      selectedLanguage === option.code
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold'
                        : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-gray-100 pt-3"></div>
          {user ? (
            <>
              <Link href="/profile" className="block w-full text-center bg-emerald-50 text-emerald-700 py-2.5 rounded-lg font-semibold hover:bg-emerald-100">
                My Profile
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-center bg-red-50 text-red-700 py-2.5 rounded-lg font-semibold hover:bg-red-100"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="block w-full text-center bg-linear-to-r from-emerald-600 to-emerald-700 text-white py-3 rounded-lg hover:from-emerald-700 hover:to-emerald-800 font-semibold shadow-md hover:shadow-lg transition duration-200">
                SignIn
              </Link>
              <Link href="/signup" className="block w-full text-center bg-linear-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 font-semibold shadow-md hover:shadow-lg transition duration-200">
                SignUp
              </Link>
              <Link href="/vendor/register" className="block w-full text-center bg-emerald-100 text-emerald-700 py-2 rounded-lg font-semibold hover:bg-emerald-200">
                Become a Vendor
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
