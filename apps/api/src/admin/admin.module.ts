import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { RidesModule } from '../rides/rides.module';

// Controllers
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminDriversController } from './controllers/admin-drivers.controller';
import { AdminRidesController } from './controllers/admin-rides.controller';
import { AdminVehiclesController } from './controllers/admin-vehicles.controller';
import { AdminCitiesController } from './controllers/admin-cities.controller';
import { AdminPricingController } from './controllers/admin-pricing.controller';
import { AdminAuditController } from './controllers/admin-audit.controller';

// Services
import { AdminAuditService } from './services/admin-audit.service';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminDriverService } from './services/admin-driver.service';
import { AdminRideService } from './services/admin-ride.service';
import { AdminVehicleService } from './services/admin-vehicle.service';
import { AdminCityService } from './services/admin-city.service';
import { AdminPricingService } from './services/admin-pricing.service';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    NotificationsModule,
    RealtimeModule,
    RidesModule,
  ],
  controllers: [
    AdminDashboardController,
    AdminDriversController,
    AdminRidesController,
    AdminVehiclesController,
    AdminCitiesController,
    AdminPricingController,
    AdminAuditController,
  ],
  providers: [
    AdminAuditService,
    AdminDashboardService,
    AdminDriverService,
    AdminRideService,
    AdminVehicleService,
    AdminCityService,
    AdminPricingService,
  ],
  exports: [
    AdminAuditService,
    AdminDashboardService,
    AdminDriverService,
    AdminRideService,
    AdminVehicleService,
    AdminCityService,
    AdminPricingService,
  ],
})
export class AdminModule {}
