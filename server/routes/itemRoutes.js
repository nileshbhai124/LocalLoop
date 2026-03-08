const express = require('express');
const router = express.Router();
const {
  createItem,
  getItems,
  getItem,
  updateItem,
  deleteItem,
  getUserItems,
  getNearbyItems,
  searchByLocation,
  getItemsInBounds,
  geocode,
  reverseGeocodeCoordinates
} = require('../controllers/itemController');
const { protect } = require('../middleware/auth');
const { createItemValidation, mongoIdValidation } = require('../middleware/validation');

// Geolocation routes (must be before /:id)
router.get('/nearby', getNearbyItems);
router.get('/search-location', searchByLocation);
router.get('/bounds', getItemsInBounds);
router.post('/geocode', geocode);
router.post('/reverse-geocode', reverseGeocodeCoordinates);

// Standard CRUD routes
router.route('/')
  .get(getItems)
  .post(protect, createItemValidation, createItem);

router.get('/user/:userId', mongoIdValidation, getUserItems);

router.route('/:id')
  .get(mongoIdValidation, getItem)
  .put(protect, mongoIdValidation, updateItem)
  .delete(protect, mongoIdValidation, deleteItem);

module.exports = router;
