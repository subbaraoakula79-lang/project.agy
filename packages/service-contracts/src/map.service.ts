import { LatLng, Address } from '@yatra-seva/shared-types';

/**
 * Map/geocoding service contract.
 *
 * Abstracts geocoding, reverse geocoding, and place search.
 * Mock: returns hardcoded Kakinada locations.
 * Real: integrates with Google Maps, MapMyIndia, etc.
 */
export interface IMapService {
  /**
   * Forward geocode — convert address text to coordinates.
   */
  geocode(addressText: string): Promise<Address | null>;

  /**
   * Reverse geocode — convert coordinates to address.
   */
  reverseGeocode(location: LatLng): Promise<Address | null>;

  /**
   * Search for places matching a query within a city/area.
   */
  searchPlaces(query: string, nearLocation?: LatLng): Promise<Address[]>;
}

/**
 * Routing/directions service contract.
 *
 * Abstracts route calculation between two points.
 * Mock: returns straight-line distance × 1.4 (road factor).
 * Real: integrates with Google Directions, OSRM, etc.
 */
export interface IRoutingService {
  /**
   * Calculate route between origin and destination.
   */
  getRoute(origin: LatLng, destination: LatLng): Promise<RouteInfo>;
}

/** Route calculation result. */
export interface RouteInfo {
  distanceMeters: number;
  durationSeconds: number;
  /** Encoded polyline for map rendering. */
  polyline?: string;
}
