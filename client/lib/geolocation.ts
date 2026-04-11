/**
 * Geolocation utility functions for GPS operations
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Location extends Coordinates {
  name?: string;
  accuracy?: number;
}

/**
 * Get user's current GPS coordinates
 */
export const getCurrentLocation = (): Promise<Coordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Watch user's location changes in real-time
 */
export const watchLocation = (
  onSuccess: (coords: Coordinates) => void,
  onError: (error: Error) => void
): number => {
  if (!navigator.geolocation) {
    onError(new Error('Geolocation is not supported by this browser'));
    return 0;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      onSuccess({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    (error) => {
      onError(new Error(`Geolocation error: ${error.message}`));
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
    }
  );
};

/**
 * Stop watching location
 */
export const stopWatchingLocation = (watchId: number): void => {
  if (navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
};

/**
 * Request location permission from user
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported');
      return false;
    }

    // Check if permission API is available
    if (!navigator.permissions) {
      console.warn('Permissions API not available');
      // Assume permission is granted (will prompt when getCurrentLocation is called)
      return true;
    }

    const result = await navigator.permissions.query({
      name: 'geolocation',
    } as PermissionDescriptor);

    return result.state === 'granted' || result.state === 'prompt';
  } catch (err) {
    console.warn('Error checking location permission:', err);
    // Assume permission is granted
    return true;
  }
};
