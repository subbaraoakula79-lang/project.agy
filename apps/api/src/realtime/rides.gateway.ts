import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { TokenService } from '../auth/services/token.service';
import { PrismaService } from '../database/prisma.service';

export interface AuthenticatedSocket extends Socket {
  user?: {
    userId: string;
    role: string;
    driverProfileId?: string;
  };
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/rides',
})
export class RidesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RidesGateway.name);

  constructor(
    private readonly tokenService: TokenService,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from auth payload, query, or authorization header
      const authHeader = client.handshake.headers['authorization'];
      const token =
        client.handshake.auth?.token ||
        (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null) ||
        (client.handshake.query?.token as string);

      if (!token) {
        this.logger.warn(`[WebSocket] Client rejected: Missing token (${client.id})`);
        client.disconnect();
        return;
      }

      const payload = await this.tokenService.verifyAccessToken(token);
      client.user = {
        userId: payload.sub,
        role: payload.role,
      };

      // Join user specific room
      client.join(`user:${payload.sub}`);

      // If driver, automatically enroll into driver's personal offer room
      if (payload.role === 'DRIVER' && this.prisma) {
        const profile = await this.prisma.driverProfile.findUnique({
          where: { userId: payload.sub },
          select: { id: true },
        });
        if (profile) {
          client.user.driverProfileId = profile.id;
          client.join(`driver:${profile.id}`);
        }
      }

      this.logger.log(`[WebSocket] Client connected: ${payload.sub} (${payload.role}, ${client.id})`);
    } catch (err: any) {
      this.logger.warn(`[WebSocket] Client authentication failed (${client.id}): ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`[WebSocket] Client disconnected: ${client.id} (${client.user?.userId || 'anonymous'})`);
  }

  /**
   * Allow authenticated client to join a ride room ONLY if they are an authorized participant.
   */
  @SubscribeMessage('join:ride')
  async handleJoinRide(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { rideId: string },
  ) {
    if (!client.user) {
      return { success: false, error: 'Unauthorized' };
    }
    if (!data?.rideId) {
      return { success: false, error: 'Missing rideId' };
    }

    if (this.prisma) {
      const ride = await this.prisma.ride.findUnique({
        where: { id: data.rideId },
        select: {
          id: true,
          riderId: true,
          driverProfileId: true,
        },
      });

      if (!ride) {
        return { success: false, error: 'Ride not found' };
      }

      let isAuthorized = false;

      if (client.user.role === 'ADMIN') {
        isAuthorized = true;
      } else if (client.user.role === 'RIDER' && ride.riderId === client.user.userId) {
        isAuthorized = true;
      } else if (client.user.role === 'DRIVER') {
        const driverProfileId =
          client.user.driverProfileId ||
          (
            await this.prisma.driverProfile.findUnique({
              where: { userId: client.user.userId },
              select: { id: true },
            })
          )?.id;

        if (driverProfileId) {
          client.user.driverProfileId = driverProfileId;

          // Check if assigned driver
          if (ride.driverProfileId === driverProfileId) {
            isAuthorized = true;
          } else {
            // Check if active pending or accepted request exists for this driver
            const pendingOffer = await this.prisma.driverRideRequest.findFirst({
              where: {
                rideId: data.rideId,
                driverProfileId,
                status: { in: ['PENDING', 'ACCEPTED'] },
              },
            });
            if (pendingOffer) {
              isAuthorized = true;
            }
          }
        }
      }

      if (!isAuthorized) {
        this.logger.warn(
          `[WebSocket] Unauthorized join:ride attempt by user ${client.user.userId} (${client.user.role}) for ride ${data.rideId}`,
        );
        return { success: false, error: 'Forbidden: You are not a participant in this ride' };
      }
    }

    client.join(`ride:${data.rideId}`);
    return { success: true, joined: `ride:${data.rideId}` };
  }

  /** Allow authenticated client to leave a ride room */
  @SubscribeMessage('leave:ride')
  async handleLeaveRide(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { rideId: string },
  ) {
    if (data?.rideId) {
      client.leave(`ride:${data.rideId}`);
    }
    return { success: true };
  }

  /**
   * Allow driver to join their driver profile room.
   * Prevents spoofing other drivers' rooms by enforcing server-side driver identity.
   */
  @SubscribeMessage('join:driver')
  async handleJoinDriver(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { driverProfileId?: string },
  ) {
    if (!client.user) {
      return { success: false, error: 'Unauthorized' };
    }
    if (client.user.role !== 'DRIVER') {
      return { success: false, error: 'Forbidden' };
    }

    let myDriverProfileId = client.user.driverProfileId;

    if (!myDriverProfileId && this.prisma) {
      const profile = await this.prisma.driverProfile.findUnique({
        where: { userId: client.user.userId },
        select: { id: true },
      });
      if (profile) {
        myDriverProfileId = profile.id;
        client.user.driverProfileId = profile.id;
      }
    }

    if (!myDriverProfileId) {
      return { success: false, error: 'Driver profile not found' };
    }

    // If client supplied a driverProfileId, verify it matches their own authenticated profile
    if (data?.driverProfileId && data.driverProfileId !== myDriverProfileId) {
      this.logger.warn(
        `[WebSocket] Driver spoofing attempt blocked: user ${client.user.userId} attempted to join driver:${data.driverProfileId}`,
      );
      return { success: false, error: 'Forbidden: You can only subscribe to your own driver room' };
    }

    client.join(`driver:${myDriverProfileId}`);
    return { success: true, joined: `driver:${myDriverProfileId}` };
  }
}
