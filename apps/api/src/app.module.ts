import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { DatabaseModule } from './database/database.module';
import { DriversModule } from './drivers/drivers.module';
import { HealthModule } from './health/health.module';
import { MockServicesModule } from './providers/mock/mock-services.module';
import { RealtimeModule } from './realtime/realtime.module';
import { RidesModule } from './rides/rides.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    // Global configuration from .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),

    // Database module
    DatabaseModule,

    // Realtime & Core modules
    RealtimeModule,
    HealthModule,
    AuthModule,
    DriversModule,
    RidesModule,
    PaymentsModule,

    // Mock service providers (for development)
    MockServicesModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
  ],
})
export class AppModule {}
