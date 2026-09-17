import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { AdminDriverService } from './admin-driver.service';
import { DriverStatus, VerificationStatus } from '@yatra-seva/shared-types';

describe('AdminDriverService', () => {
  let service: AdminDriverService;
  let mockPrisma: any;
  let mockAuditService: any;
  let mockNotificationsService: any;

  beforeEach(() => {
    mockPrisma = {
      driverProfile: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      driverDocument: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      ride: {
        findFirst: jest.fn().mockResolvedValue(null),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      adminAuditLog: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn(async (cb: (tx: any) => Promise<any>) => cb(mockPrisma)),
    };

    mockAuditService = {
      createAuditLog: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    mockNotificationsService = {
      createAndSendNotification: jest.fn().mockResolvedValue({ success: true }),
      sendPushNotification: jest.fn().mockResolvedValue({ success: true }),
    };

    service = new AdminDriverService(
      mockPrisma,
      mockAuditService,
      mockNotificationsService,
    );
  });

  describe('listDrivers', () => {
    it('should return paginated list of drivers with filtering', async () => {
      const mockDrivers = [
        {
          id: 'drv-1',
          user: { firstName: 'Ravi', lastName: 'Kumar', phoneNumber: '+919000000001' },
          verificationStatus: 'PENDING',
        },
      ];
      mockPrisma.driverProfile.findMany.mockResolvedValue(mockDrivers);
      mockPrisma.driverProfile.count.mockResolvedValue(1);

      const result = await service.listDrivers({
        page: 1,
        limit: 10,
        verificationStatus: 'PENDING',
      });

      expect(result.data).toEqual(mockDrivers);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe('getDriverDetail', () => {
    it('should throw NotFoundException if driver not found', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue(null);

      await expect(service.getDriverDetail('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return driver detail with user, vehicles, and documents', async () => {
      const mockDriver = {
        id: 'drv-1',
        user: { firstName: 'Ravi' },
        vehicles: [],
        documents: [],
      };
      mockPrisma.driverProfile.findUnique.mockResolvedValue(mockDriver);

      const result = await service.getDriverDetail('drv-1');
      expect(result.id).toBe('drv-1');
      expect(result.user).toEqual({ firstName: 'Ravi' });
    });
  });

  describe('approveDriver', () => {
    it('should approve driver when all required documents are verified', async () => {
      const mockDriver = {
        id: 'drv-1',
        userId: 'user-1',
        verificationStatus: VerificationStatus.PENDING,
      };
      const mockDocs = [
        { type: 'DRIVING_LICENSE', status: 'VERIFIED' },
        { type: 'VEHICLE_RC', status: 'VERIFIED' },
        { type: 'VEHICLE_INSURANCE', status: 'VERIFIED' },
        { type: 'IDENTITY_PROOF', status: 'VERIFIED' },
      ];
      mockPrisma.driverProfile.findUnique.mockResolvedValue(mockDriver);
      mockPrisma.driverDocument.findMany.mockResolvedValue(mockDocs);
      mockPrisma.driverProfile.update.mockResolvedValue({
        ...mockDriver,
        verificationStatus: VerificationStatus.APPROVED,
        isVerified: true,
      });

      const result = await service.approveDriver('drv-1', 'admin-user-1');

      expect(result.verificationStatus).toBe(VerificationStatus.APPROVED);
      expect(mockAuditService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DRIVER_APPROVED',
          entityType: 'DRIVER',
          entityId: 'drv-1',
          adminUserId: 'admin-user-1',
        }),
        expect.anything(),
      );
      expect(mockNotificationsService.createAndSendNotification).toHaveBeenCalled();
    });

    it('should throw BadRequestException if missing verified documents', async () => {
      const mockDriver = {
        id: 'drv-1',
        userId: 'user-1',
        verificationStatus: VerificationStatus.PENDING,
      };
      const mockDocs = [
        { type: 'DRIVING_LICENSE', status: 'PENDING' }, // not verified
      ];
      mockPrisma.driverProfile.findUnique.mockResolvedValue(mockDriver);
      mockPrisma.driverDocument.findMany.mockResolvedValue(mockDocs);

      await expect(service.approveDriver('drv-1', 'admin-user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('rejectDriver', () => {
    it('should reject driver with reason and create audit log', async () => {
      const mockDriver = {
        id: 'drv-1',
        userId: 'user-1',
        verificationStatus: VerificationStatus.PENDING,
      };
      mockPrisma.driverProfile.findUnique.mockResolvedValue(mockDriver);
      mockPrisma.driverProfile.update.mockResolvedValue({
        ...mockDriver,
        verificationStatus: VerificationStatus.REJECTED,
      });

      const result = await service.rejectDriver(
        'drv-1',
        'admin-user-1',
        'Invalid license document',
      );

      expect(result.verificationStatus).toBe(VerificationStatus.REJECTED);
      expect(mockAuditService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DRIVER_REJECTED',
          entityType: 'DRIVER',
          entityId: 'drv-1',
          reason: 'Invalid license document',
        }),
        expect.anything(),
      );
      expect(mockNotificationsService.createAndSendNotification).toHaveBeenCalled();
    });

    it('should throw BadRequestException if rejection reason is missing', async () => {
      await expect(service.rejectDriver('drv-1', 'admin-user-1', '')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('suspendDriver', () => {
    it('should suspend driver, set them offline, and log audit', async () => {
      const mockDriver = {
        id: 'drv-1',
        userId: 'user-1',
        verificationStatus: VerificationStatus.APPROVED,
        status: DriverStatus.ONLINE_AVAILABLE,
      };
      mockPrisma.driverProfile.findUnique.mockResolvedValue(mockDriver);
      mockPrisma.driverProfile.update.mockResolvedValue({
        ...mockDriver,
        verificationStatus: VerificationStatus.SUSPENDED,
        status: DriverStatus.OFFLINE,
      });

      const result = await service.suspendDriver(
        'drv-1',
        'admin-user-1',
        'Safety investigation pending',
      );

      expect(result.verificationStatus).toBe(VerificationStatus.SUSPENDED);
      expect(result.status).toBe(DriverStatus.OFFLINE);
      expect(mockAuditService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DRIVER_SUSPENDED',
          entityType: 'DRIVER',
          entityId: 'drv-1',
          reason: 'Safety investigation pending',
        }),
        expect.anything(),
      );
      expect(mockNotificationsService.createAndSendNotification).toHaveBeenCalled();
    });
  });

  describe('document verification', () => {
    it('should verify document and create audit log', async () => {
      const mockDoc = {
        id: 'doc-1',
        driverProfileId: 'drv-1',
        status: 'PENDING',
        type: 'DRIVING_LICENSE',
      };
      mockPrisma.driverDocument.findUnique.mockResolvedValue(mockDoc);
      mockPrisma.driverDocument.update.mockResolvedValue({
        ...mockDoc,
        status: 'VERIFIED',
      });
      mockPrisma.driverProfile.findUnique.mockResolvedValue({
        id: 'drv-1',
        verificationStatus: 'PENDING',
      });
      mockPrisma.driverProfile.update.mockResolvedValue({
        id: 'drv-1',
        verificationStatus: 'UNDER_REVIEW',
      });

      const result = await service.approveDocument('drv-1', 'doc-1', 'admin-user-1');

      expect(result.status).toBe('VERIFIED');
      expect(mockAuditService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DOCUMENT_APPROVED',
          entityType: 'DOCUMENT',
          entityId: 'doc-1',
        }),
        expect.anything(),
      );
    });

    it('should reject document with reason and create audit log', async () => {
      const mockDoc = {
        id: 'doc-1',
        driverProfileId: 'drv-1',
        status: 'PENDING',
        type: 'DRIVING_LICENSE',
      };
      mockPrisma.driverDocument.findUnique.mockResolvedValue(mockDoc);
      mockPrisma.driverDocument.update.mockResolvedValue({
        ...mockDoc,
        status: 'REJECTED',
        rejectionReason: 'Blurred photo',
      });

      const result = await service.rejectDocument(
        'drv-1',
        'doc-1',
        'admin-user-1',
        'Blurred photo',
      );

      expect(result.status).toBe('REJECTED');
      expect(mockAuditService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DOCUMENT_REJECTED',
          entityType: 'DOCUMENT',
          entityId: 'doc-1',
          reason: 'Blurred photo',
        }),
        expect.anything(),
      );
    });
  });
});
