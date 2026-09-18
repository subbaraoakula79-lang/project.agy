import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { RideStatus, UserRole } from '@yatra-seva/shared-types';

describe('RatingsService', () => {
  let service: RatingsService;
  let prismaMock: any;
  let notificationsMock: any;

  const mockRiderId = 'rider-user-123';
  const mockDriverUserId = 'driver-user-456';
  const mockDriverProfileId = 'driver-profile-789';
  const mockRideId = 'ride-completed-100';
  const mockUnrelatedUserId = 'unrelated-user-999';

  beforeEach(() => {
    prismaMock = {
      ride: {
        findUnique: jest.fn(),
      },
      rating: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      driverProfile: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      riderProfile: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prismaMock)),
    };

    notificationsMock = {
      createAndSendNotification: jest.fn().mockResolvedValue(true),
    };

    service = new RatingsService(prismaMock, notificationsMock);
  });

  describe('createRating', () => {
    it('should successfully allow rider to rate driver for a completed ride', async () => {
      prismaMock.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        riderId: mockRiderId,
        driverProfile: { id: mockDriverProfileId, userId: mockDriverUserId },
        status: RideStatus.COMPLETED,
        completedAt: new Date(),
      });

      prismaMock.rating.findUnique.mockResolvedValue(null);
      prismaMock.rating.create.mockResolvedValue({
        id: 'rating-1',
        rideId: mockRideId,
        raterUserId: mockRiderId,
        ratedUserId: mockDriverUserId,
        rating: 5,
        comment: 'Great ride!',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      prismaMock.rating.findMany.mockResolvedValue([{ rating: 5 }]);
      prismaMock.driverProfile.findUnique.mockResolvedValue({ id: mockDriverProfileId, userId: mockDriverUserId });

      const result = await service.createRating(mockRideId, mockRiderId, {
        rating: 5,
        comment: 'Great ride!',
      });

      expect(result.id).toBe('rating-1');
      expect(prismaMock.driverProfile.update).toHaveBeenCalledWith({
        where: { userId: mockDriverUserId },
        data: { averageRating: 5 },
      });
      expect(notificationsMock.createAndSendNotification).toHaveBeenCalled();
    });

    it('should successfully allow driver to rate rider for a completed ride', async () => {
      prismaMock.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        riderId: mockRiderId,
        driverProfile: { id: mockDriverProfileId, userId: mockDriverUserId },
        status: RideStatus.COMPLETED,
        completedAt: new Date(),
      });

      prismaMock.rating.findUnique.mockResolvedValue(null);
      prismaMock.rating.create.mockResolvedValue({
        id: 'rating-2',
        rideId: mockRideId,
        raterUserId: mockDriverUserId,
        ratedUserId: mockRiderId,
        rating: 4,
        comment: 'Polite rider',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      prismaMock.rating.findMany.mockResolvedValue([{ rating: 4 }]);
      prismaMock.riderProfile.findUnique.mockResolvedValue({ userId: mockRiderId });

      const result = await service.createRating(mockRideId, mockDriverUserId, {
        rating: 4,
        comment: 'Polite rider',
      });

      expect(result.id).toBe('rating-2');
      expect(prismaMock.riderProfile.update).toHaveBeenCalledWith({
        where: { userId: mockRiderId },
        data: { averageRating: 4 },
      });
    });

    it('should reject non-integer ratings or scores out of 1-5 range', async () => {
      await expect(
        service.createRating(mockRideId, mockRiderId, { rating: 6 }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.createRating(mockRideId, mockRiderId, { rating: 0 }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.createRating(mockRideId, mockRiderId, { rating: 3.5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject non-participants from submitting a rating (IDOR protection)', async () => {
      prismaMock.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        riderId: mockRiderId,
        driverProfile: { id: mockDriverProfileId, userId: mockDriverUserId },
        status: RideStatus.COMPLETED,
        completedAt: new Date(),
      });

      await expect(
        service.createRating(mockRideId, mockUnrelatedUserId, { rating: 5 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject rating submission for unfinished rides', async () => {
      prismaMock.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        riderId: mockRiderId,
        driverProfile: { id: mockDriverProfileId, userId: mockDriverUserId },
        status: RideStatus.RIDE_STARTED,
        completedAt: null,
      });

      await expect(
        service.createRating(mockRideId, mockRiderId, { rating: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject rating submission for cancelled rides', async () => {
      prismaMock.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        riderId: mockRiderId,
        driverProfile: { id: mockDriverProfileId, userId: mockDriverUserId },
        status: RideStatus.CANCELLED_BY_RIDER,
        completedAt: null,
      });

      await expect(
        service.createRating(mockRideId, mockRiderId, { rating: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate rating submissions by the same rater for the same ride', async () => {
      prismaMock.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        riderId: mockRiderId,
        driverProfile: { id: mockDriverProfileId, userId: mockDriverUserId },
        status: RideStatus.COMPLETED,
        completedAt: new Date(),
      });

      prismaMock.rating.findUnique.mockResolvedValue({
        id: 'existing-rating-1',
        rideId: mockRideId,
        raterUserId: mockRiderId,
      });

      await expect(
        service.createRating(mockRideId, mockRiderId, { rating: 5 }),
      ).rejects.toThrow(ConflictException);
    });

    it('should isolate notification dispatch failure without rolling back rating creation', async () => {
      prismaMock.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        riderId: mockRiderId,
        driverProfile: { id: mockDriverProfileId, userId: mockDriverUserId },
        status: RideStatus.COMPLETED,
        completedAt: new Date(),
      });

      prismaMock.rating.findUnique.mockResolvedValue(null);
      prismaMock.rating.create.mockResolvedValue({
        id: 'rating-3',
        rideId: mockRideId,
        raterUserId: mockRiderId,
        ratedUserId: mockDriverUserId,
        rating: 5,
      });
      prismaMock.rating.findMany.mockResolvedValue([{ rating: 5 }]);

      notificationsMock.createAndSendNotification.mockRejectedValue(new Error('Push notification gateway down'));

      const result = await service.createRating(mockRideId, mockRiderId, { rating: 5 });

      expect(result.id).toBe('rating-3');
    });
  });

  describe('getRideRatings', () => {
    it('should allow ride participants to fetch ride ratings', async () => {
      prismaMock.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        riderId: mockRiderId,
        driverProfile: { userId: mockDriverUserId },
      });

      prismaMock.rating.findMany.mockResolvedValue([
        { id: 'r1', rating: 5, raterUserId: mockRiderId },
      ]);

      const ratings = await service.getRideRatings(mockRideId, mockRiderId, false);
      expect(ratings).toHaveLength(1);
    });

    it('should deny non-participants from viewing ride ratings unless admin', async () => {
      prismaMock.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        riderId: mockRiderId,
        driverProfile: { userId: mockDriverUserId },
      });

      await expect(
        service.getRideRatings(mockRideId, mockUnrelatedUserId, false),
      ).rejects.toThrow(ForbiddenException);

      // Admin access should succeed
      prismaMock.rating.findMany.mockResolvedValue([{ id: 'r1' }]);
      const adminResult = await service.getRideRatings(mockRideId, mockUnrelatedUserId, true);
      expect(adminResult).toHaveLength(1);
    });
  });
});
