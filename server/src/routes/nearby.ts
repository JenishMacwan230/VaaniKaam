/**
 * Example API routes for nearby workers and jobs
 * Add these to your Express server routes
 */

import { Router, Request, Response } from 'express';
import {
  calculateDistanceServer,
  filterByDistance,
  buildNearbyQuery,
} from '../utils/geolocation';

const router = Router();

// Example: GET /api/workers/nearby?latitude=22.7196&longitude=75.8577&radius=10
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Missing latitude or longitude parameters',
      });
    }

    const userLocation = {
      latitude: parseFloat(latitude as string),
      longitude: parseFloat(longitude as string),
    };

    const radiusKm = parseFloat(radius as string);

    // Example: Query database for workers
    // const workers = await Worker.find(buildNearbyQuery(userLocation, radiusKm));

    // For now, return mock data
    const mockWorkers = [
      {
        id: 'w1',
        name: 'Raj Kumar',
        latitude: 22.7205,
        longitude: 75.8585,
        skills: ['plumbing', 'repairs'],
      },
      {
        id: 'w2',
        name: 'Priya Singh',
        latitude: 22.7200,
        longitude: 75.8575,
        skills: ['electrical', 'wiring'],
      },
    ];

    // Filter by distance
    const nearby = filterByDistance(mockWorkers, userLocation, radiusKm).map(
      (worker) => ({
        ...worker,
        distanceFormatted: `${(worker.distance * 1).toFixed(1)} km`,
      })
    );

    res.json({
      success: true,
      userLocation,
      radius: radiusKm,
      count: nearby.length,
      workers: nearby,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch nearby workers',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

/**
 * Example Mongoose Model with geolocation
 *
 * import mongoose, { Schema } from 'mongoose';
 *
 * const workerSchema = new Schema({
 *   name: String,
 *   email: String,
 *   latitude: { type: Number, required: true },
 *   longitude: { type: Number, required: true },
 *   skills: [String],
 *   isActive: { type: Boolean, default: true },
 *   location: {
 *     type: {
 *       type: String,
 *       enum: ['Point'],
 *       default: 'Point'
 *     },
 *     coordinates: {
 *       type: [Number], // [longitude, latitude] - GeoJSON format
 *       required: true
 *     }
 *   }
 * });
 *
 * // Create geospatial index for efficient queries
 * workerSchema.index({ location: '2dsphere' });
 * workerSchema.index({ latitude: 1, longitude: 1 });
 *
 * export const Worker = mongoose.model('Worker', workerSchema);
 *
 *
 * // Usage in controller:
 * const getNearbyWorkers = async (latitude: number, longitude: number, maxDistance: number) => {
 *   const workers = await Worker.find({
 *     location: {
 *       $near: {
 *         $geometry: {
 *           type: 'Point',
 *           coordinates: [longitude, latitude] // GeoJSON format
 *         },
 *         $maxDistance: maxDistance * 1000 // Convert km to meters
 *       }
 *     }
 *   });
 *   return workers;
 * };
 */

/**
 * Example integration with existing Worker/Job models
 *
 * // Add location fields to User model updates
 * const userSchema = new Schema({
 *   name: String,
 *   email: String,
 *   // ... existing fields
 *   latitude: { type: Number },
 *   longitude: { type: Number },
 *   lastLocationUpdate: { type: Date },
 * });
 *
 * // Middleware to auto-update location
 * router.post('/update-location', async (req: Request, res: Response) => {
 *   const userId = req.user.id;
 *   const { latitude, longitude } = req.body;
 *
 *   await User.findByIdAndUpdate(userId, {
 *     latitude,
 *     longitude,
 *     lastLocationUpdate: new Date(),
 *   });
 *
 *   res.json({ success: true });
 * });
 */
