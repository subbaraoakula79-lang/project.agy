/**
 * DTO for creating a rating for a completed ride.
 */
export interface CreateRatingDto {
  rating: number; // Integer 1-5
  comment?: string; // Optional comment (max 500 chars)
}

/**
 * Rating response object.
 */
export interface RatingResponseDto {
  id: string;
  rideId: string;
  raterUserId: string;
  ratedUserId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
  rater?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    role: string;
  };
  ratedUser?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    role: string;
  };
}

/**
 * User Rating Summary Aggregate.
 */
export interface UserRatingAggregateDto {
  averageRating: number;
  totalRatings: number;
}
