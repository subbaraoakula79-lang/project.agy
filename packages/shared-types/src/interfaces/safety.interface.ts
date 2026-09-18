export interface TriggerSosDto {
  rideId: string;
  description?: string;
}

export interface ResolveSosDto {
  reason?: string;
}

export interface ShareTripDto {
  rideId: string;
}

export interface PublicSharedTripVo {
  shareToken: string;
  rideId: string;
  status: string;
  pickupAddress: string;
  dropAddress: string;
  vehicleType: string;
  vehicleRegistration?: string | null;
  driverFirstName?: string | null;
  riderFirstName?: string | null;
  expiresAt: string;
}

export interface SafetyEventVo {
  id: string;
  rideId: string;
  reportedByUserId: string;
  type: string;
  status: string;
  description?: string | null;
  resolvedAt?: string | null;
  resolvedByUserId?: string | null;
  createdAt: string;
}
