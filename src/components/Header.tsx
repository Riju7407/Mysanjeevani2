'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogoImage } from './Logo';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const router = useRouter();

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

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      {/* Top Bar - Similar to 1mg */}
      <div className="bg-linear-to-r from-emerald-600 to-emerald-500 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center gap-4">
            <span>Trusted by 5 Crore+ Indians</span>
            <span className="text-emerald-100">|</span>
            <span>India's Healthcare Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/help" className="hover:text-emerald-100">
              Help
            </Link>
            <Link href="/track" className="hover:text-emerald-100">
              Track Orders
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="h-12 w-12">
                <LogoImage />
              </div>
              <div className="text-xl font-bold hidden sm:block">
                <span className="text-emerald-600">My</span><span className="text-orange-500">Sanjeevani</span>
              </div>
            </Link>

            {/* Search Bar - Like 1mg */}
            <div className="hidden md:flex flex-1 mx-8">
              <div className="w-full relative">
                <input
                  type="text"
                  placeholder="Search for medicines, health conditions, products..."
                  className="w-full px-4 py-3 rounded-lg bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <button className="absolute right-3 top-3 text-gray-400">
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

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-700"
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {/* Category Navigation */}
          <div className="hidden md:flex gap-6 mt-4 text-sm text-gray-700 border-t border-gray-100 pt-3 flex-wrap">
            <Link href="/medicines" className="text-emerald-700 hover:text-orange-500 font-medium transition">Medicines</Link>
            <Link href="/doctor-consultation" className="text-emerald-700 hover:text-orange-500 font-medium transition">Consult Doctor</Link>
            <Link href="/lab-tests" className="text-emerald-700 hover:text-orange-500 font-medium transition">Lab Tests</Link>
            <Link href="/ayurveda" className="hover:text-orange-500 font-medium transition text-emerald-700">Ayurveda</Link>
            <Link href="/homeopathy" className="hover:text-orange-500 font-medium transition text-emerald-700">Homeopathy</Link>
            <Link href="/wellness" className="text-emerald-700 hover:text-orange-500 font-medium transition">Wellness</Link>
            <Link href="/health-blog" className="text-emerald-700 hover:text-orange-500 font-medium transition">Health Blog</Link>
            <Link href="/offers" className="hover:text-orange-500 font-medium transition text-emerald-700">Offers</Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 p-4 space-y-2">
          <Link href="/medicines" className="flex items-center gap-2 py-2 text-emerald-700 hover:text-orange-500" onClick={() => setIsMenuOpen(false)}>Medicines</Link>
          <Link href="/doctor-consultation" className="flex items-center gap-2 py-2 text-emerald-700 hover:text-orange-500" onClick={() => setIsMenuOpen(false)}>Consult Doctor</Link>
          <Link href="/lab-tests" className="flex items-center gap-2 py-2 text-emerald-700 hover:text-orange-500" onClick={() => setIsMenuOpen(false)}>Lab Tests</Link>
          <Link href="/ayurveda" className="flex items-center gap-2 py-2 text-emerald-700 hover:text-orange-500" onClick={() => setIsMenuOpen(false)}>Ayurveda</Link>
          <Link href="/homeopathy" className="flex items-center gap-2 py-2 text-emerald-700 hover:text-orange-500" onClick={() => setIsMenuOpen(false)}>Homeopathy</Link>
          <Link href="/wellness" className="flex items-center gap-2 py-2 text-emerald-700 hover:text-orange-500" onClick={() => setIsMenuOpen(false)}>Wellness</Link>
          <Link href="/health-blog" className="flex items-center gap-2 py-2 text-emerald-700 hover:text-orange-500" onClick={() => setIsMenuOpen(false)}>Health Blog</Link>
          <Link href="/offers" className="flex items-center gap-2 py-2 text-emerald-700 hover:text-orange-500" onClick={() => setIsMenuOpen(false)}>Offers</Link>
          <div className="border-t border-gray-100 pt-3"></div>
          <Link href="/login" className="block w-full text-center bg-linear-to-r from-emerald-600 to-emerald-700 text-white py-3 rounded-lg hover:from-emerald-700 hover:to-emerald-800 font-semibold shadow-md hover:shadow-lg transition duration-200">
            SignIn
          </Link>
          <Link href="/signup" className="block w-full text-center bg-linear-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 font-semibold shadow-md hover:shadow-lg transition duration-200">
            SignUp
          </Link>
          <Link href="/vendor/register" className="block w-full text-center bg-emerald-100 text-emerald-700 py-2 rounded-lg font-semibold hover:bg-emerald-200">
            Become a Vendor
          </Link>
        </div>
      )}
    </header>
  );
}
