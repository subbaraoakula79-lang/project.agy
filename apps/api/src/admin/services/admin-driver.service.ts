import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AdminAuditService } from './admin-audit.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, VerificationStatus } from '@yatra-seva/shared-types';

@Injectable()
export class AdminDriverService {
  private readonly logger = new Logger(AdminDriverService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * List drivers with server-side pagination, search, and filtering.
   */
  async listDrivers(query: {
    page?: number;
    limit?: number;
    search?: string;
    verificationStatus?: string;
    status?: string;
    vehicleType?: string;
  }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (query.verificationStatus) {
      where.verificationStatus = query.verificationStatus;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.vehicleType) {
      where.vehicles = {
        some: {
          vehicleType: { name: query.vehicleType },
          isActive: true,
          deletedAt: null,
        },
      };
    }

    if (query.search) {
      const searchTerm = query.search.trim();
      where.OR = [
        { user: { firstName: { contains: searchTerm, mode: 'insensitive' } } },
        { user: { lastName: { contains: searchTerm, mode: 'insensitive' } } },
        { user: { phoneNumber: { contains: searchTerm } } },
        {
          vehicles: {
            some: {
              registrationNumber: { contains: searchTerm, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const [drivers, total] = await Promise.all([
      this.prisma.driverProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              email: true,
              isActive: true,
              createdAt: true,
            },
          },
          vehicles: {
            where: { deletedAt: null },
            include: { vehicleType: true },
            take: 3,
          },
          city: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.driverProfile.count({ where }),
    ]);

    return {
      data: drivers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get detailed driver profile including documents, vehicles, current ride, and stats.
   */
  async getDriverDetail(driverProfileId: string) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { id: driverProfileId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        vehicles: {
          where: { deletedAt: null },
          include: { vehicleType: true },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        city: true,
      },
    });

    if (!driver) {
      throw new NotFoundException(`Driver profile not found: ${driverProfileId}`);
    }

    // Get current active ride if any
    const currentRide = await this.prisma.ride.findFirst({
      where: {
        driverProfileId,
        status: {
          in: [
            'DRIVER_ASSIGNED',
            'DRIVER_ARRIVING',
            'DRIVER_EN_ROUTE',
            'DRIVER_ARRIVED',
            'RIDE_STARTED',
            'RIDE_IN_PROGRESS',
            'RIDE_COMPLETED',
            'PAYMENT_PENDING',
          ],
        },
      },
      include: { location: true },
      orderBy: { createdAt: 'desc' },
    });

    // Get ride stats
    const rideStats = await this.prisma.ride.groupBy({
      by: ['status'],
      where: { driverProfileId },
      _count: true,
    });

    // Get recent audit logs for this driver
    const auditLogs = await this.prisma.adminAuditLog.findMany({
      where: {
        entityType: 'DRIVER',
        entityId: driverProfileId,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      ...driver,
      currentRide,
      rideStats,
      auditHistory: auditLogs,
    };
  }

  /**
   * Approve a driver for operational eligibility.
   */
  async approveDriver(driverProfileId: string, adminUserId: string) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { id: driverProfileId },
      include: { user: true },
    });

    if (!driver) {
      throw new NotFoundException(`Driver profile not found: ${driverProfileId}`);
    }

    const allowedFrom = [
      VerificationStatus.PENDING,
      VerificationStatus.UNDER_REVIEW,
      VerificationStatus.REJECTED,
    ];

    if (!allowedFrom.includes(driver.verificationStatus as VerificationStatus)) {
      throw new ConflictException(
        `Cannot approve driver from status ${driver.verificationStatus}`,
      );
    }

    // Verify all required documents exist and are approved
    const documents = await this.prisma.driverDocument.findMany({
      where: { driverProfileId },
    });

    const requiredTypes = ['DRIVING_LICENSE', 'VEHICLE_RC', 'VEHICLE_INSURANCE', 'IDENTITY_PROOF'];
    const verifiedTypes = new Set(
      documents.filter((d) => d.status === 'VERIFIED').map((d) => d.type),
    );

    const missingDocs = requiredTypes.filter((t) => !verifiedTypes.has(t));
    if (missingDocs.length > 0) {
      throw new BadRequestException(
        `Cannot approve driver: missing or unverified documents: ${missingDocs.join(', ')}`,
      );
    }

    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.driverProfile.update({
        where: { id: driverProfileId },
        data: {
          verificationStatus: VerificationStatus.APPROVED,
          isVerified: true,
          isOnboarded: true,
          approvedAt: now,
          approvedByUserId: adminUserId,
          rejectionReason: null,
          rejectedAt: null,
          suspensionReason: null,
          suspendedAt: null,
        },
      });

      await this.auditService.createAuditLog(
        {
          adminUserId,
          action: 'DRIVER_APPROVED',
          entityType: 'DRIVER',
          entityId: driverProfileId,
          metadata: { previousStatus: driver.verificationStatus },
        },
        tx,
      );

      return result;
    });

    // Send notification to driver
    this.notificationsService
      .createAndSendNotification({
        userId: driver.userId,
        type: NotificationType.DRIVER_APPROVED,
        title: 'Account Approved',
        body: 'Congratulations! Your driver account has been approved. You can now go online and accept rides.',
        data: { driverProfileId },
      })
      .catch((err) => this.logger.error(`Notification failed: ${err.message}`));

    this.logger.log(`Driver ${driverProfileId} APPROVED by admin ${adminUserId}`);
    return updated;
  }

  /**
   * Reject a driver's onboarding application.
   */
  async rejectDriver(
    driverProfileId: string,
    adminUserId: string,
    reason: string,
  ) {
    if (!reason || !reason.trim()) {
      throw new BadRequestException('Rejection reason is required');
    }

    const driver = await this.prisma.driverProfile.findUnique({
      where: { id: driverProfileId },
      include: { user: true },
    });

    if (!driver) {
      throw new NotFoundException(`Driver profile not found: ${driverProfileId}`);
    }

    const allowedFrom = [
      VerificationStatus.PENDING,
      VerificationStatus.UNDER_REVIEW,
    ];

    if (!allowedFrom.includes(driver.verificationStatus as VerificationStatus)) {
      throw new ConflictException(
        `Cannot reject driver from status ${driver.verificationStatus}`,
      );
    }

    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.driverProfile.update({
        where: { id: driverProfileId },
        data: {
          verificationStatus: VerificationStatus.REJECTED,
          isVerified: false,
          isOnboarded: false,
          rejectionReason: reason,
          rejectedAt: now,
        },
      });

      await this.auditService.createAuditLog(
        {
          adminUserId,
          action: 'DRIVER_REJECTED',
          entityType: 'DRIVER',
          entityId: driverProfileId,
          reason,
          metadata: { previousStatus: driver.verificationStatus },
        },
        tx,
      );

      return result;
    });

    // Send notification to driver
    this.notificationsService
      .createAndSendNotification({
        userId: driver.userId,
        type: NotificationType.DRIVER_REJECTED,
        title: 'Application Update',
        body: `Your driver application was not approved. Reason: ${reason}`,
        data: { driverProfileId, reason },
      })
      .catch((err) => this.logger.error(`Notification failed: ${err.message}`));

    this.logger.log(`Driver ${driverProfileId} REJECTED by admin ${adminUserId}: ${reason}`);
    return updated;
  }

