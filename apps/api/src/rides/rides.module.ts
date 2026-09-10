import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { DriversModule } from '../drivers/drivers.module';
import { FareService } from '../fare/fare.service';
import { MockMapService, MockRoutingService } from '../providers/mock/mock-map.service';
import { RealtimeModule } from '../realtime/realtime.module';
import { RidesController } from './controllers/rides.controller';
import { RideStateMachineService } from './services/ride-state-machine.service';
import { RidesService } from './services/rides.service';

@Module({
  imports: [AuthModule, DatabaseModule, forwardRef(() => DriversModule), RealtimeModule],
  controllers: [RidesController],
  providers: [RidesService, RideStateMachineService, FareService, MockMapService, MockRoutingService],
  exports: [RidesService, RideStateMachineService, FareService],
})
export class RidesModule {}
