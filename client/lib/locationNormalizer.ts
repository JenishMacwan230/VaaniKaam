/**
 * Location Normalizer
 * Convert any user input (any format, typos, different languages) to standardized format
 * 
 * Uses Forward Geocoding + Reverse Geocoding to normalize
 * Example: "indore" OR "INDORE" OR "Indor" → "Indore, Indore District, Madhya Pradesh, India"
 */

import { reverseGeocodeWithCache, getLocationDisplayName } from './geocoding';

export interface NormalizedLocation {
  originalInput: string;
  standardizedName: string;
  latitude: number;
  longitude: number;
  isValid: boolean;
  error?: string;
}

/**
 * Forward geocoding - Convert location name to coordinates
 * Uses Nominatim's search API
 * Simple, fast - ONE API call only
 */
const forwardGeocodeNominatim = async (
  locationName: string
): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        locationName
      )}&countrycodes=in&limit=1&accept-language=en`,
      {
        headers: {
          'User-Agent': 'VaaniKaam-App/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      return {
        latitude: Number.parseFloat(result.lat),
        longitude: Number.parseFloat(result.lon),
      };
    }

    return null;
  } catch (error) {
    console.error('Forward geocoding error:', error);
    return null;
  }
};

/**
 * Normalize location input to system standard format
 * 
 * @param userInput - Any user input (e.g., "indore", "INDORE", "Indor", etc.)
 * @returns Normalized location with standardized name and coordinates
 * 
 * @example
 * const result = await normalizeLocation("indore");
 * // Returns:
 * // {
 * //   originalInput: "indore",
 * //   standardizedName: "Indore, Indore District, Madhya Pradesh, India",
 * //   latitude: 22.7196,
 * //   longitude: 75.8577,
 * //   isValid: true
 * // }
 */
export const normalizeLocation = async (
  userInput: string
): Promise<NormalizedLocation> => {
  const trimmedInput = userInput.trim();

  if (!trimmedInput) {
    return {
      originalInput: userInput,
      standardizedName: '',
      latitude: 0,
      longitude: 0,
      isValid: false,
      error: 'Location cannot be empty',
    };
  }

  try {
    // Step 1: Forward geocode user input to get coordinates
    const coordinates = await forwardGeocodeNominatim(trimmedInput);

    if (!coordinates) {
      return {
        originalInput: userInput,
        standardizedName: trimmedInput, // Fallback to original input
        latitude: 0,
        longitude: 0,
        isValid: false,
        error: `Location "${trimmedInput}" not found in India. Please check spelling or use GPS auto-fill.`,
      };
    }

    // Step 2: Reverse geocode coordinates to get standard format
    const address = await reverseGeocodeWithCache(
      coordinates.latitude,
      coordinates.longitude
    );

    const standardizedName = getLocationDisplayName(address);

    return {
      originalInput: userInput,
      standardizedName,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      isValid: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Normalization failed';
    return {
      originalInput: userInput,
      standardizedName: trimmedInput,
      latitude: 0,
      longitude: 0,
      isValid: false,
      error: message,
    };
  }
};

/**
 * Normalize multiple locations (batch processing)
 * Useful for importing jobs with location data
 */
export const normalizeLocationsBatch = async (
  locations: string[]
): Promise<NormalizedLocation[]> => {
  const results: NormalizedLocation[] = [];

  for (const location of locations) {
    const normalized = await normalizeLocation(location);
    results.push(normalized);
    // Add delay to respect API rate limits
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
};

/**
 * Validate if location exists in India
 * Lightweight check without reversing
 */
export const validateLocation = async (
  locationName: string
): Promise<boolean> => {
  try {
    const result = await forwardGeocodeNominatim(locationName);
    return result !== null;
  } catch {
    return false;
  }
};

/**
 * Search for locations (with autocomplete suggestions)
 * Returns matching cities/places as user types
 */
export const searchLocations = async (
  query: string,
  limit: number = 5
): Promise<Array<{ name: string; latitude: number; longitude: number }>> => {
  try {
    if (query.trim().length < 2) return [];

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&countrycodes=in&limit=${limit}&accept-language=en`,
      {
        headers: {
          'User-Agent': 'VaaniKaam-App/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const data = await response.json();

    return data.map((result: any) => ({
      name: result.display_name,
      latitude: Number.parseFloat(result.lat),
      longitude: Number.parseFloat(result.lon),
    }));
  } catch (error) {
    console.error('Location search error:', error);
    return [];
  }
};

/**
 * Cache for normalized locations (to avoid repeated API calls)
 */
const normalizedCache = new Map<
  string,
  { data: NormalizedLocation; timestamp: number }
>();
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Normalize location with caching
 */
export const normalizeLocationWithCache = async (
  userInput: string
): Promise<NormalizedLocation> => {
  const key = userInput.toLowerCase().trim();
  const cached = normalizedCache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const result = await normalizeLocation(userInput);

  normalizedCache.set(key, {
    data: result,
    timestamp: Date.now(),
  });

  return result;
};

/**
 * Clear normalization cache
 */
export const clearNormalizationCache = (): void => {
  normalizedCache.clear();
};
