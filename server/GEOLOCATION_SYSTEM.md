# LocalLoop Geolocation System Documentation

## Overview
Production-ready location-based discovery system with MongoDB geospatial indexing, Google Maps integration, and comprehensive distance-based search capabilities.

## Features

### Core Functionality ✅
- User location detection (browser geolocation)
- Nearby item search with distance filtering
- Location-based item discovery
- Map display with markers
- Address to coordinates conversion (geocoding)
- Coordinates to address conversion (reverse geocoding)
- Distance calculation and formatting
- Bounding box queries for map views

### Database Features ✅
- MongoDB 2dsphere geospatial indexing
- Efficient proximity queries
- Location validation and sanitization
- Coordinate format: [longitude, latitude]

### API Features ✅
- Nearby items search
- Location name search
- Bounding box queries
- Distance calculations
- Geocoding and reverse geocoding

## Architecture

### Location Data Format

#### GeoJSON Point Format
```javascript
location: {
  type: "Point",
  coordinates: [longitude, latitude], // [lng, lat] order!
  address: "123 Main St, City, State",
  city: "City Name"
}
```

**Important**: MongoDB uses [longitude, latitude] order, not [latitude, longitude]!

### Database Indexes

#### Item Model
```javascript
itemSchema.index({ 'location.coordinates': '2dsphere' });
```

#### User Model
```javascript
userSchema.index({ 'location.coordinates': '2dsphere' });
```

## API Endpoints

### 1. Get Nearby Items
```http
GET /api/items/nearby?lat=28.4595&lng=77.0266&radius=5
```

**Query Parameters:**
- `lat` (required) - Latitude
- `lng` (required) - Longitude
- `radius` (optional) - Search radius in kilometers (default: 5)
- `category` (optional) - Filter by category
- `minPrice` (optional) - Minimum price per day
- `maxPrice` (optional) - Maximum price per day
- `limit` (optional) - Maximum results (default: 20)

**Response:**
```json
{
  "success": true,
  "message": "Nearby items retrieved successfully",
  "data": {
    "items": [
      {
        "_id": "item_id",
        "title": "Power Drill",
        "pricePerDay": 15,
        "location": {
          "type": "Point",
          "coordinates": [77.0266, 28.4595],
          "address": "123 Main St",
          "city": "Delhi"
        },
        "distance": 1.2,
        "distanceFormatted": "1.2 km",
        "owner": {
          "name": "John Doe",
          "avatar": "url",
          "rating": 4.5
        }
      }
    ],
    "count": 5,
    "userLocation": {
      "lat": 28.4595,
      "lng": 77.0266
    },
    "radius": 5
  }
}
```

### 2. Search by Location Name
```http
GET /api/items/search-location?location=San Francisco&radius=10&category=Tools
```

**Query Parameters:**
- `location` (required) - City name or address
- `radius` (optional) - Search radius in km (default: 10)
- `category` (optional) - Filter by category
- `limit` (optional) - Maximum results (default: 20)

**Response:**
```json
{
  "success": true,
  "message": "Items found by location",
  "data": {
    "items": [...],
    "count": 12,
    "searchLocation": {
      "address": "San Francisco, CA, USA",
      "city": "San Francisco",
      "coordinates": [-122.4194, 37.7749]
    },
    "radius": 10
  }
}
```

### 3. Get Items in Bounding Box (Map View)
```http
GET /api/items/bounds?minLat=37.7&maxLat=37.8&minLng=-122.5&maxLng=-122.4
```

**Query Parameters:**
- `minLat` (required) - Minimum latitude
- `maxLat` (required) - Maximum latitude
- `minLng` (required) - Minimum longitude
- `maxLng` (required) - Maximum longitude
- `category` (optional) - Filter by category

**Response:**
```json
{
  "success": true,
  "message": "Items in bounds retrieved successfully",
  "data": {
    "items": [...],
    "count": 25,
    "bounds": {
      "minLat": 37.7,
      "maxLat": 37.8,
      "minLng": -122.5,
      "maxLng": -122.4
    }
  }
}
```

### 4. Geocode Address
```http
POST /api/items/geocode
Content-Type: application/json

{
  "address": "1600 Amphitheatre Parkway, Mountain View, CA"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Address geocoded successfully",
  "data": {
    "coordinates": [-122.0842, 37.4220],
    "formattedAddress": "1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA",
    "city": "Mountain View",
    "lat": 37.4220,
    "lng": -122.0842
  }
}
```

