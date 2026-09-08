import { Injectable } from '@nestjs/common';
import type { LatLng, Address } from '@yatra-seva/shared-types';
import type { RouteInfo } from '@yatra-seva/service-contracts';

/**
 * Kakinada landmarks for mock geocoding.
 */
const KAKINADA_PLACES: Address[] = [
  { text: 'Kakinada Railway Station', latitude: 16.9558, longitude: 82.2386, placeId: 'mock-1' },
  { text: 'Jagannaickpur Main Road', latitude: 16.9891, longitude: 82.2475, placeId: 'mock-2' },
  { text: 'Kakinada Beach', latitude: 16.9330, longitude: 82.2613, placeId: 'mock-3' },
  { text: 'Sarpavaram Junction', latitude: 16.9764, longitude: 82.2402, placeId: 'mock-4' },
  { text: 'Bhanugudi Junction', latitude: 16.9910, longitude: 82.2370, placeId: 'mock-5' },
  { text: 'Ramanayyapeta', latitude: 16.9733, longitude: 82.2350, placeId: 'mock-6' },
  { text: 'Kakinada Port', latitude: 16.9440, longitude: 82.2630, placeId: 'mock-7' },
  { text: 'Gandhi Nagar', latitude: 16.9820, longitude: 82.2490, placeId: 'mock-8' },
  { text: 'JNTU Kakinada', latitude: 16.9784, longitude: 82.2350, placeId: 'mock-9' },
  { text: 'Kakinada Bus Stand', latitude: 16.9665, longitude: 82.2425, placeId: 'mock-10' },
];

/**
 * Mock Map Service — for development only.
 *
 * Returns hardcoded Kakinada locations for geocoding and place search.
 */
@Injectable()
export class MockMapService {
  async geocode(addressText: string): Promise<Address | null> {
    const match = KAKINADA_PLACES.find((p) =>
      p.text.toLowerCase().includes(addressText.toLowerCase()),
    );

    if (match) {
      console.log(`🗺️ [MockMap] Geocoded "${addressText}" → ${match.latitude}, ${match.longitude}`);
      return match;
    }

    // Default to Kakinada center
    const fallback: Address = {
      text: addressText,
      latitude: 16.9891,
      longitude: 82.2475,
      placeId: 'mock-default',
    };
    console.log(`🗺️ [MockMap] Geocoded "${addressText}" → Kakinada center (fallback)`);
    return fallback;
  }

  async reverseGeocode(location: LatLng): Promise<Address | null> {
    // Find nearest known place
    let nearest = KAKINADA_PLACES[0]!;
    let minDist = Infinity;

    for (const place of KAKINADA_PLACES) {
      const dist = this.haversineDistance(location, {
        latitude: place.latitude,
        longitude: place.longitude,
      });
      if (dist < minDist) {
        minDist = dist;
        nearest = place;
      }
    }

    console.log(
      `🗺️ [MockMap] Reverse geocode (${location.latitude}, ${location.longitude}) → ${nearest.text}`,
    );
    return nearest;
  }

  async searchPlaces(query: string, _nearLocation?: LatLng): Promise<Address[]> {
    const results = KAKINADA_PLACES.filter((p) =>
      p.text.toLowerCase().includes(query.toLowerCase()),
    );
    console.log(`🗺️ [MockMap] Search "${query}" → ${results.length} results`);
    return results.length > 0 ? results : KAKINADA_PLACES.slice(0, 5);
  }

  /**
   * Haversine distance in meters between two LatLng points.
   */
  private haversineDistance(a: LatLng, b: LatLng): number {
    const R = 6371000; // Earth radius in meters
    const dLat = this.toRad(b.latitude - a.latitude);
    const dLng = this.toRad(b.longitude - a.longitude);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const h =
      sinDLat * sinDLat +
      Math.cos(this.toRad(a.latitude)) * Math.cos(this.toRad(b.latitude)) * sinDLng * sinDLng;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}

/**
 * Mock Routing Service — for development only.
 *
 * Returns straight-line distance × 1.4 (road factor) as route estimate.
 * Assumes average speed of 25 km/h for duration.
 */
@Injectable()
export class MockRoutingService {
  async getRoute(origin: LatLng, destination: LatLng): Promise<RouteInfo> {
    const straightLineMeters = this.haversineDistance(origin, destination);
    const roadFactor = 1.4;
    const distanceMeters = Math.round(straightLineMeters * roadFactor);
    const averageSpeedMps = 25 * 1000 / 3600; // 25 km/h in m/s
    const durationSeconds = Math.round(distanceMeters / averageSpeedMps);

    console.log(`🛣️ [MockRouting] Route: ${(distanceMeters / 1000).toFixed(2)} km, ${Math.round(durationSeconds / 60)} min`);

    return {
      distanceMeters,
      durationSeconds,
      polyline: undefined, // No polyline in mock mode
    };
  }

  private haversineDistance(a: LatLng, b: LatLng): number {
    const R = 6371000;
    const dLat = this.toRad(b.latitude - a.latitude);
    const dLng = this.toRad(b.longitude - a.longitude);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const h =
      sinDLat * sinDLat +
      Math.cos(this.toRad(a.latitude)) * Math.cos(this.toRad(b.latitude)) * sinDLng * sinDLng;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
