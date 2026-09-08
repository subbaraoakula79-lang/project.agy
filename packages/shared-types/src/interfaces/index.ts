/** Standard API response wrapper. */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

/** API error details. */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/** Pagination and response metadata. */
export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

/** Paginated query parameters. */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** Geographic coordinate pair. */
export interface LatLng {
  latitude: number;
  longitude: number;
}

/** Address with optional geocoded coordinates. */
export interface Address {
  text: string;
  latitude: number;
  longitude: number;
  placeId?: string;
}

/** Fare estimate returned to the rider before booking. */
export interface FareEstimate {
  vehicleType: string;
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  surgeMultiplier: number;
  totalFare: number;
  currency: string;
  estimatedDistanceKm: number;
  estimatedDurationMinutes: number;
}

/** User profile response object. */
export interface UserResponse {
  id: string;
  phoneNumber?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** JWT token pair returned after authentication. */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user?: UserResponse;
}
