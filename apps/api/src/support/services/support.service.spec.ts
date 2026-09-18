import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SupportService } from './support.service';

describe('SupportService (Unit)', () => {
  let service: SupportService;
  let prismaMock: any;

  const mockUser1 = 'user-1';
  const mockUser2 = 'user-2';

  beforeEach(() => {
    prismaMock = {
      ride: {
        findUnique: jest.fn(),
      },
      supportTicket: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      adminAuditLog: {
        create: jest.fn(),
      },
    };

    service = new SupportService(prismaMock);
  });

  it('should create support ticket without ride link', async () => {
    prismaMock.supportTicket.create.mockResolvedValue({
      id: 'ticket-1',
      createdByUserId: mockUser1,
      subject: 'Payment Inquiry',
      category: 'PAYMENT',
      status: 'OPEN',
    });

    const result = await service.createTicket(mockUser1, {
      category: 'PAYMENT',
      subject: 'Payment Inquiry',
      description: 'Need help with receipt',
    });

    expect(result.id).toBe('ticket-1');
  });

  it('should verify ride ownership when rideId is provided', async () => {
    prismaMock.ride.findUnique.mockResolvedValue({
      id: 'ride-100',
      riderId: 'other-user',
      driverProfile: { userId: 'other-driver' },
    });

    await expect(
      service.createTicket(mockUser1, {
        rideId: 'ride-100',
        category: 'RIDE',
        subject: 'Issue',
        description: 'Details',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject non-owner access to private ticket detail', async () => {
    prismaMock.supportTicket.findUnique.mockResolvedValue({
      id: 'ticket-1',
      createdByUserId: mockUser1,
    });

    await expect(
      service.getTicketById('ticket-1', mockUser2, 'RIDER'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should allow admin access to any support ticket', async () => {
    const mockTicket = { id: 'ticket-1', createdByUserId: mockUser1 };
    prismaMock.supportTicket.findUnique.mockResolvedValue(mockTicket);

    const result = await service.getTicketById('ticket-1', 'admin-id', 'ADMIN');
    expect(result).toBe(mockTicket);
  });
});
