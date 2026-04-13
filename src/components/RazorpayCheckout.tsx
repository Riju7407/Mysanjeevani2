'use client';

import React, { useState } from 'react';
import { useRazorpayPayment } from '@/lib/hooks/useRazorpayPayment';
import { useRouter } from 'next/navigation';
import { OTPVerificationModal } from '@/components/OTPVerificationModal';

interface CheckoutProps {
  userId: string;
  cartItems: any[];
  totalPrice: number;
  userEmail: string;
  userName: string;
  userPhone: string;
}

/**
 * Example Checkout Component with Razorpay Integration
 * Usage:
 * <RazorpayCheckout 
 *   userId="user123" 
 *   cartItems={items}
 *   totalPrice={500}
 *   userEmail="user@example.com"
 *   userName="John Doe"
 *   userPhone="9999999999"
 * />
 */
export const RazorpayCheckout: React.FC<CheckoutProps> = ({
  userId,
  cartItems,
  totalPrice,
  userEmail,
  userName,
  userPhone,
}) => {
  const router = useRouter();
  const { checkout } = useRazorpayPayment();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [isOTPVerified, setIsOTPVerified] = useState(false);

  const handleCheckout = async () => {
    // First check if OTP is verified
    if (!isOTPVerified) {
      setShowOTPModal(true);
      return;
    }

    if (!deliveryAddress.trim()) {
      setError('Please enter delivery address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await checkout({
        userId,
        items: cartItems,
        totalPrice,
        deliveryAddress,
        userEmail,
        userName,
        userPhone,
      });

      // Payment successful
      const paymentResult = result as any;
      alert(`Payment successful! Order ID: ${paymentResult.paymentId}`);
      router.push(`/orders/${paymentResult.orderId}`);
    } catch (err: any) {
      setError(err.message || 'Checkout failed');
      console.error('Checkout error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Checkout</h2>

      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Order Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Items:</span>
            <span>{cartItems.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{totalPrice}</span>
          </div>
          <div className="border-t pt-2 mt-2 font-semibold flex justify-between">
            <span>Total:</span>
            <span>₹{totalPrice}</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Delivery Address
        </label>
        <textarea
          value={deliveryAddress}
          onChange={(e) => setDeliveryAddress(e.target.value)}
          placeholder="Enter complete delivery address"
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-green-500"
          rows={4}
          disabled={loading}
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded transition-colors"
      >
        {isOTPVerified ? (loading ? 'Processing...' : `Pay ₹${totalPrice}`) : 'Verify OTP & Pay'}
      </button>

      {/* OTP VERIFICATION MODAL */}
      <OTPVerificationModal
        isOpen={showOTPModal}
        userPhone={userPhone}
        onVerifySuccess={() => {
          setIsOTPVerified(true);
          setShowOTPModal(false);
        }}
        onClose={() => setShowOTPModal(false)}
      />
    </div>
  );
};

export default RazorpayCheckout;
