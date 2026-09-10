export enum DriverRideRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export interface DriverRideRequestDto {
  id: string;
  rideId: string;
  driverProfileId: string;
  status: DriverRideRequestStatus;
  expiresAt: string;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DriverAvailabilityDto {
  status: 'OFFLINE' | 'ONLINE_AVAILABLE' | 'BUSY';
  hasActiveVehicle: boolean;
  activeVehicle?: {
    id: string;
    make?: string | null;
    model?: string | null;
    registrationNumber: string;
    vehicleTypeName: string;
  } | null;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  lastLocationAt?: string | null;
}
