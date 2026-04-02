'use client';

import { useCallback } from 'react';

/**
 * Razorpay Integration Hook
 * Handles order creation and payment verification with Razorpay
 */
export const useRazorpayPayment = () => {
  // Load Razorpay script
  const loadRazorpayScript = useCallback(async (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  /**
   * Create a Razorpay order for product purchase
   */
  const createOrder = useCallback(
    async (payload: {
      userId: string;
      items: any[];
      totalPrice: number;
      deliveryAddress: string;
      notes?: Record<string, any>;
    }) => {
      try {
        const response = await fetch('/api/payments/razorpay/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create order');
        }

        const data = await response.json();
        return data;
      } catch (error: any) {
        console.error('Order creation error:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Initiate Razorpay payment
   */
  const initiatePayment = useCallback(
    async (options: {
      orderId: string;
      razorpayOrderId: string;
      amount: number;
      userEmail: string;
      userName: string;
      userPhone: string;
    }) => {
      try {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error('Failed to load Razorpay');
        }

        return new Promise((resolve, reject) => {
          const paymentOptions = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            order_id: options.razorpayOrderId,
            amount: Math.round(options.amount * 100), // Amount in paise
            currency: 'INR',
            name: 'MySanjeevani',
            description: 'Order Payment',
            prefill: {
              email: options.userEmail,
              name: options.userName,
              contact: options.userPhone,
            },
            theme: {
              color: '#16a34a',
            },
            handler: async (response: any) => {
              try {
                // Verify payment
                const verifyResponse = await fetch(
                  '/api/payments/razorpay/verify-order-payment',
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                      orderId: options.orderId,
                    }),
                  }
                );

                const verifyData = await verifyResponse.json();

                if (verifyData.verified) {
                  resolve({
                    success: true,
                    paymentId: response.razorpay_payment_id,
                    orderId: options.orderId,
                    message: 'Payment successful',
                  });
                } else {
                  reject(new Error(verifyData.error || 'Payment verification failed'));
                }
              } catch (error: any) {
                reject(new Error(error.message || 'Payment verification error'));
              }
            },
            modal: {
              ondismiss: () => {
                reject(new Error('Payment cancelled by user'));
              },
            },
          };

          const razorpay = new (window as any).Razorpay(paymentOptions);
          razorpay.open();
        });
      } catch (error: any) {
        console.error('Payment initiation error:', error);
        throw error;
      }
    },
    [loadRazorpayScript]
  );

  /**
   * Complete checkout process (create order + initiate payment)
   */
  const checkout = useCallback(
    async (payload: {
      userId: string;
      items: any[];
      totalPrice: number;
      deliveryAddress: string;
      userEmail: string;
      userName: string;
      userPhone: string;
      notes?: Record<string, any>;
    }) => {
      try {
        // Step 1: Create order
        const orderData = await createOrder({
          userId: payload.userId,
          items: payload.items,
          totalPrice: payload.totalPrice,
          deliveryAddress: payload.deliveryAddress,
          notes: payload.notes,
        });

        // Step 2: Initiate payment
        const paymentResult = await initiatePayment({
          orderId: orderData.order._id,
          razorpayOrderId: orderData.order.razorpayOrderId,
          amount: payload.totalPrice,
          userEmail: payload.userEmail,
          userName: payload.userName,
          userPhone: payload.userPhone,
        });

        return paymentResult;
      } catch (error: any) {
        console.error('Checkout error:', error);
        throw error;
      }
    },
    [createOrder, initiatePayment]
  );

  /**
   * Get order details
   */
  const getOrderDetails = useCallback(async (orderId: string) => {
    try {
      const response = await fetch(
        `/api/payments/razorpay/order?orderId=${orderId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Fetch order error:', error);
      throw error;
    }
  }, []);

  return {
    loadRazorpayScript,
    createOrder,
    initiatePayment,
    checkout,
    getOrderDetails,
  };
};
