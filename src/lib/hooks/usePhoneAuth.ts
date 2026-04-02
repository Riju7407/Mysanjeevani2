import { useState, useCallback } from 'react';

export interface SignupFormData {
  phone: string;
  fullName: string;
  email?: string;
  role?: 'user' | 'vendor' | 'doctor';
}

export interface OtpVerificationData {
  phone: string;
  otp: string;
  fullName: string;
  email?: string;
  role?: string;
}

export interface SignupResponse {
  message: string;
  user: {
    id: string;
    phone: string;
    email?: string;
    fullName: string;
    role: string;
  };
  sessionToken: string;
  requiresApproval?: boolean;
}

export interface OtpSendResponse {
  message: string;
  phone: string;
  cooldownSeconds: number;
  expiresIn: number;
  otp_code?: string; // Debug mode only
}

export interface UsePhoneAuthReturn {
  // State
  isLoading: boolean;
  error: string | null;
  phone: string;
  fullName: string;
  email: string;
  otpStep: 'info' | 'otp';
  otpSent: boolean;
  cooldownSeconds: number;
  otpExpiry: number;
  debugOtp: string | null;

  // Methods
  setPhone: (phone: string) => void;
  setFullName: (name: string) => void;
  setEmail: (email: string) => void;
  sendOtp: () => Promise<void>;
  verifyOtp: (otp: string) => Promise<SignupResponse>;
  resendOtp: () => Promise<void>;
  reset: () => void;
}

/**
 * React hook for phone-based authentication (signup and login)
 */
