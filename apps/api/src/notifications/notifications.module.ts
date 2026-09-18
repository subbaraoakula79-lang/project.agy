import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NOTIFICATION_PROVIDER } from './interfaces/notification-provider.interface';
import { MockNotificationProvider } from './providers/mock-notification.provider';
import { ExpoPushNotificationProvider } from './providers/expo-push-notification.provider';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    MockNotificationProvider,
    ExpoPushNotificationProvider,
    {
      provide: NOTIFICATION_PROVIDER,
      useFactory: (
        configService: ConfigService,
        mockProvider: MockNotificationProvider,
        expoProvider: ExpoPushNotificationProvider,
      ) => {
        const providerType = (
          configService?.get<string>('NOTIFICATION_PROVIDER') ||
          process.env.NOTIFICATION_PROVIDER ||
          'mock'
        ).toLowerCase();

        if (providerType === 'expo' || providerType === 'production') {
          return expoProvider;
        }
        return mockProvider;
      },
      inject: [ConfigService, MockNotificationProvider, ExpoPushNotificationProvider],
    },
  ],
  exports: [NotificationsService, MockNotificationProvider, ExpoPushNotificationProvider, NOTIFICATION_PROVIDER],
})
export class NotificationsModule {}
