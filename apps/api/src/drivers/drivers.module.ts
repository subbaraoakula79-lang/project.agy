import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { MockServicesModule } from '../providers/mock/mock-services.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { RideStateMachineService } from '../rides/services/ride-state-machine.service';
import { DriverAliasController, DriversController } from './controllers/drivers.controller';
import { DriverMatchingService } from './services/driver-matching.service';
import { DriversService } from './services/drivers.service';

@Module({
  imports: [AuthModule, DatabaseModule, RealtimeModule, MockServicesModule],
  controllers: [DriversController, DriverAliasController],
  providers: [DriversService, DriverMatchingService, RideStateMachineService],
  exports: [DriversService, DriverMatchingService],
})
export class DriversModule {}
