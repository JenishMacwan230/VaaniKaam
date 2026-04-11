/**
 * Server-side geolocation utilities for Express/Node.js
 * Use these functions to filter database results by distance
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two points (Haversine formula)
 * Returns distance in kilometers
 */
export const calculateDistanceServer = (
  from: Coordinates,
  to: Coordinates
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.latitude)) *
      Math.cos(toRad(to.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 */
const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate bounding box for more efficient database queries
 * Use this to filter database results before calculating exact distances
 */
export const calculateBoundingBoxServer = (
  center: Coordinates,
  radiusKm: number
): {
  north: number;
  south: number;
  east: number;
  west: number;
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
} => {
  const latChange = radiusKm / 111; // 1 degree latitude ≈ 111 km
  const lonChange =
    radiusKm / (111 * Math.cos((center.latitude * Math.PI) / 180));

  return {
    north: center.latitude + latChange,
    south: center.latitude - latChange,
    east: center.longitude + lonChange,
    west: center.longitude - lonChange,
    minLat: center.latitude - latChange,
    maxLat: center.latitude + latChange,
    minLon: center.longitude - lonChange,
    maxLon: center.longitude + lonChange,
  };
};

/**
 * Query builder for MongoDB - find locations within radius
 * Example: findNearbyLocations(userLocation, radiusKm)
 */
export const buildNearbyQuery = (
  center: Coordinates,
  radiusKm: number
): object => {
  const bbox = calculateBoundingBoxServer(center, radiusKm);

  return {
    latitude: { $gte: bbox.minLat, $lte: bbox.maxLat },
    longitude: { $gte: bbox.minLon, $lte: bbox.maxLon },
  };
};

/**
 * MongoDB aggregation pipeline for geospatial queries
 * Requires '2dsphere' index on location field:
 * db.workers.createIndex({ location: '2dsphere' })
 *
 * Or use this helper for traditional lat/lon:
 */
export const getNearbyItemsPipeline = (
  center: Coordinates,
  radiusKm: number
): object[] => {
  const radiusMeters = radiusKm * 1000;

  return [
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [center.longitude, center.latitude],
        },
        distanceField: 'distance',
        maxDistance: radiusMeters,
        spherical: true,
      },
    },
  ];
};

/**
 * Filter array of items by distance
 * Use this if fetching all items and filtering in memory
 */
export const filterByDistance = <T extends Coordinates>(
  items: T[],
  center: Coordinates,
  radiusKm: number
): Array<T & { distance: number }> => {
  return items
    .map((item) => ({
      ...item,
      distance: calculateDistanceServer(center, item),
    }))
    .filter((item) => item.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Format distance for display
 */
export const formatDistanceServer = (
  distanceKm: number,
  showUnit: boolean = true
): string => {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return showUnit ? `${meters}m` : `${meters}`;
  }
  const rounded = distanceKm.toFixed(1);
  return showUnit ? `${rounded} km` : rounded;
};

/**
 * Type for query result with distance
 */
export type WithDistance<T> = T & {
  distance: number;
};