  /**
   * Suspend an approved driver. Prevents new matching but preserves active rides.
   */
  async suspendDriver(
    driverProfileId: string,
    adminUserId: string,
    reason: string,
  ) {
    if (!reason || !reason.trim()) {
      throw new BadRequestException('Suspension reason is required');
    }

    const driver = await this.prisma.driverProfile.findUnique({
      where: { id: driverProfileId },
      include: { user: true },
    });

    if (!driver) {
      throw new NotFoundException(`Driver profile not found: ${driverProfileId}`);
    }

    if (driver.verificationStatus === VerificationStatus.SUSPENDED) {
      throw new ConflictException('Driver is already suspended');
    }

    if (driver.verificationStatus !== VerificationStatus.APPROVED) {
      throw new ConflictException(
        `Cannot suspend driver from status ${driver.verificationStatus}`,
      );
    }

    const now = new Date();

    // Check if driver has an active ride
    const activeRide = await this.prisma.ride.findFirst({
      where: {
        driverProfileId,
        status: {
          in: [
            'DRIVER_ASSIGNED',
            'DRIVER_ARRIVING',
            'DRIVER_EN_ROUTE',
            'DRIVER_ARRIVED',
            'RIDE_STARTED',
            'RIDE_IN_PROGRESS',
            'RIDE_COMPLETED',
            'PAYMENT_PENDING',
          ],
        },
      },
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      // Suspend verification but preserve ride state
      // If driver is BUSY on a ride, keep BUSY status so ride can complete
      // Otherwise set to OFFLINE
      const newStatus = activeRide ? driver.status : 'OFFLINE';

      const result = await tx.driverProfile.update({
        where: { id: driverProfileId },
        data: {
          verificationStatus: VerificationStatus.SUSPENDED,
          isVerified: false,
          suspensionReason: reason,
          suspendedAt: now,
          status: newStatus,
        },
      });

      await this.auditService.createAuditLog(
        {
          adminUserId,
          action: 'DRIVER_SUSPENDED',
          entityType: 'DRIVER',
          entityId: driverProfileId,
          reason,
          metadata: {
            previousStatus: driver.verificationStatus,
            hadActiveRide: !!activeRide,
            activeRideId: activeRide?.id,
          },
        },
        tx,
      );

      return result;
    });

    // Send notification to driver
    this.notificationsService
      .createAndSendNotification({
        userId: driver.userId,
        type: NotificationType.DRIVER_SUSPENDED,
        title: 'Account Suspended',
        body: `Your driver account has been suspended. Reason: ${reason}`,
        data: { driverProfileId, reason },
      })
      .catch((err) => this.logger.error(`Notification failed: ${err.message}`));

    this.logger.log(`Driver ${driverProfileId} SUSPENDED by admin ${adminUserId}: ${reason}`);
    return { ...updated, hasActiveRide: !!activeRide };
  }

