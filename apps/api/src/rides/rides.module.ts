import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FareService } from '../fare/fare.service';
import { MockMapService, MockRoutingService } from '../providers/mock/mock-map.service';
import { RidesController } from './controllers/rides.controller';
import { RidesService } from './services/rides.service';

@Module({
  imports: [AuthModule],
  controllers: [RidesController],
  providers: [RidesService, FareService, MockMapService, MockRoutingService],
  exports: [RidesService, FareService],
})
export class RidesModule {}
