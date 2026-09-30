// apps/rider-mobile/app/context/MapContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type LocationPoint = {
  latitude: number;
  longitude: number;
  address?: string;
  placeId?: string;
};

interface MapContextValue {
  pickup: LocationPoint | null;
  destination: LocationPoint | null;
  setPickup: (p: LocationPoint) => void;
  setDestination: (d: LocationPoint) => void;
  clearLocations: () => void;
}

const MapContext = createContext<MapContextValue | undefined>(undefined);

export const MapProvider = ({ children }: { children: ReactNode }) => {
  const [pickup, setPickup] = useState<LocationPoint | null>(null);
  const [destination, setDestination] = useState<LocationPoint | null>(null);

  const clearLocations = () => {
    setPickup(null);
    setDestination(null);
  };

  return (
    <MapContext.Provider
      value={{ pickup, destination, setPickup, setDestination, clearLocations }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMapContext = (): MapContextValue => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
};
