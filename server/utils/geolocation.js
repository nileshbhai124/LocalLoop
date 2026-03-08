const axios = require('axios');

/**
 * Validate coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean}
 */
const validateCoordinates = (lat, lng) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  
  if (isNaN(latitude) || isNaN(longitude)) {
    return false;
  }
  
  // Latitude must be between -90 and 90
  if (latitude < -90 || latitude > 90) {
    return false;
  }
  
  // Longitude must be between -180 and 180
  if (longitude < -180 || longitude > 180) {
    return false;
  }
  
  return true;
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number}
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Format distance for display
 * @param {number} distanceInKm - Distance in kilometers
 * @returns {string}
 */
const formatDistance = (distanceInKm) => {
  if (distanceInKm < 1) {
    return `${Math.round(distanceInKm * 1000)} m`;
  }
  return `${distanceInKm} km`;
};

/**
 * Geocode address to coordinates using Google Maps API
 * @param {string} address - Address to geocode
 * @returns {Promise<object>} Coordinates and formatted address
 */
const geocodeAddress = async (address) => {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }
    
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          address,
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      }
    );
    
    if (response.data.status !== 'OK' || !response.data.results.length) {
      throw new Error('Address not found');
    }
    
    const result = response.data.results[0];
    const location = result.geometry.location;
    
    // Extract city from address components
    let city = '';
    for (const component of result.address_components) {
      if (component.types.includes('locality')) {
        city = component.long_name;
        break;
      }
      if (component.types.includes('administrative_area_level_2')) {
        city = component.long_name;
      }
    }
    
    return {
      coordinates: [location.lng, location.lat], // [longitude, latitude]
      formattedAddress: result.formatted_address,
      city: city || 'Unknown',
      lat: location.lat,
      lng: location.lng
    };
  } catch (error) {
    throw new Error(`Geocoding failed: ${error.message}`);
  }
};

/**
 * Reverse geocode coordinates to address
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<object>} Address information
 */
const reverseGeocode = async (lat, lng) => {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }
    
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          latlng: `${lat},${lng}`,
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      }
    );
    
    if (response.data.status !== 'OK' || !response.data.results.length) {
      throw new Error('Location not found');
    }
    
    const result = response.data.results[0];
    
    // Extract city from address components
    let city = '';
    for (const component of result.address_components) {
      if (component.types.includes('locality')) {
        city = component.long_name;
        break;
      }
      if (component.types.includes('administrative_area_level_2')) {
        city = component.long_name;
      }
    }
    
    return {
      formattedAddress: result.formatted_address,
      city: city || 'Unknown'
    };
  } catch (error) {
    throw new Error(`Reverse geocoding failed: ${error.message}`);
  }
};

/**
 * Get nearby locations using MongoDB geospatial query
 * @param {object} Model - Mongoose model
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} maxDistance - Maximum distance in meters
 * @param {object} additionalQuery - Additional query filters
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} Nearby locations
 */
const findNearby = async (Model, lat, lng, maxDistance = 5000, additionalQuery = {}, limit = 20) => {
  const query = {
    ...additionalQuery,
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: maxDistance
      }
    }
  };
  
  return await Model.find(query).limit(limit);
};

/**
 * Get locations within a bounding box
 * @param {object} Model - Mongoose model
 * @param {number} minLat - Minimum latitude
 * @param {number} maxLat - Maximum latitude
 * @param {number} minLng - Minimum longitude
 * @param {number} maxLng - Maximum longitude
 * @param {object} additionalQuery - Additional query filters
 * @returns {Promise<Array>} Locations within bounds
 */
const findWithinBounds = async (Model, minLat, maxLat, minLng, maxLng, additionalQuery = {}) => {
  const query = {
    ...additionalQuery,
    'location.coordinates': {
      $geoWithin: {
        $box: [
          [minLng, minLat], // Bottom left
          [maxLng, maxLat]  // Top right
        ]
      }
    }
  };
  
  return await Model.find(query);
};

/**
 * Calculate bounding box for a given center point and radius
 * @param {number} lat - Center latitude
 * @param {number} lng - Center longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {object} Bounding box coordinates
 */
const calculateBoundingBox = (lat, lng, radiusKm) => {
  const latDelta = radiusKm / 111.32; // 1 degree latitude ≈ 111.32 km
  const lngDelta = radiusKm / (111.32 * Math.cos(toRadians(lat)));
  
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta
  };
};

/**
 * Get distance between user and item
 * @param {object} userLocation - User location {coordinates: [lng, lat]}
 * @param {object} itemLocation - Item location {coordinates: [lng, lat]}
 * @returns {number} Distance in kilometers
 */
const getDistanceBetween = (userLocation, itemLocation) => {
  if (!userLocation || !itemLocation) {
    return null;
  }
  
  const [userLng, userLat] = userLocation.coordinates || [0, 0];
  const [itemLng, itemLat] = itemLocation.coordinates || [0, 0];
  
  return calculateDistance(userLat, userLng, itemLat, itemLng);
};

/**
 * Sort items by distance from user
 * @param {Array} items - Array of items
 * @param {number} userLat - User latitude
 * @param {number} userLng - User longitude
 * @returns {Array} Sorted items with distance
 */
const sortByDistance = (items, userLat, userLng) => {
  return items.map(item => {
    const [itemLng, itemLat] = item.location?.coordinates || [0, 0];
    const distance = calculateDistance(userLat, userLng, itemLat, itemLng);
    
    return {
      ...item.toObject(),
      distance,
      distanceFormatted: formatDistance(distance)
    };
  }).sort((a, b) => a.distance - b.distance);
};

/**
 * Validate and sanitize location data
 * @param {object} location - Location object
 * @returns {object} Sanitized location
 */
const sanitizeLocation = (location) => {
  if (!location || !location.coordinates) {
    throw new Error('Invalid location data');
  }
  
  const [lng, lat] = location.coordinates;
  
  if (!validateCoordinates(lat, lng)) {
    throw new Error('Invalid coordinates');
  }
  
  return {
    type: 'Point',
    coordinates: [parseFloat(lng), parseFloat(lat)],
    address: location.address || '',
    city: location.city || ''
  };
};

/**
 * Get popular search areas (for caching)
 * @param {object} Model - Mongoose model
 * @param {number} limit - Number of areas to return
 * @returns {Promise<Array>} Popular areas
 */
const getPopularAreas = async (Model, limit = 10) => {
  const areas = await Model.aggregate([
    {
      $group: {
        _id: '$location.city',
        count: { $sum: 1 },
        avgLat: { $avg: { $arrayElemAt: ['$location.coordinates', 1] } },
        avgLng: { $avg: { $arrayElemAt: ['$location.coordinates', 0] } }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
  
  return areas.map(area => ({
    city: area._id,
    count: area.count,
    coordinates: [area.avgLng, area.avgLat]
  }));
};

module.exports = {
  validateCoordinates,
  calculateDistance,
  formatDistance,
  geocodeAddress,
  reverseGeocode,
  findNearby,
  findWithinBounds,
  calculateBoundingBox,
  getDistanceBetween,
  sortByDistance,
  sanitizeLocation,
  getPopularAreas,
  toRadians
};
