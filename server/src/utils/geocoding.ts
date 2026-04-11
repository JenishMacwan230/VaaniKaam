/**
 * Server-side reverse geocoding utilities
 * More efficient and secure than client-side geocoding
 *
 * Use this on your Express server to:
 * 1. Cache geocoding results in database
 * 2. Control API rate limits
 * 3. Protect API keys from exposure
 * 4. Batch reverse geocode multiple locations
 */

import type { Coordinates } from './geolocation';

export interface CachedLocation {
  latitude: number;
  longitude: number;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  fullAddress?: string;
  cachedAt: Date;
}

/**
 * Server-side reverse geocoding using Nominatim
 * Better for server-side processing (no rate limits, can cache)
 */
export const reverseGeocodeServerNominatim = async (
  latitude: number,
  longitude: number
): Promise<{
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  fullAddress?: string;
}> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`,
      {
        headers: {
          'User-Agent': 'VaaniKaam-App/1.0', // Required by Nominatim
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();
    const address = data.address || {};

    return {
      city: address.city || address.town || address.county,
      district: address.county,
      state: address.state,
      country: address.country,
      fullAddress: data.display_name,
    };
  } catch (error) {
    console.error('Server reverse geocoding error:', error);
    return {};
  }
};

/**
 * Batch reverse geocode multiple locations efficiently
 * Add delays between requests to respect API limits
 */
export const reverseGeocodeBatch = async (
  locations: Coordinates[],
  delayMs: number = 500
): Promise<
  Array<
    Coordinates & {
      city?: string;
      district?: string;
      state?: string;
      country?: string;
      fullAddress?: string;
    }
  >
> => {
  const results = [];

  for (let i = 0; i < locations.length; i++) {
    const location = locations[i];

    // Add delay between requests to respect API limits
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    const geocoded = await reverseGeocodeServerNominatim(
      location.latitude,
      location.longitude
    );

    results.push({
      ...location,
      ...geocoded,
    });
  }

  return results;
};

/**
 * Helper to build MongoDB aggregation for nearby search WITH city names
 * Fetches coordinates, then reverse geocodes them
 *
 * Usage in Express controller:
 * ```typescript
 * const nearby = await db.workers.find({ ...locationQuery });
 * const withCities = await reverseGeocodeBatch(
 *   nearby.map(w => ({ latitude: w.lat, longitude: w.lon }))
 * );
 * ```
 */
export const enrichWithCityNames = async (
  items: Array<any & Coordinates>
): Promise<Array<any & { city?: string; fullAddress?: string }>> => {
  const enriched = await Promise.all(
    items.map(async (item) => {
      const geocoded = await reverseGeocodeServerNominatim(
        item.latitude,
        item.longitude
      );
      return {
        ...item,
        ...geocoded,
      };
    })
  );

  return enriched;
};

/**
 * Example MongoDB repository methods for caching locations
 *
 * // In your database/repository file:
 *
 * interface LocationCache {
 *   _id: ObjectId;
 *   latitude: number;
 *   longitude: number;
 *   city?: string;
 *   district?: string;
 *   state?: string;
 *   country?: string;
 *   fullAddress?: string;
 *   cachedAt: Date;
 * }
 *
 * export const getOrGeocodeLocation = async (
 *   latitude: number,
 *   longitude: number
 * ): Promise<LocationCache | null> => {
 *   // Check cache first
 *   const cached = await db.collection('geocodeCache').findOne({
 *     latitude: { $gte: latitude - 0.0001, $lte: latitude + 0.0001 },
 *     longitude: { $gte: longitude - 0.0001, $lte: longitude + 0.0001 }
 *   });
 *
 *   if (cached) {
 *     return cached as LocationCache;
 *   }
 *
 *   // Geocode and cache
 *   const geocoded = await reverseGeocodeServerNominatim(latitude, longitude);
 *   const result = {
 *     latitude,
 *     longitude,
 *     ...geocoded,
 *     cachedAt: new Date(),
 *   };
 *
 *   await db.collection('geocodeCache').insertOne(result);
 *   return result;
 * };
 */

export type LocationCacheEntry = CachedLocation;
