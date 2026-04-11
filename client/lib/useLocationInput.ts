/**
 * Hook for handling location input with auto-translation
 * Uses API-based normalization (no hardcoded conditions)
 */

import { useState, useCallback } from 'react';
import { normalizeLocationWithCache } from '@/lib/locationNormalizer';

export interface UseLocationInputResult {
  input: string;
  error: string | null;
  isNormalizing: boolean;
  setInput: (value: string) => void;
  normalizeInput: () => Promise<boolean>;
  clearError: () => void;
  getCoordinates: () => { latitude?: number; longitude?: number } | null;
}

/**
 * Hook to handle location input with API-based normalization
 */
export const useLocationInput = (): UseLocationInputResult => {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

  // Normalize user input using API
  const normalizeInput = useCallback(async (): Promise<boolean> => {
    if (!input.trim()) {
      setError('Please enter a location');
      setCoordinates(null);
      return false;
    }

    setIsNormalizing(true);
    try {
      const normalized = await normalizeLocationWithCache(input);

      if (normalized.isValid) {
        setInput(normalized.standardizedName);
        setCoordinates({
          latitude: normalized.latitude,
          longitude: normalized.longitude,
        });
        setError(null);
        return true;
      } else {
        setError(
          normalized.error || `"${input}" not found. Please check spelling or use GPS.`
        );
        setCoordinates(null);
        return false;
      }
    } catch (err: unknown) {
      console.error('Location normalization failed:', err);
      setError('Failed to normalize location. Please try again.');
      setCoordinates(null);
      return false;
    } finally {
      setIsNormalizing(false);
    }
  }, [input]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getCoordinates = useCallback(() => coordinates, [coordinates]);

  return {
    input,
    error,
    isNormalizing,
    setInput,
    normalizeInput,
    clearError,
    getCoordinates,
  };
};
