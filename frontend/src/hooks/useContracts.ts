import { useState, useEffect, useCallback } from 'react';
import { contractAPI, type PendingContract } from '@/lib/api';

interface UseContractsOptions {
  autoFetch?: boolean;
  onlyPending?: boolean;
}

interface UseContractsReturn {
  contracts: PendingContract[];
  isLoading: boolean;
  error: string;
  refetch: () => Promise<void>;
  clearError: () => void;
}

// Cache to prevent duplicate API calls
let contractsCache: PendingContract[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5000; // 5 seconds

export function useContracts(options: UseContractsOptions = {}): UseContractsReturn {
  const { autoFetch = true, onlyPending = false } = options;
  
  const [contracts, setContracts] = useState<PendingContract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchContracts = useCallback(async (retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s
    
    try {
      setIsLoading(true);
      setError('');

      // Check cache first (skip cache on retry)
      const now = Date.now();
      if (retryCount === 0 && contractsCache && (now - cacheTimestamp) < CACHE_DURATION) {
        console.log('Using cached contracts data');
        const filteredContracts = onlyPending 
          ? contractsCache.filter(c => c.status === 'pending')
          : contractsCache;
        setContracts(filteredContracts);
        setIsLoading(false);
        return;
      }

      console.log(`Fetching contracts (onlyPending: ${onlyPending}, retry: ${retryCount})`);
      
      let response;
      if (onlyPending) {
        response = await contractAPI.getPendingContracts();
      } else {
        // Try getAllContracts first, fallback to getPendingContracts
        try {
          response = await contractAPI.getAllContracts();
        } catch (apiError) {
          console.warn('getAllContracts failed, trying getPendingContracts:', apiError);
          response = await contractAPI.getPendingContracts();
        }
      }

      if (response && response.success) {
        const contractsArray = response.contracts || [];
        setContracts(contractsArray);
        
        // Update cache only for getAllContracts
        if (!onlyPending) {
          contractsCache = contractsArray;
          cacheTimestamp = now;
        }
        
        console.log(`Loaded ${contractsArray.length} contracts`);
      } else {
        const errorMsg = response?.message || 'Failed to load contracts';
        setError(errorMsg);
        console.error('Contract API returned error:', errorMsg);
      }
    } catch (error) {
      console.error(`Error fetching contracts (attempt ${retryCount + 1}):`, error);
      
      // Check if we should retry
      const isRetryableError = error instanceof Error && (
        error.message.includes('timeout') ||
        error.message.includes('Network error') ||
        error.message.includes('ECONNABORTED')
      );
      
      if (isRetryableError && retryCount < maxRetries) {
        console.log(`Retrying in ${retryDelay}ms...`);
        setTimeout(() => {
          fetchContracts(retryCount + 1);
        }, retryDelay);
        return;
      }
      
      // Set error message for final failure
      let errorMessage = 'Failed to load contracts. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = `Request timed out after ${maxRetries + 1} attempts. Please check your connection and try again.`;
        } else if (error.message.includes('Network error')) {
          errorMessage = 'Network error. Please check if the server is running.';
        } else if (error.message.includes('401')) {
          errorMessage = 'Authentication expired. Please log in again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      setIsLoading(false);
    } finally {
      if (retryCount === 0) {
        setIsLoading(false);
      }
    }
  }, [onlyPending]);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  // Clear cache when needed
  const invalidateCache = useCallback(() => {
    contractsCache = null;
    cacheTimestamp = 0;
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchContracts();
    }
  }, [fetchContracts, autoFetch]);

  return {
    contracts,
    isLoading,
    error,
    refetch: fetchContracts,
    clearError
  };
}

// Utility to clear cache manually (e.g., after signing a contract)
export function clearContractsCache() {
  contractsCache = null;
  cacheTimestamp = 0;
}
