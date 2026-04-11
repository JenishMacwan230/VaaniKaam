/**
 * Reverse Geocoding Utilities
 * Convert latitude/longitude coordinates to city names and addresses
 *
 * Free options:
 * - Nominatim (OpenStreetMap) - Free, no API key
 * - Google Maps Geocoding API - Paid, very accurate
 */

export interface Address {
  city?: string;
  town?: string;
  village?: string;
  district?: string;
  state?: string;
  country?: string;
  postcode?: string;
  fullAddress?: string;
  displayName?: string;
}

export interface GeocodeResult extends Address {
  latitude: number;
  longitude: number;
}

/**
 * Reverse geocode using Nominatim (OpenStreetMap) - FREE
 * No API key required
 *
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Address details including city/town name
 *
 * Example:
 * ```typescript
 * const address = await reverseGeocodeNominatim(22.7196, 75.8577);
 * console.log(address.city); // "Indore" or similar
 * ```
 */
export const reverseGeocodeNominatim = async (
  latitude: number,
  longitude: number
): Promise<Address> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Extract address components
    const address = data.address || {};

    return {
      city: address.city || address.town || address.county,
      town: address.town,
      village: address.village,
      district: address.county,
      state: address.state,
      country: address.country,
      postcode: address.postcode,
      fullAddress: data.display_name,
      displayName: data.display_name,
    };
  } catch (error) {
    console.error('Nominatim reverse geocoding error:', error);
    return {
      displayName: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    };
  }
};

/**
 * Reverse geocode using Google Maps API - PAID (but very accurate)
 * Requires API key in environment variable: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
 *
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Address details including city/town name
 *
 * Setup:
 * 1. Go to https://console.cloud.google.com/
 * 2. Enable Geocoding API
 * 3. Get API key
 * 4. Add to .env.local: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
 */
export const reverseGeocodeGoogle = async (
  latitude: number,
  longitude: number
): Promise<Address> => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn(
      'Google Maps API key not found. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local'
    );
    return {
      displayName: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    };
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Google Geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const components = result.address_components.reduce(
        (acc: any, component: any) => {
          const types = component.types;
          if (types.includes('locality')) acc.city = component.long_name;
          if (types.includes('administrative_area_level_2'))
            acc.district = component.long_name;
          if (types.includes('administrative_area_level_1'))
            acc.state = component.long_name;
          if (types.includes('country')) acc.country = component.long_name;
          if (types.includes('postal_code')) acc.postcode = component.long_name;
          return acc;
        },
        {}
      );

      return {
        ...components,
        fullAddress: result.formatted_address,
        displayName: result.formatted_address,
      };
    }

    return {
      displayName: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    };
  } catch (error) {
    console.error('Google reverse geocoding error:', error);
    return {
      displayName: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    };
  }
};

/**
 * Main reverse geocode function - uses Nominatim by default (free)
 * Falls back to coordinates if geocoding fails
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number,
  useGoogle: boolean = false
): Promise<Address> => {
  if (useGoogle) {
    return reverseGeocodeGoogle(latitude, longitude);
  }
  return reverseGeocodeNominatim(latitude, longitude);
};

/**
 * Get display name for location (city, town, or coordinates)
 * Returns full address with complete details
 *
 * @returns Full address like "123 Street, City, District, State 12345, Country"
 */
export const getLocationDisplayName = (address: Address): string => {
  // Return full address if available (most complete)
  if (address.fullAddress) return address.fullAddress;
  if (address.displayName) return address.displayName;

  // Fallback to built format
  const parts = [];
  if (address.city) parts.push(address.city);
  if (address.district && address.district !== address.city) parts.push(address.district);
  if (address.state) parts.push(address.state);
  if (address.postcode) parts.push(address.postcode);
  if (address.country) parts.push(address.country);

  if (parts.length > 0) {
    return parts.join(', ');
  }

  if (address.town) return address.town;
  if (address.village) return address.village;
  return 'Unknown Location';
};

/**
 * Get full readable address
 *
 * @returns "123 Main St, City, State 12345"
 */
export const getFullAddress = (address: Address): string => {
  const parts = [];

  if (address.city) parts.push(address.city);
  if (address.district && address.district !== address.city)
    parts.push(address.district);
  if (address.state) parts.push(address.state);
  if (address.country) parts.push(address.country);

  return parts.join(', ') || address.displayName || 'Unknown Location';
};

/**
 * Cache for geocoding results (to avoid repeated API calls)
 */
const geocodeCache = new Map<
  string,
  { data: Address; timestamp: number }
>();
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

/**
 * Cached reverse geocoding - checks cache before making API call
 */
export const reverseGeocodeWithCache = async (
  latitude: number,
  longitude: number,
  useGoogle: boolean = false
): Promise<Address> => {
  const key = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  const cached = geocodeCache.get(key);

  // Return cached result if available and not expired
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // Fetch fresh data
  const result = await reverseGeocode(latitude, longitude, useGoogle);

  // Cache the result
  geocodeCache.set(key, {
    data: result,
    timestamp: Date.now(),
  });

  return result;
};

/**
 * Clear geocoding cache
 */
export const clearGeocodeCache = (): void => {
  geocodeCache.clear();
};

/**
 * Get cache statistics
 */
export const getGeocachStats = () => {
  return {
    size: geocodeCache.size,
    entries: Array.from(geocodeCache.entries()).map(([key, value]) => ({
      location: key,
      age: Date.now() - value.timestamp,
    })),
  };
};
