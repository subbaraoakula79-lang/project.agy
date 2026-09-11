import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MockOtpService } from './mock-otp.service';
import { MockPaymentService } from './mock-payment.service';
import { MockMapService, MockRoutingService } from './mock-map.service';
import { MockNotificationService } from './mock-notification.service';

/**
 * Mock Services Module
 *
 * Provides mock implementations of all third-party service contracts.
 * In the future, factory providers will switch between mock and real
 * based on environment configuration (OTP_PROVIDER, MAP_PROVIDER, etc.).
 *
 * For now, all providers are mock.
 * The injection tokens match the interface names from service-contracts:
 * - 'IOtpService'
 * - 'IPaymentService'
 * - 'IMapService'
 * - 'IRoutingService'
 * - 'INotificationService'
 */
@Global()
@Module({
  providers: [
    MockOtpService,
    MockPaymentService,
    MockMapService,
    MockRoutingService,
    MockNotificationService,
    {
      provide: 'IOtpService',
      useFactory: (config: ConfigService) => {
        const provider = config.get<string>('OTP_PROVIDER', 'mock');
        if (provider === 'mock') {
          return new MockOtpService(config);
        }
        // Future: return new TwilioOtpService(config);
        return new MockOtpService(config);
      },
      inject: [ConfigService],
    },
    {
      provide: 'IPaymentService',
      useFactory: (config: ConfigService) => {
        const provider = config.get<string>('PAYMENT_PROVIDER', 'mock');
        if (provider === 'mock') {
          return new MockPaymentService();
        }
        // Future: return new RazorpayPaymentService(config);
        return new MockPaymentService();
      },
      inject: [ConfigService],
    },
    {
      provide: 'IMapService',
      useFactory: (config: ConfigService) => {
        const provider = config.get<string>('MAP_PROVIDER', 'mock');
        if (provider === 'mock') {
          return new MockMapService();
        }
        // Future: return new GoogleMapService(config);
        return new MockMapService();
      },
      inject: [ConfigService],
    },
    {
      provide: 'IRoutingService',
      useFactory: (config: ConfigService) => {
        const provider = config.get<string>('MAP_PROVIDER', 'mock');
        if (provider === 'mock') {
          return new MockRoutingService();
        }
        // Future: return new GoogleRoutingService(config);
        return new MockRoutingService();
      },
      inject: [ConfigService],
    },
    {
      provide: 'INotificationService',
      useFactory: (config: ConfigService) => {
        const provider = config.get<string>('NOTIFICATION_PROVIDER', 'mock');
        if (provider === 'mock') {
          return new MockNotificationService();
        }
        // Future: return new FcmNotificationService(config);
        return new MockNotificationService();
      },
      inject: [ConfigService],
    },
  ],
  exports: [
    MockOtpService,
    MockPaymentService,
    MockMapService,
    MockRoutingService,
    MockNotificationService,
    'IOtpService',
    'IPaymentService',
    'IMapService',
    'IRoutingService',
    'INotificationService',
  ],
})
export class MockServicesModule {}
