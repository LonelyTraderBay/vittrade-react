/**
 * Custom hooks for P2P API calls
 * Provides loading states, error handling, and data caching
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { p2pApi } from '../services/p2pApiService';
import type {
  KYCStatus,
  SecurityStatus,
  WalletBalance,
  TransactionLimits,
  AMLScreening,
  PaymentMethod,
} from '../services/p2pApiService';

// ═══════════════════════════════════════════════════════════
//  GENERIC API HOOK
// ═══════════════════════════════════════════════════════════

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function useApi<T>(
  apiCall: () => Promise<T>,
  deps: any[] = []
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiCall]);

  useEffect(() => {
    fetchData();
  }, deps);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

// ═══════════════════════════════════════════════════════════
//  KYC HOOKS
// ═══════════════════════════════════════════════════════════

/**
 * Get KYC status
 */
export function useKYCStatus() {
  return useApi<KYCStatus>(() => p2pApi.kyc.getStatus());
}

/**
 * Upload identity document
 */
export function useUploadIdentity() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const upload = async (file: File, docType: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await p2pApi.kyc.uploadIdentity(file, docType);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      if (mountedRef.current) setError(errorMsg);
      throw err;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  return { upload, loading, error };
}

/**
 * Submit selfie verification
 */
export function useSubmitSelfie() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const submit = async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      const result = await p2pApi.kyc.submitSelfie(file);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Submission failed';
      if (mountedRef.current) setError(errorMsg);
      throw err;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  return { submit, loading, error };
}

// ═══════════════════════════════════════════════════════════
//  SECURITY HOOKS
// ═══════════════════════════════════════════════════════════

/**
 * Get security status
 */
export function useSecurityStatus() {
  return useApi<SecurityStatus>(() => p2pApi.security.getStatus());
}

/**
 * Enable/Disable 2FA
 */
export function use2FA() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const enable = async (method: 'sms' | 'app' | 'email', code: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await p2pApi.security.enable2FA(method, code);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to enable 2FA';
      if (mountedRef.current) setError(errorMsg);
      throw err;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const disable = async (password: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await p2pApi.security.disable2FA(password);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to disable 2FA';
      if (mountedRef.current) setError(errorMsg);
      throw err;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  return { enable, disable, loading, error };
}

/**
 * Get trusted devices
 */
export function useTrustedDevices() {
  return useApi(() => p2pApi.security.getDevices());
}

/**
 * Get login history
 */
export function useLoginHistory() {
  return useApi(() => p2pApi.security.getLoginHistory());
}

// ═══════════════════════════════════════════════════════════
//  WALLET HOOKS
// ═══════════════════════════════════════════════════════════

/**
 * Get wallet balance
 */
export function useWalletBalance() {
  return useApi<WalletBalance>(() => p2pApi.wallet.getBalance());
}

/**
 * Transfer funds
 */
export function useWalletTransfer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const transfer = async (params: {
    asset: string;
    amount: number;
    direction: 'p2p_to_main' | 'main_to_p2p';
  }) => {
    try {
      setLoading(true);
      setError(null);
      const result = await p2pApi.wallet.transfer(params);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Transfer failed';
      if (mountedRef.current) setError(errorMsg);
      throw err;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  return { transfer, loading, error };
}

/**
 * Get escrow balance
 */
export function useEscrowBalance() {
  return useApi(() => p2pApi.wallet.getEscrowBalance());
}

/**
 * Get fund lock history
 */
export function useFundLockHistory() {
  return useApi(() => p2pApi.wallet.getFundLockHistory());
}

// ═══════════════════════════════════════════════════════════
//  COMPLIANCE HOOKS
// ═══════════════════════════════════════════════════════════

/**
 * Get transaction limits
 */
export function useTransactionLimits() {
  return useApi<TransactionLimits>(() => p2pApi.compliance.getLimits());
}

/**
 * Get AML status
 */
export function useAMLStatus() {
  return useApi<AMLScreening>(() => p2pApi.compliance.getAMLStatus());
}

/**
 * Submit source of funds
 */
export function useSubmitSourceOfFunds() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const submit = async (data: { source: string; details: string }) => {
    try {
      setLoading(true);
      setError(null);
      const result = await p2pApi.compliance.submitSourceOfFunds(data);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Submission failed';
      if (mountedRef.current) setError(errorMsg);
      throw err;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  return { submit, loading, error };
}

// ═══════════════════════════════════════════════════════════
//  PAYMENT METHOD HOOKS
// ═══════════════════════════════════════════════════════════

/**
 * Get payment methods
 */
export function usePaymentMethods() {
  return useApi<PaymentMethod[]>(() => p2pApi.paymentMethod.getPaymentMethods());
}

/**
 * Add payment method
 */
export function useAddPaymentMethod() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const add = async (data: { type: string; name: string; accountNumber: string }) => {
    try {
      setLoading(true);
      setError(null);
      const result = await p2pApi.paymentMethod.addPaymentMethod(data);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add payment method';
      if (mountedRef.current) setError(errorMsg);
      throw err;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  return { add, loading, error };
}

/**
 * Verify payment method
 */
export function useVerifyPaymentMethod() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const verify = async (methodId: string, amounts: number[]) => {
    try {
      setLoading(true);
      setError(null);
      const result = await p2pApi.paymentMethod.verifyPaymentMethod(methodId, amounts);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Verification failed';
      if (mountedRef.current) setError(errorMsg);
      throw err;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  return { verify, loading, error };
}

/**
 * Get payment method history
 */
export function usePaymentMethodHistory(methodId: string) {
  return useApi(() => p2pApi.paymentMethod.getPaymentMethodHistory(methodId), [methodId]);
}
