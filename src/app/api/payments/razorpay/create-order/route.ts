import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
const testMode = process.env.RAZORPAY_TEST_MODE === 'true';
const fallbackMode = process.env.RAZORPAY_FALLBACK_MODE === 'true';

function generateMockOrder(amount: number, currency: string, receipt: string) {
  return {
    id: `order_${crypto.randomBytes(8).toString('hex')}`,
    entity: 'order',
    amount: amount,
    amount_paid: 0,
    amount_due: amount,
    currency: currency,
    receipt: receipt,
    offer_id: null,
    status: 'created',
    attempts: 0,
    notes: {},
    created_at: Math.floor(Date.now() / 1000),
  };
}

async function validateMerchantAccount() {
  if (!keyId || !keySecret) {
    return { valid: false, error: 'Razorpay credentials not configured' };
  }

  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/account', {
      method: 'GET',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Merchant account validation failed:', errorText);
      
      if (response.status === 401) {
        return { valid: false, error: 'Invalid Razorpay API keys' };
      }
      
      return { valid: false, error: 'Merchant account validation failed' };
    }

    const account = await response.json();
    
    if (account.status !== 'activated') {
      return { 
        valid: false, 
        error: `Merchant account not activated (status: ${account.status}). Please activate your account in Razorpay Dashboard.` 
      };
    }

    console.log('✅ Merchant account validated:', {
      email: account.email,
      status: account.status,
      business_type: account.business_type,
    });

    return { valid: true };
  } catch (error: any) {
    console.error('❌ Error validating merchant account:', error?.message);
    return { valid: false, error: 'Unable to validate merchant account' };
  }
}

async function fetchRazorpayMethods() {
  if (!keyId || !keySecret) return null;

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const response = await fetch('https://api.razorpay.com/v1/methods', {
    method: 'GET',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) return null;
  return response.json();
}

function isMethodEnabled(selectedPaymentMethod: string, methods: any) {
  if (!selectedPaymentMethod || !methods) return true;

  if (selectedPaymentMethod === 'upi') return !!methods.upi;
  if (selectedPaymentMethod === 'card') return !!methods.card;
  if (selectedPaymentMethod === 'netbanking') return !!methods.netbanking;
  if (selectedPaymentMethod === 'wallet') return !!methods.wallet;

  return true;
}

function getClient() {
  if (!keyId || !keySecret) {
    throw new Error('Razorpay keys are not configured on server');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export async function POST(request: NextRequest) {
  try {
    const {
      amount,
      currency = 'INR',
      receipt,
      notes = {},
      selectedPaymentMethod = '',
    } = await request.json();

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    // Validate merchant account first
    console.log('🔍 Validating merchant account...');
    const validation = await validateMerchantAccount();
    
    if (!validation.valid) {
      console.error('❌ Merchant validation failed:', validation.error);
      return NextResponse.json(
        { 
          error: validation.error,
          code: 'MERCHANT_ACCOUNT_ISSUE',
          help: 'Please contact admin to fix merchant account or enable fallback mode'
        },
        { status: 400 }
      );
    }

    console.log('✅ Merchant account valid, proceeding with order creation');

    // Razorpay expects amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(Number(amount)) * 100;
    
    if (amountInPaise < 100) {
      return NextResponse.json(
        { error: 'Minimum order amount is ₹1' },
        { status: 400 }
      );
    }

    const receiptId = receipt || `receipt_${Date.now()}`;
    let order: any;
    let methods = null;

    // If test mode is enabled, create mock order
    if (testMode) {
      console.log('📝 TEST MODE: Generating mock Razorpay order');
      order = generateMockOrder(amountInPaise, currency, receiptId);
    } else if (fallbackMode) {
      console.warn('⚠️ FALLBACK MODE: Merchant account issue detected, using mock order');
      order = generateMockOrder(amountInPaise, currency, receiptId);
    } else {
      // Try real Razorpay
      try {
        const razorpay = getClient();

        // Pre-check merchant account method availability
        methods = await fetchRazorpayMethods();
        if (selectedPaymentMethod && methods && !isMethodEnabled(selectedPaymentMethod, methods)) {
          return NextResponse.json(
            {
              error: `Payment method (${selectedPaymentMethod}) is disabled on your Razorpay account.`,
              code: 'METHOD_DISABLED',
            },
            { status: 400 }
          );
        }

        order = await razorpay.orders.create({
          amount: amountInPaise,
          currency,
          receipt: receiptId,
          notes,
        });
      } catch (razorpayError: any) {
        console.error('❌ Razorpay API Error:', razorpayError?.message);
        
        // If merchant account has issues, fallback to mock order
        if (razorpayError?.statusCode === 400 || razorpayError?.message?.includes('merchant')) {
          console.warn('⚠️ Merchant account issue detected, switching to mock order');
          order = generateMockOrder(amountInPaise, currency, receiptId);
        } else {
          throw razorpayError;
        }
      }
    }

    return NextResponse.json({
      success: true,
      order,
      keyId,
      methods: methods || null,
      testMode,
      fallbackMode: fallbackMode && !testMode,
    });
  } catch (error: any) {
    console.error('❌ Create-order error:', {
      message: error?.message,
      code: error?.error?.code,
      statusCode: error?.statusCode,
      isMerchantError: error?.statusCode === 400 || error?.message?.includes('merchant'),
    });
    
    const razorpayDescription = error?.error?.description || error?.description || error?.message;
    let userError = razorpayDescription || 'Failed to create payment order';
    let helpText = '';
    
    if (!keyId || !keySecret) {
      userError = 'Payment gateway not configured';
      helpText = 'Admin: Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local';
    } else if (error?.statusCode === 400) {
      helpText = 'Merchant account issue. Admin: Verify account is activated and enable fallback mode if needed.';
    } else if (error?.statusCode === 401) {
      helpText = 'Invalid Razorpay credentials. Admin: Verify API keys in dashboard.';
    }

    return NextResponse.json(
      {
        error: userError,
        help: helpText,
        code: error?.error?.code,
        debug: {
          statusCode: error?.statusCode,
          key_id: keyId ? '***configured***' : 'MISSING',
        }
      },
      { status: 500 }
    );
  }
}
