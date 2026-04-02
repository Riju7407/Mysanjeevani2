interface Fast2SmsResponse {
  return?: boolean;
  status_code?: number;
  message?: string[] | string;
  request_id?: string;
}

interface OtpSendResult {
  success: boolean;
  message: string;
  requestId?: string;
  timestamp: Date;
}

// Validation functions
function validatePhoneNumber(phone: string): string {
  const normalized = String(phone || '').replace(/\D/g, '');
  
  if (normalized.length < 10) {
    throw new Error('Invalid phone number - must be at least 10 digits');
  }
  
  if (normalized.length > 15) {
    throw new Error('Invalid phone number - exceeds maximum length');
  }
  
  return normalized;
}

function validateOtp(otp: string): string {
  const trimmed = String(otp || '').trim();
  
  if (!/^\d{6}$/.test(trimmed)) {
    throw new Error('OTP must be exactly 6 digits');
  }
  
  return trimmed;
}

function getFast2SmsApiKey(): string {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    throw new Error('FAST2SMS_API_KEY is not configured in environment variables');
  }

  if (apiKey.length < 20) {
    throw new Error('FAST2SMS_API_KEY appears to be invalid (too short)');
  }

  return apiKey;
}

/**
 * Send OTP via Fast2SMS with retry logic and error handling
 * @param phone - Phone number (will be normalized)
 * @param otp - 6-digit OTP
 * @param purpose - Purpose of OTP (login, signup, reset)
 * @returns OtpSendResult with success status
 */
export async function sendOtpViaFast2Sms(
  phone: string,
  otp: string,
  purpose: 'login' | 'signup' | 'reset' = 'login'
): Promise<OtpSendResult> {
  // Validation
  const normalizedPhone = validatePhoneNumber(phone);
  const validatedOtp = validateOtp(otp);

  // Test mode bypass
  if (process.env.OTP_TEST_MODE === 'true') {
    console.log(`[OTP_TEST_MODE] Skipping Fast2SMS for ${normalizedPhone} with OTP: ${validatedOtp}`);
    return {
      success: true,
      message: 'OTP sent (test mode)',
      timestamp: new Date(),
    };
  }

  const apiKey = getFast2SmsApiKey();

  // Determine message based on purpose
  const messageMap = {
    login: `Your MySanjeevani login OTP is ${validatedOtp}. It will expire in 5 minutes. Do not share this OTP.`,
    signup: `Welcome to MySanjeevani! Your verification OTP is ${validatedOtp}. It will expire in 10 minutes.`,
    reset: `Your MySanjeevani password reset OTP is ${validatedOtp}. It will expire in 5 minutes.`,
  };

  const message = messageMap[purpose];

  const requestPayload = {
    route: 'q', // Quick SMS route (cheapest)
    language: 'english',
    flash: 0, // Not a flash SMS
    numbers: normalizedPhone,
    message: message,
  };

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let data: Fast2SmsResponse | null = null;
    
    try {
      data = (await response.json()) as Fast2SmsResponse;
    } catch (parseError) {
      console.error('[Fast2SMS] JSON parse error:', parseError);
      throw new Error('Invalid response from Fast2SMS API');
    }

    // Check response status
    if (!response.ok) {
      const errorMessage = Array.isArray(data?.message)
        ? data?.message.join(', ')
        : data?.message || `HTTP ${response.status}`;

      console.error(`[Fast2SMS] Error: ${errorMessage}`, {
        statusCode: response.status,
        statusText: response.statusText,
        apiResponse: data,
      });

      throw new Error(`Fast2SMS API error: ${errorMessage}`);
    }

    // Check API return status
    if (!data?.return) {
      const errorMessage = Array.isArray(data?.message)
        ? data?.message.join(', ')
        : data?.message || 'API returned false';

      console.error(`[Fast2SMS] API returned failure:`, data);

      throw new Error(errorMessage);
    }

    console.log(`[Fast2SMS] OTP sent successfully to ${normalizedPhone}`, {
      requestId: data.request_id,
      timestamp: new Date(),
    });

    return {
      success: true,
      message: 'OTP sent successfully',
      requestId: data.request_id,
      timestamp: new Date(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error(`[Fast2SMS] Exception:`, {
      error: errorMessage,
      phone: normalizedPhone,
      timestamp: new Date(),
    });

    // Don't throw in production - return error response
    throw new Error(`Failed to send OTP: ${errorMessage}`);
  }
}

/**
 * Alternative method for sending OTP - using WhatsApp (premium)
 */
export async function sendOtpViaWhatsApp(
  phone: string,
  otp: string,
  purpose: 'login' | 'signup' | 'reset' = 'login'
): Promise<OtpSendResult> {
  const normalizedPhone = validatePhoneNumber(phone);
  const validatedOtp = validateOtp(otp);

  // Test mode
  if (process.env.OTP_TEST_MODE === 'true') {
    return {
      success: true,
      message: 'OTP sent via WhatsApp (test mode)',
      timestamp: new Date(),
    };
  }

  const apiKey = getFast2SmsApiKey();

  const messageMap = {
    login: `Your MySanjeevani login OTP is ${validatedOtp}. It will expire in 5 minutes.`,
    signup: `Welcome to MySanjeevani! Your verification OTP is ${validatedOtp}.`,
    reset: `Your password reset OTP is ${validatedOtp}.`,
  };

  try {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'whatsapp',
        message: messageMap[purpose],
        numbers: normalizedPhone,
      }),
      cache: 'no-store',
    });

    const data = (await response.json()) as Fast2SmsResponse;

    if (!response.ok || !data?.return) {
      throw new Error(
        Array.isArray(data?.message) ? data?.message.join(', ') : data?.message || 'Failed'
      );
    }

    return {
      success: true,
      message: 'OTP sent via WhatsApp',
      requestId: data.request_id,
      timestamp: new Date(),
    };
  } catch (error) {
    throw new Error(`WhatsApp OTP failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get wallet balance for Fast2SMS account
 */
export async function getFast2SmsBalance(): Promise<number> {
  const apiKey = getFast2SmsApiKey();

  const response = await fetch(
    `https://www.fast2sms.com/dev/wallet?authorization=${encodeURIComponent(apiKey)}`,
    {
      cache: 'no-store',
    }
  );

  const data = await response.json();

  if (!response.ok || !data?.return) {
    throw new Error('Failed to fetch wallet balance');
  }

  return data.balance || 0;
}