### 5. Reverse Geocode Coordinates
```http
POST /api/items/reverse-geocode
Content-Type: application/json

{
  "lat": 37.4220,
  "lng": -122.0842
}
```

**Response:**
```json
{
  "success": true,
  "message": "Coordinates reverse geocoded successfully",
  "data": {
    "formattedAddress": "1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA",
    "city": "Mountain View"
  }
}
```

### 6. Get Items with Location Filter
```http
GET /api/items?lat=37.7749&lng=-122.4194&distance=10&category=Tools&page=1&limit=12
```

**Query Parameters:**
- `lat` (optional) - User latitude
- `lng` (optional) - User longitude
- `distance` (optional) - Maximum distance in km (default: 50)
- `category` (optional) - Filter by category
- `minPrice` (optional) - Minimum price
- `maxPrice` (optional) - Maximum price
- `search` (optional) - Text search
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 12)

## Frontend Integration

### 1. User Location Detection

```typescript
// hooks/useGeolocation.ts
import { useState, useEffect } from 'react';

interface Location {
  lat: number;
  lng: number;
  error?: string;
}

export const useGeolocation = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({ lat: 0, lng: 0, error: 'Geolocation not supported' });
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoading(false);
      },
      (error) => {
        setLocation({ lat: 0, lng: 0, error: error.message });
        setLoading(false);
      }
    );
  }, []);

  return { location, loading };
};
```

### 2. Fetch Nearby Items

```typescript
// utils/api.ts
export const fetchNearbyItems = async (
  lat: number,
  lng: number,
  radius: number = 5,
  category?: string
) => {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
    radius: radius.toString(),
    ...(category && { category })
  });

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/items/nearby?${params}`
  );

  return await response.json();
};
```

### 3. Google Maps Integration

```typescript
// components/ItemMap.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface Item {
  _id: string;
  title: string;
  location: {
    coordinates: [number, number];
  };
  pricePerDay: number;
  images: Array<{ url: string }>;
}

interface ItemMapProps {
  items: Item[];
  userLocation?: { lat: number; lng: number };
  onMarkerClick?: (item: Item) => void;
}

export default function ItemMap({ items, userLocation, onMarkerClick }: ItemMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        version: 'weekly'
      });

      const { Map } = await loader.importLibrary('maps');
      const { AdvancedMarkerElement } = await loader.importLibrary('marker');

      const center = userLocation || { lat: 37.7749, lng: -122.4194 };

      const mapInstance = new Map(mapRef.current!, {
        center,
        zoom: 12,
        mapId: 'localloop-map'
      });

      setMap(mapInstance);
    };

    if (mapRef.current && !map) {
      initMap();
    }
  }, [mapRef, map, userLocation]);

  // Add markers
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    const newMarkers: google.maps.Marker[] = [];

    // Add user location marker
    if (userLocation) {
      const userMarker = new google.maps.Marker({
        position: userLocation,
        map,
        title: 'Your Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });
      newMarkers.push(userMarker);
    }

    // Add item markers
    items.forEach(item => {
      const [lng, lat] = item.location.coordinates;
      
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        title: item.title
      });

      // Info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 10px;">
            <h3 style="margin: 0 0 5px 0;">${item.title}</h3>
            <p style="margin: 0;">$${item.pricePerDay}/day</p>
            ${item.images[0] ? `<img src="${item.images[0].url}" style="width: 100px; height: 75px; object-fit: cover; margin-top: 5px;" />` : ''}
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
        if (onMarkerClick) {
          onMarkerClick(item);
        }
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);
  }, [map, items, userLocation]);

  return (
    <div ref={mapRef} style={{ width: '100%', height: '500px' }} />
  );
}
```

### 4. Location Search Component

```typescript
// components/LocationSearch.tsx
'use client';

import { useState } from 'react';
import Input from './ui/Input';
import Button from './ui/Button';

interface LocationSearchProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
}

