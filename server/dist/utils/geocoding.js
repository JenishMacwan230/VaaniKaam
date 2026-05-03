"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrichWithCityNames = exports.reverseGeocodeBatch = exports.reverseGeocodeServerNominatim = void 0;
/**
 * Server-side reverse geocoding using Nominatim
 * Better for server-side processing (no rate limits, can cache)
 */
const reverseGeocodeServerNominatim = async (latitude, longitude) => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`, {
            headers: {
                'User-Agent': 'VaaniKaam-App/1.0', // Required by Nominatim
            },
        });
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
    }
    catch (error) {
        console.error('Server reverse geocoding error:', error);
        return {};
    }
};
exports.reverseGeocodeServerNominatim = reverseGeocodeServerNominatim;
/**
 * Batch reverse geocode multiple locations efficiently
 * Add delays between requests to respect API limits
 */
const reverseGeocodeBatch = async (locations, delayMs = 500) => {
    const results = [];
    for (let i = 0; i < locations.length; i++) {
        const location = locations[i];
        // Add delay between requests to respect API limits
        if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
        const geocoded = await (0, exports.reverseGeocodeServerNominatim)(location.latitude, location.longitude);
        results.push({
            ...location,
            ...geocoded,
        });
    }
    return results;
};
exports.reverseGeocodeBatch = reverseGeocodeBatch;
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
const enrichWithCityNames = async (items) => {
    const enriched = await Promise.all(items.map(async (item) => {
        const geocoded = await (0, exports.reverseGeocodeServerNominatim)(item.latitude, item.longitude);
        return {
            ...item,
            ...geocoded,
        };
    }));
    return enriched;
};
exports.enrichWithCityNames = enrichWithCityNames;
