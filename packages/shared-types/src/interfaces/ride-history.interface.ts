import { RideStatus, PaymentMethod, PaymentStatus } from '../enums';
import { RatingResponseDto } from './rating.interface';

/**
 * Ride History Query DTO.
 */
export interface RideHistoryQueryDto {
  page?: number;
  limit?: number;
  status?: RideStatus | string;
  startDate?: string;
  endDate?: string;
}

/**
 * Ride History Item DTO for Rider and Driver.
 */
export interface RideHistoryItemDto {
  id: string;
  riderId: string;
  driverProfileId?: string | null;
  status: RideStatus | string;
  paymentMethod: PaymentMethod | string;
  estimatedFare?: number | null;
  actualFare?: number | null;
  estimatedDistanceMeters?: number | null;
  estimatedDurationSeconds?: number | null;
  requestedAt: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;

  location?: {
    pickupLatitude: number;
    pickupLongitude: number;
    pickupAddress: string;
    dropLatitude: number;
    dropLongitude: number;
    dropAddress: string;
  } | null;

  vehicle?: {
    id: string;
    registrationNumber: string;
    make?: string | null;
    model?: string | null;
    color?: string | null;
    vehicleType?: {
      name: string;
      displayName: string;
    };
  } | null;

  payment?: {
    id: string;
    amount: number;
    method: PaymentMethod | string;
    status: PaymentStatus | string;
    paidAt?: string | null;
  } | null;

  rider?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    phoneNumber?: string | null;
  } | null;

  driver?: {
    id: string;
    userId: string;
    firstName?: string | null;
    lastName?: string | null;
    phoneNumber?: string | null;
    averageRating?: number;
  } | null;

  ratings?: RatingResponseDto[];
  myRating?: RatingResponseDto | null;
}