export default function LocationSearch({ onLocationSelect }: LocationSearchProps) {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!address.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/items/geocode`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address })
        }
      );

      const data = await response.json();

      if (data.success) {
        onLocationSelect({
          lat: data.data.lat,
          lng: data.data.lng,
          address: data.data.formattedAddress
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Enter city or address..."
        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
      />
      <Button onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </Button>
    </div>
  );
}
```

### 5. Distance Filter Component

```typescript
// components/DistanceFilter.tsx
'use client';

interface DistanceFilterProps {
  value: number;
  onChange: (distance: number) => void;
}

export default function DistanceFilter({ value, onChange }: DistanceFilterProps) {
  const distances = [1, 5, 10, 25, 50, 100];

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Distance</label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="px-3 py-2 border rounded-lg"
      >
        {distances.map(dist => (
          <key={dist} value={dist}>
            Within {dist} km
          </option>
        ))}
      </select>
    </div>
  );
}
```

## Utility Functions

### Calculate Distance
```javascript
const { calculateDistance, formatDistance } = require('./utils/geolocation');

const distance = calculateDistance(lat1, lng1, lat2, lng2);
// Returns: 5.3 (km)

const formatted = formatDistance(distance);
// Returns: "5.3 km" or "850 m"
```

### Validate Coordinates
```javascript
const { validateCoordinates } = require('./utils/geolocation');

const isValid = validateCoordinates(37.7749, -122.4194);
// Returns: true

const isInvalid = validateCoordinates(200, 300);
// Returns: false
```

### Sanitize Location
```javascript
const { sanitizeLocation } = require('./utils/geolocation');

const location = sanitizeLocation({
  coordinates: [-122.4194, 37.7749],
  address: '123 Main St',
  city: 'San Francisco'
});
// Returns validated and formatted location object
```

## Configuration

### Environment Variables

#### Backend (.env)
```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_API_URL=http://localhost:3002
```

### Get Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable APIs:
   - Maps JavaScript API
   - Geocoding API
   - Places API (optional)
4. Create credentials (API Key)
5. Restrict API key (recommended):
   - HTTP referrers for frontend
   - IP addresses for backend

## Performance Optimization

### Database Indexing
```javascript
// Already configured in models
itemSchema.index({ 'location.coordinates': '2dsphere' });
userSchema.index({ 'location.coordinates': '2dsphere' });
```

### Query Optimization
- Use pagination for large result sets
- Limit results (default: 20 items)
- Use bounding box queries for map views
- Cache popular search areas

### Frontend Optimization
- Debounce location searches
- Cache geocoding results
- Use map clustering for many markers
- Lazy load map component

## Security

### Implemented ✅
- Coordinate validation
- Input sanitization
- Rate limiting on API endpoints
- API key restrictions

### Recommended
- Restrict Google Maps API key by domain/IP
- Implement request throttling
- Monitor API usage
- Set up billing alerts

## Error Handling

### Common Errors

#### Invalid Coordinates
```json
{
  "success": false,
  "message": "Invalid coordinates"
}
```

#### Geocoding Failed
```json
{
  "success": false,
  "message": "Address not found"
}
```

#### Missing Parameters
```json
{
  "success": false,
  "message": "Latitude and longitude are required"
}
```

## Testing

### Test Nearby Search
```bash
curl "http://localhost:3002/api/items/nearby?lat=37.7749&lng=-122.4194&radius=5"
```

### Test Location Search
```bash
curl "http://localhost:3002/api/items/search-location?location=San Francisco&radius=10"
```

### Test Geocoding
```bash
curl -X POST http://localhost:3002/api/items/geocode \
  -H "Content-Type: application/json" \
  -d '{"address":"1600 Amphitheatre Parkway, Mountain View, CA"}'
```

### Test Bounding Box
```bash
curl "http://localhost:3002/api/items/bounds?minLat=37.7&maxLat=37.8&minLng=-122.5&maxLng=-122.4"
```

## Troubleshooting

### Geocoding Not Working
- Check GOOGLE_MAPS_API_KEY is set
- Verify Geocoding API is enabled
- Check API key restrictions
- Review billing status

### No Results Returned
- Verify coordinates are valid
- Check radius is appropriate
- Ensure items exist in database
- Verify geospatial index exists

### Map Not Loading
- Check NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
- Verify Maps JavaScript API is enabled
- Check browser console for errors
- Verify API key restrictions

## Future Enhancements

- [ ] Real-time location tracking
- [ ] Route planning to items
- [ ] Geofencing notifications
- [ ] Heatmap visualization
- [ ] Location history
- [ ] Favorite locations
- [ ] Location-based recommendations
- [ ] Multi-point routing

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: 2024
