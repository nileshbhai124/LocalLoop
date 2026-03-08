const Item = require('../models/Item');
const { AppError } = require('../utils/errorHandler');
const ApiResponse = require('../utils/response');
const {
  validateCoordinates,
  calculateDistance,
  formatDistance,
  geocodeAddress,
  reverseGeocode,
  sortByDistance,
  sanitizeLocation
} = require('../utils/geolocation');

// @desc    Create new item
// @route   POST /api/items
// @access  Private
exports.createItem = async (req, res, next) => {
  try {
    req.body.owner = req.user.id;

    // Validate and sanitize location
    if (req.body.location) {
      req.body.location = sanitizeLocation(req.body.location);
    }

    const item = await Item.create(req.body);

    ApiResponse.success(res, item, 'Item created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all items with filters
// @route   GET /api/items
// @access  Public
exports.getItems = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      minPrice,
      maxPrice,
      search,
      lat,
      lng,
      distance = 50,
      availability = true
    } = req.query;

    // Build query
    const query = {};

    if (category) {
      query.category = category;
    }

    if (availability !== undefined) {
      query.availability = availability === 'true';
    }

    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice) query.pricePerDay.$gte = parseFloat(minPrice);
      if (maxPrice) query.pricePerDay.$lte = parseFloat(maxPrice);
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Geospatial query
    if (lat && lng) {
      // Validate coordinates
      if (!validateCoordinates(lat, lng)) {
        return next(new AppError('Invalid coordinates', 400));
      }

      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseFloat(distance) * 1000 // Convert km to meters
        }
      };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    let items = await Item.find(query)
      .populate('owner', 'name avatar rating')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    // Add distance to each item if user location provided
    if (lat && lng) {
      items = items.map(item => {
        const itemObj = item.toObject();
        const [itemLng, itemLat] = item.location?.coordinates || [0, 0];
        const dist = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          itemLat,
          itemLng
        );
        
        return {
          ...itemObj,
          distance: dist,
          distanceFormatted: formatDistance(dist)
        };
      });
    }

    const total = await Item.countDocuments(query);

    ApiResponse.paginated(res, items, page, limit, total, 'Items retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get nearby items
// @route   GET /api/items/nearby
// @access  Public
exports.getNearbyItems = async (req, res, next) => {
  try {
    const {
      lat,
      lng,
      radius = 5, // Default 5km
      category,
      minPrice,
      maxPrice,
      limit = 20
    } = req.query;

    // Validate required parameters
    if (!lat || !lng) {
      return next(new AppError('Latitude and longitude are required', 400));
    }

    // Validate coordinates
    if (!validateCoordinates(lat, lng)) {
      return next(new AppError('Invalid coordinates', 400));
    }

    // Build query
    const query = {
      availability: true,
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
        }
      }
    };

    // Add filters
    if (category) {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice) query.pricePerDay.$gte = parseFloat(minPrice);
      if (maxPrice) query.pricePerDay.$lte = parseFloat(maxPrice);
    }

    // Execute query
    let items = await Item.find(query)
      .populate('owner', 'name avatar rating location')
      .limit(parseInt(limit));

    // Add distance to each item
    items = items.map(item => {
      const itemObj = item.toObject();
      const [itemLng, itemLat] = item.location?.coordinates || [0, 0];
      const dist = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        itemLat,
        itemLng
      );
      
      return {
        ...itemObj,
        distance: dist,
        distanceFormatted: formatDistance(dist)
      };
    });

    // Sort by distance
    items.sort((a, b) => a.distance - b.distance);

    ApiResponse.success(res, {
      items,
      count: items.length,
      userLocation: {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      },
      radius: parseFloat(radius)
    }, 'Nearby items retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Search items by location name
// @route   GET /api/items/search-location
// @access  Public
exports.searchByLocation = async (req, res, next) => {
  try {
    const { location, radius = 10, category, limit = 20 } = req.query;

    if (!location) {
      return next(new AppError('Location is required', 400));
    }

    // Geocode the location
    const geocoded = await geocodeAddress(location);

    // Build query
    const query = {
      availability: true,
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: geocoded.coordinates
          },
          $maxDistance: parseFloat(radius) * 1000
        }
      }
    };

    if (category) {
      query.category = category;
    }

    // Execute query
    let items = await Item.find(query)
      .populate('owner', 'name avatar rating')
      .limit(parseInt(limit));

    // Add distance to each item
    items = items.map(item => {
      const itemObj = item.toObject();
      const [itemLng, itemLat] = item.location?.coordinates || [0, 0];
      const dist = calculateDistance(
        geocoded.lat,
        geocoded.lng,
        itemLat,
        itemLng
      );
      
      return {
        ...itemObj,
        distance: dist,
        distanceFormatted: formatDistance(dist)
      };
    });

    ApiResponse.success(res, {
      items,
      count: items.length,
      searchLocation: {
        address: geocoded.formattedAddress,
        city: geocoded.city,
        coordinates: geocoded.coordinates
      },
      radius: parseFloat(radius)
    }, 'Items found by location');
  } catch (error) {
    next(error);
  }
};

