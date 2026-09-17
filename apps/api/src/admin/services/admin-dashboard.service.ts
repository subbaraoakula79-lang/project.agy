import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalDrivers,
      pendingDrivers,
      underReviewDrivers,
      approvedDrivers,
      suspendedDrivers,
      onlineDrivers,
      totalRides,
      activeRides,
      completedRides,
      cancelledRides,
      todayRides,
      totalVehicles,
      activeVehicles,
      recentAuditLogs,
      recentRides,
      fareAggregation,
    ] = await Promise.all([
      this.prisma.driverProfile.count(),
      this.prisma.driverProfile.count({ where: { verificationStatus: 'PENDING' } }),
      this.prisma.driverProfile.count({ where: { verificationStatus: 'UNDER_REVIEW' } }),
      this.prisma.driverProfile.count({ where: { verificationStatus: 'APPROVED' } }),
      this.prisma.driverProfile.count({ where: { verificationStatus: 'SUSPENDED' } }),
      this.prisma.driverProfile.count({
        where: {
          status: { in: ['ONLINE', 'ONLINE_AVAILABLE', 'ONLINE_BUSY'] },
        },
      }),
      this.prisma.ride.count(),
      this.prisma.ride.count({
        where: {
          status: {
            in: [
              'REQUESTED',
              'SEARCHING',
              'OFFERED',
              'MATCHED',
              'ACCEPTED',
              'ARRIVING',
              'DRIVER_ARRIVED',
              'RIDE_STARTED',
              'IN_PROGRESS',
            ],
          },
        },
      }),
      this.prisma.ride.count({ where: { status: 'COMPLETED' } }),
      this.prisma.ride.count({
        where: {
          status: {
            in: [
              'CANCELLED_BY_RIDER',
              'CANCELLED_BY_DRIVER',
              'CANCELLED_BY_ADMIN',
              'CANCELLED_BY_SYSTEM',
            ],
          },
        },
      }),
      this.prisma.ride.count({
        where: {
          createdAt: { gte: todayStart },
        },
      }),
      this.prisma.vehicle.count(),
      this.prisma.vehicle.count({ where: { isActive: true } }),
      this.prisma.adminAuditLog.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ride.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          rider: { select: { id: true, firstName: true, lastName: true, phoneNumber: true } },
          driverProfile: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, phoneNumber: true } },
            },
          },
        },
      }),
      this.prisma.ride.aggregate({
        where: { status: 'COMPLETED' },
        _sum: {
          actualFare: true,
        },
      }),
    ]);

    return {
      drivers: {
        total: totalDrivers,
        pending: pendingDrivers,
        underReview: underReviewDrivers,
        approved: approvedDrivers,
        suspended: suspendedDrivers,
        online: onlineDrivers,
      },
      rides: {
        total: totalRides,
        active: activeRides,
        completed: completedRides,
        cancelled: cancelledRides,
        today: todayRides,
        totalGrossFare: fareAggregation._sum.actualFare || 0,
      },
      vehicles: {
        total: totalVehicles,
        active: activeVehicles,
      },
      recentAuditLogs,
      recentRides,
    };
  }
}
