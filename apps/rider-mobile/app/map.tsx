// apps/rider-mobile/app/map.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, UrlTile, Region } from 'react-native-maps';
import * as Location from 'expo-location';

// Types for location objects
interface LatLng {
  latitude: number;
  longitude: number;
}
interface Place {
  latitude: number;
  longitude: number;
  address?: string;
  placeId?: string;
}

export default function RiderMapScreen() {
  // Permission & location state
  const [locationPermission, setLocationPermission] = useState<'UNDETERMINED' | 'GRANTED' | 'DENIED'>('UNDETERMINED');
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Map & marker state
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [pickup, setPickup] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);

  // Request location permission on mount
  useEffect(() => {
    (async () => {
      setLocationLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          setLocationPermission('GRANTED');
          const pos = await Location.getCurrentPositionAsync({});
          setCurrentLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        } else {
          setLocationPermission('DENIED');
          setLocationError('Location permission denied');
        }
      } catch (e) {
        setLocationPermission('DENIED');
        setLocationError('Failed to request location permission');
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

  // Helper to fit map to markers
  const fitToMarkers = (mapRef: any) => {
    const markers: LatLng[] = [];
    if (currentLocation) markers.push(currentLocation);
    if (pickup) markers.push({ latitude: pickup.latitude, longitude: pickup.longitude });
    if (destination) markers.push({ latitude: destination.latitude, longitude: destination.longitude });
    if (markers.length > 0) {
      mapRef.fitToCoordinates(markers, {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      });
    }
  };

  // Long press handler to set pickup/destination
  const handleLongPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    if (!pickup) {
      setPickup({ latitude, longitude });
    } else if (!destination) {
      setDestination({ latitude, longitude });
    } else {
      // Reset if both already set
      setPickup({ latitude, longitude });
      setDestination(null);
    }
  };

  // Render loading / error states
  if (locationLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e94560" />
        <Text style={styles.info}>Fetching location…</Text>
      </View>
    );
  }

  if (locationError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{locationError}</Text>
        <TouchableOpacity style={styles.button} onPress={() => {
          // Retry permission request
          setLocationError(null);
          setLocationPermission('UNDETERMINED');
          // Trigger effect again
          setLocationLoading(true);
        }}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const mapKey = process.env.EXPO_PUBLIC_MAPTILER_API_KEY;
  if (!mapKey) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>MapTiler API key not configured.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        showsUserLocation={true}
        onMapReady={() => setMapReady(true)}
        onLongPress={handleLongPress}
        onError={(e) => setMapError(e.nativeEvent.error)}
        ref={(ref) => {
          if (ref && mapReady) {
            fitToMarkers(ref);
          }
        }}
      >
        {/* MapTiler tile layer */}
        <UrlTile
          urlTemplate={`https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${mapKey}`}
          maximumZ={19}
          flipY={false}
        />
        {pickup && (
          <Marker
            coordinate={{ latitude: pickup.latitude, longitude: pickup.longitude }}
            title="Pickup"
            pinColor="#27ae60"
          />
        )}
        {destination && (
          <Marker
            coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}
            title="Destination"
            pinColor="#e94560"
          />
        )}
      </MapView>

      {/* Info panel */}
      <View style={styles.infoPanel}>
        <Text style={styles.info}>Long‑press to set Pickup → then Destination.</Text>
        {pickup && (
          <Text style={styles.info}>Pickup: {pickup.latitude.toFixed(5)}, {pickup.longitude.toFixed(5)}</Text>
        )}
        {destination && (
          <Text style={styles.info}>Destination: {destination.latitude.toFixed(5)}, {destination.longitude.toFixed(5)}</Text>
        )}
        <TouchableOpacity style={styles.button} onPress={() => {
          // Reset selections
          setPickup(null);
          setDestination(null);
        }}>
          <Text style={styles.buttonText}>Reset Markers</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  infoPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#0f3460',
    padding: 12,
    borderRadius: 8,
  },
  info: {
    color: '#eaeaea',
    fontSize: 14,
    marginBottom: 4,
  },
  error: {
    color: '#ff6b6b',
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#e94560',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
