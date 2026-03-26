'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Order {
  id: string;
  userId: string;
  items: any[];
  totalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userStr);
    setUser(parsedUser);

    // Get user's orders from localStorage
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const userOrders = allOrders.filter((order: Order) => order.userId === parsedUser.id);
    setOrders(userOrders.reverse()); // Show latest first
  }, [router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'card':
        return '💳';
      case 'netbanking':
        return '🏦';
      case 'upi':
        return '📱';
      case 'wallet':
        return '💰';
      case 'bnpl':
        return '📅';
      case 'cod':
        return '🚚';
      default:
        return '💳';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <div className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600 mb-8">
            Track and manage all your orders
          </p>

          {orders.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📦</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No orders yet</h2>
              <p className="text-gray-600 mb-8">Start shopping to place your first order</p>
              <Link
                href="/medicines"
                className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-semibold transition"
              >
                Shop Now
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition cursor-pointer"
                  onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.id.toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold text-center ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <p className="text-right text-lg font-bold text-emerald-600">
                        ₹{order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-gray-200 border-b">
                    <div>
                      <p className="text-xs text-gray-600">Items</p>
                      <p className="font-semibold text-gray-900">{order.items.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Payment</p>
                      <p className="font-semibold text-gray-900">
                        {getPaymentIcon(order.paymentMethod)} {order.paymentMethod.toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Delivery</p>
                      <p className="font-semibold text-gray-900">Free</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Expected</p>
                      <p className="font-semibold text-gray-900">2-3 days</p>
                    </div>
                  </div>

                  {/* Expandable Order Details */}
                  {selectedOrder?.id === order.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-4">Order Items</h4>
                      <div className="space-y-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <div>
                              <p className="text-gray-900 font-medium">{item.name}</p>
                              <p className="text-gray-600 text-xs">{item.brand}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-gray-900 font-medium">Qty: {item.quantity}</p>
                              <p className="text-gray-600">₹{(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium">₹{(order.totalAmount * 0.9).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Discount:</span>
                          <span className="font-medium text-green-600">-₹{((order.totalAmount * 0.9) * 0.1).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Delivery:</span>
                          <span className="font-medium">FREE</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 font-bold">
                          <span>Total:</span>
                          <span className="text-emerald-600">₹{order.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="mt-6 flex gap-3">
                        <button
                          onClick={() => router.push(`/track?orderId=${encodeURIComponent(order.id)}`)}
                          className="flex-1 px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition"
                        >
                          📞 Track Order
                        </button>
                        <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition">
                          💬 Contact Support
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
