"use strict";
/**
 * Server-side geolocation utilities for Express/Node.js
 * Use these functions to filter database results by distance
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDistanceServer = exports.filterByDistance = exports.getNearbyItemsPipeline = exports.buildNearbyQuery = exports.calculateBoundingBoxServer = exports.calculateDistanceServer = void 0;
/**
 * Calculate distance between two points (Haversine formula)
 * Returns distance in kilometers
 */
const calculateDistanceServer = (from, to) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(to.latitude - from.latitude);
    const dLon = toRad(to.longitude - from.longitude);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(from.latitude)) *
            Math.cos(toRad(to.latitude)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
exports.calculateDistanceServer = calculateDistanceServer;
/**
 * Convert degrees to radians
 */
const toRad = (degrees) => {
    return degrees * (Math.PI / 180);
};
/**
 * Calculate bounding box for more efficient database queries
 * Use this to filter database results before calculating exact distances
 */
const calculateBoundingBoxServer = (center, radiusKm) => {
    const latChange = radiusKm / 111; // 1 degree latitude ≈ 111 km
    const lonChange = radiusKm / (111 * Math.cos((center.latitude * Math.PI) / 180));
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
exports.calculateBoundingBoxServer = calculateBoundingBoxServer;
/**
 * Query builder for MongoDB - find locations within radius
 * Example: findNearbyLocations(userLocation, radiusKm)
 */
const buildNearbyQuery = (center, radiusKm) => {
    const bbox = (0, exports.calculateBoundingBoxServer)(center, radiusKm);
    return {
        latitude: { $gte: bbox.minLat, $lte: bbox.maxLat },
        longitude: { $gte: bbox.minLon, $lte: bbox.maxLon },
    };
};
exports.buildNearbyQuery = buildNearbyQuery;
/**
 * MongoDB aggregation pipeline for geospatial queries
 * Requires '2dsphere' index on location field:
 * db.workers.createIndex({ location: '2dsphere' })
 *
 * Or use this helper for traditional lat/lon:
 */
const getNearbyItemsPipeline = (center, radiusKm) => {
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
exports.getNearbyItemsPipeline = getNearbyItemsPipeline;
/**
 * Filter array of items by distance
 * Use this if fetching all items and filtering in memory
 */
const filterByDistance = (items, center, radiusKm) => {
    return items
        .map((item) => ({
        ...item,
        distance: (0, exports.calculateDistanceServer)(center, item),
    }))
        .filter((item) => item.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);
};
exports.filterByDistance = filterByDistance;
/**
 * Format distance for display
 */
const formatDistanceServer = (distanceKm, showUnit = true) => {
    if (distanceKm < 1) {
        const meters = Math.round(distanceKm * 1000);
        return showUnit ? `${meters}m` : `${meters}`;
    }
    const rounded = distanceKm.toFixed(1);
    return showUnit ? `${rounded} km` : rounded;
};
exports.formatDistanceServer = formatDistanceServer;