export function usePhoneAuth(role: 'user' | 'vendor' | 'doctor' = 'user'): UsePhoneAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [otpStep, setOtpStep] = useState<'info' | 'otp'>('info');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState(0);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  // Cleanup error after 5 seconds
  const setErrorWithTimeout = useCallback((msg: string) => {
    setError(msg);
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Cooldown timer
  const startCooldown = useCallback((seconds: number) => {
    setCooldownSeconds(seconds);
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Expiry timer
  const startExpiryTimer = useCallback((seconds: number) => {
    setOtpExpiry(seconds);
    const interval = setInterval(() => {
      setOtpExpiry((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  /**
   * Step 1: Send OTP to phone number
   */
  const sendOtp = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Validation
      if (!phone.trim() || !fullName.trim()) {
        throw new Error('Please enter your phone number and name');
      }

      const phoneDigits = String(phone).replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        throw new Error('Phone number must be at least 10 digits');
      }

      if (fullName.length < 2) {
        throw new Error('Name must be at least 2 characters');
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Invalid email format');
      }

      // API call
      const response = await fetch('/api/auth/phone/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          fullName: fullName.trim(),
          email: email.trim() || undefined,
          role,
        }),
      });

      if (!response.ok) {
        const data = await response.json();

        if (data.alreadyExists) {
          throw new Error(
            data.suggestedAction === 'login'
              ? 'This phone is already registered. Please login instead.'
              : data.error
          );
        }

        throw new Error(data.error || `Failed to send OTP (${response.status})`);
      }

      const data: OtpSendResponse = await response.json();

      setOtpSent(true);
      setOtpStep('otp');
      startCooldown(data.cooldownSeconds);
      startExpiryTimer(data.expiresIn);

      // Debug mode
      if (data.otp_code) {
        setDebugOtp(data.otp_code);
        console.log(`[DEBUG] OTP Code: ${data.otp_code}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP';
      setErrorWithTimeout(message);
      setOtpStep('info');
    } finally {
      setIsLoading(false);
    }
  }, [phone, fullName, email, role, startCooldown, startExpiryTimer, setErrorWithTimeout]);

  /**
   * Step 2: Verify OTP and create account
   */
  const verifyOtp = useCallback(
    async (otp: string): Promise<SignupResponse> => {
      setError(null);
      setIsLoading(true);

      try {
        if (!otp || otp.length !== 6) {
          throw new Error('OTP must be 6 digits');
        }

        const response = await fetch('/api/auth/phone/register-confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: phone.trim(),
            otp: otp.trim(),
            fullName: fullName.trim(),
            email: email.trim() || undefined,
            role,
          }),
        });

        if (!response.ok) {
          const data = await response.json();

          if (data.alreadyExists) {
            throw new Error(
              'This phone is already registered. Please login instead.'
            );
          }

          throw new Error(data.error || `Verification failed (${response.status})`);
        }

        const data: SignupResponse = await response.json();

        // Store session token in localStorage
        localStorage.setItem('auth_token', data.sessionToken);
        localStorage.setItem('user_role', data.user.role);

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'OTP verification failed';
        setErrorWithTimeout(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [phone, fullName, email, role, setErrorWithTimeout]
  );

  /**
   * Resend OTP
   */
  const resendOtp = useCallback(async () => {
    if (cooldownSeconds > 0) {
      setErrorWithTimeout(`Please wait ${cooldownSeconds} seconds before resending`);
      return;
    }

    await sendOtp();
  }, [cooldownSeconds, sendOtp, setErrorWithTimeout]);

  /**
   * Reset form
   */
  const reset = useCallback(() => {
    setPhone('');
    setFullName('');
    setEmail('');
    setOtpStep('info');
    setOtpSent(false);
    setCooldownSeconds(0);
    setOtpExpiry(0);
    setError(null);
    setDebugOtp(null);
  }, []);

  return {
    // State
    isLoading,
    error,
    phone,
    fullName,
    email,
    otpStep,
    otpSent,
    cooldownSeconds,
    otpExpiry,
    debugOtp,

    // Methods
    setPhone,
    setFullName,
    setEmail,
    sendOtp,
    verifyOtp,
    resendOtp,
    reset,
  };
}

/**
 * Hook for phone login
 */
export function usePhoneLogin(role: 'user' | 'vendor' | 'doctor' = 'user') {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'otp'>('phone');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState(0);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  const setErrorWithTimeout = useCallback((msg: string) => {
    setError(msg);
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, []);

  const startCooldown = useCallback((seconds: number) => {
    setCooldownSeconds(seconds);
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const startExpiryTimer = useCallback((seconds: number) => {
    setOtpExpiry(seconds);
    const interval = setInterval(() => {
      setOtpExpiry((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  /**
   * Request OTP for login
   */
  const sendLoginOtp = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      if (!phone.trim()) {
        throw new Error('Please enter your phone number');
      }

      const phoneDigits = String(phone).replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        throw new Error('Phone number must be at least 10 digits');
      }

      const response = await fetch('/api/auth/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          role,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to send OTP (${response.status})`);
      }

      const data: OtpSendResponse = await response.json();

      setOtpStep('otp');
      startCooldown(data.cooldownSeconds);
      startExpiryTimer(data.expiresIn);

      if (data.otp_code) {
        setDebugOtp(data.otp_code);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP';
      setErrorWithTimeout(message);
    } finally {
      setIsLoading(false);
    }
  }, [phone, role, startCooldown, startExpiryTimer, setErrorWithTimeout]);

  /**
   * Verify OTP and login
   */
  const verifyLoginOtp = useCallback(
    async (otp: string) => {
      setError(null);
      setIsLoading(true);

      try {
        if (!otp || otp.length !== 6) {
          throw new Error('OTP must be 6 digits');
        }

        const response = await fetch('/api/auth/phone/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: phone.trim(),
            otp: otp.trim(),
            role,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || `Login failed (${response.status})`);
        }

        const data = await response.json();

        // Store session token
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_role', data.user.role);

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'OTP verification failed';
        setErrorWithTimeout(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [phone, role, setErrorWithTimeout]
  );

  /**
   * Resend OTP
   */
  const resendLoginOtp = useCallback(async () => {
    if (cooldownSeconds > 0) {
      setErrorWithTimeout(`Please wait ${cooldownSeconds} seconds before resending`);
      return;
    }

    await sendLoginOtp();
  }, [cooldownSeconds, sendLoginOtp, setErrorWithTimeout]);

  const reset = useCallback(() => {
    setPhone('');
    setOtpStep('phone');
    setCooldownSeconds(0);
    setOtpExpiry(0);
    setError(null);
    setDebugOtp(null);
  }, []);

  return {
    isLoading,
    error,
    phone,
    setPhone,
    otpStep,
    cooldownSeconds,
    otpExpiry,
    debugOtp,
    sendLoginOtp,
    verifyLoginOtp,
    resendLoginOtp,
    reset,
  };
}
