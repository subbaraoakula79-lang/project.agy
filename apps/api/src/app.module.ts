import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { MockServicesModule } from './providers/mock/mock-services.module';
import { RidesModule } from './rides/rides.module';

@Module({
  imports: [
    // Global configuration from .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),

    // Core modules
    HealthModule,
    AuthModule,
    RidesModule,

    // Mock service providers (for development)
    MockServicesModule,
  ],
})
export class AppModule {}
