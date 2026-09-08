/**
 * @yatra-seva/service-contracts
 *
 * Service interface contracts for the mock/real provider pattern.
 * Each service has an interface defined here and implementations
 * (mock or real) in the API app. NestJS DI binds the correct
 * implementation based on environment configuration.
 */

// Service interfaces
export type { IAuthService, JwtPayload } from './auth.service';
export type { IOtpService } from './otp.service';
export type { IMapService, IRoutingService, RouteInfo } from './map.service';
export type { IPaymentService, InitiatePaymentParams, PaymentResult } from './payment.service';
export type { INotificationService, PushNotificationParams } from './notification.service';
export type { IFareService, FareCalculationParams } from './fare.service';
export type {
  IDriverMatchingService,
  DriverMatchParams,
  MatchedDriver,
  DriverResponse,
} from './driver-matching.service';