// @desc    Get items within bounding box (for map view)
// @route   GET /api/items/bounds
// @access  Public
exports.getItemsInBounds = async (req, res, next) => {
  try {
    const { minLat, maxLat, minLng, maxLng, category } = req.query;

    // Validate required parameters
    if (!minLat || !maxLat || !minLng || !maxLng) {
      return next(new AppError('Bounding box coordinates are required', 400));
    }

    // Validate coordinates
    if (!validateCoordinates(minLat, minLng) || !validateCoordinates(maxLat, maxLng)) {
      return next(new AppError('Invalid coordinates', 400));
    }

    // Build query
    const query = {
      availability: true,
      'location.coordinates': {
        $geoWithin: {
          $box: [
            [parseFloat(minLng), parseFloat(minLat)], // Bottom left
            [parseFloat(maxLng), parseFloat(maxLat)]  // Top right
          ]
        }
      }
    };

    if (category) {
      query.category = category;
    }

    // Execute query
    const items = await Item.find(query)
      .populate('owner', 'name avatar rating')
      .limit(100); // Limit for map display

    ApiResponse.success(res, {
      items,
      count: items.length,
      bounds: {
        minLat: parseFloat(minLat),
        maxLat: parseFloat(maxLat),
        minLng: parseFloat(minLng),
        maxLng: parseFloat(maxLng)
      }
    }, 'Items in bounds retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get single item
// @route   GET /api/items/:id
// @access  Public
exports.getItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('owner', 'name avatar rating reviewCount location bio');

    if (!item) {
      return next(new AppError('Item not found', 404));
    }

    // Increment views
    item.views += 1;
    await item.save();

    // Add distance if user location provided
    const { lat, lng } = req.query;
    let itemData = item.toObject();
    
    if (lat && lng && validateCoordinates(lat, lng)) {
      const [itemLng, itemLat] = item.location?.coordinates || [0, 0];
      const dist = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        itemLat,
        itemLng
      );
      
      itemData.distance = dist;
      itemData.distanceFormatted = formatDistance(dist);
    }

    ApiResponse.success(res, itemData, 'Item retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Update item
// @route   PUT /api/items/:id
// @access  Private
exports.updateItem = async (req, res, next) => {
  try {
    let item = await Item.findById(req.params.id);

    if (!item) {
      return next(new AppError('Item not found', 404));
    }

    // Check ownership
    if (item.owner.toString() !== req.user.id) {
      return next(new AppError('Not authorized to update this item', 403));
    }

    // Validate and sanitize location if provided
    if (req.body.location) {
      req.body.location = sanitizeLocation(req.body.location);
    }

    item = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    ApiResponse.success(res, item, 'Item updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete item
// @route   DELETE /api/items/:id
// @access  Private
exports.deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return next(new AppError('Item not found', 404));
    }

    // Check ownership
    if (item.owner.toString() !== req.user.id) {
      return next(new AppError('Not authorized to delete this item', 403));
    }

    await item.deleteOne();

    ApiResponse.success(res, null, 'Item deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's items
// @route   GET /api/items/user/:userId
// @access  Public
exports.getUserItems = async (req, res, next) => {
  try {
    const items = await Item.find({ owner: req.params.userId })
      .sort('-createdAt');

    ApiResponse.success(res, items, 'User items retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Geocode address
// @route   POST /api/items/geocode
// @access  Public
exports.geocode = async (req, res, next) => {
  try {
    const { address } = req.body;

    if (!address) {
      return next(new AppError('Address is required', 400));
    }

    const result = await geocodeAddress(address);

    ApiResponse.success(res, result, 'Address geocoded successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Reverse geocode coordinates
// @route   POST /api/items/reverse-geocode
// @access  Public
exports.reverseGeocodeCoordinates = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return next(new AppError('Latitude and longitude are required', 400));
    }

    if (!validateCoordinates(lat, lng)) {
      return next(new AppError('Invalid coordinates', 400));
    }

    const result = await reverseGeocode(lat, lng);

    ApiResponse.success(res, result, 'Coordinates reverse geocoded successfully');
  } catch (error) {
    next(error);
  }
};
