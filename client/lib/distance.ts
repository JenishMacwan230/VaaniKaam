/**
 * Distance calculation utilities using geolib
 */

import {
  getDistance,
} from 'geolib';

import type { Coordinates } from './geolocation';

export interface Location extends Coordinates {
  id?: string;
  name?: string;
}

/**
 * Calculate distance between two coordinates in kilometers
 */
export const calculateDistance = (
  from: Coordinates,
  to: Coordinates,
  unit: 'km' | 'mi' = 'km'
): number => {
  const distanceInMeters = getDistance(
    { latitude: from.latitude, longitude: from.longitude },
    { latitude: to.latitude, longitude: to.longitude }
  );

  const distanceInKm = distanceInMeters / 1000;
  return unit === 'km' ? distanceInKm : distanceInKm * 0.621371;
};

/**
 * Format distance for display
 */
export const formatDistance = (distanceKm?: number): string => {
  if (!distanceKm && distanceKm !== 0) return 'Unknown';
  if (distanceKm < 1) {
    return `${(distanceKm * 1000).toFixed(0)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};