  /**
   * Reactivate a suspended driver back to APPROVED.
   */
  async reactivateDriver(driverProfileId: string, adminUserId: string) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { id: driverProfileId },
    });

    if (!driver) {
      throw new NotFoundException(`Driver profile not found: ${driverProfileId}`);
    }

    if (driver.verificationStatus !== VerificationStatus.SUSPENDED) {
      throw new ConflictException(
        `Cannot reactivate driver from status ${driver.verificationStatus}. Only suspended drivers can be reactivated.`,
      );
    }

    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.driverProfile.update({
        where: { id: driverProfileId },
        data: {
          verificationStatus: VerificationStatus.APPROVED,
          isVerified: true,
          isOnboarded: true,
          suspensionReason: null,
          suspendedAt: null,
          approvedAt: now,
          approvedByUserId: adminUserId,
        },
      });

      await this.auditService.createAuditLog(
        {
          adminUserId,
          action: 'DRIVER_REACTIVATED',
          entityType: 'DRIVER',
          entityId: driverProfileId,
          metadata: { previousStatus: driver.verificationStatus },
        },
        tx,
      );

      return result;
    });

    this.logger.log(`Driver ${driverProfileId} REACTIVATED by admin ${adminUserId}`);
    return updated;
  }

  /**
   * Get documents for a specific driver.
   */
  async getDriverDocuments(driverProfileId: string) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { id: driverProfileId },
    });

    if (!driver) {
      throw new NotFoundException(`Driver profile not found: ${driverProfileId}`);
    }

    return this.prisma.driverDocument.findMany({
      where: { driverProfileId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Approve a driver document.
   */
  async approveDocument(
    driverProfileId: string,
    documentId: string,
    adminUserId: string,
  ) {
    const document = await this.prisma.driverDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`Document not found: ${documentId}`);
    }

    // IDOR check: document belongs to the specified driver
    if (document.driverProfileId !== driverProfileId) {
      throw new NotFoundException(`Document not found for driver: ${driverProfileId}`);
    }

    if (document.status === 'APPROVED') {
      return document;
    }

    if (document.status !== 'PENDING' && document.status !== 'REJECTED') {
      throw new ConflictException(
        `Cannot approve document from status ${document.status}`,
      );
    }

    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.driverDocument.update({
        where: { id: documentId },
        data: {
          status: 'APPROVED',
          verifiedAt: now,
          reviewedByUserId: adminUserId,
          rejectionReason: null,
        },
      });

      await this.auditService.createAuditLog(
        {
          adminUserId,
          action: 'DOCUMENT_APPROVED',
          entityType: 'DOCUMENT',
          entityId: documentId,
          metadata: {
            driverProfileId,
            documentType: document.type,
            previousStatus: document.status,
          },
        },
        tx,
      );

      return result;
    });

    this.logger.log(`Document ${documentId} APPROVED by admin ${adminUserId}`);
    return updated;
  }

  /**
   * Reject a driver document with reason.
   */
  async rejectDocument(
    driverProfileId: string,
    documentId: string,
    adminUserId: string,
    reason: string,
  ) {
    if (!reason || !reason.trim()) {
      throw new BadRequestException('Rejection reason is required');
    }

    const document = await this.prisma.driverDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`Document not found: ${documentId}`);
    }

    // IDOR check
    if (document.driverProfileId !== driverProfileId) {
      throw new NotFoundException(`Document not found for driver: ${driverProfileId}`);
    }

    if (document.status !== 'PENDING' && document.status !== 'APPROVED') {
      throw new ConflictException(
        `Cannot reject document from status ${document.status}`,
      );
    }

    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.driverDocument.update({
        where: { id: documentId },
        data: {
          status: 'REJECTED',
          rejectionReason: reason,
          verifiedAt: now,
          reviewedByUserId: adminUserId,
        },
      });

      await this.auditService.createAuditLog(
        {
          adminUserId,
          action: 'DOCUMENT_REJECTED',
          entityType: 'DOCUMENT',
          entityId: documentId,
          reason,
          metadata: {
            driverProfileId,
            documentType: document.type,
            previousStatus: document.status,
          },
        },
        tx,
      );

      return result;
    });

    this.logger.log(`Document ${documentId} REJECTED by admin ${adminUserId}: ${reason}`);
    return updated;
  }
}
