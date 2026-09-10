import { Module } from '@nestjs/common';
import { RidesGateway } from './rides.gateway';
import { RealtimeService } from './realtime.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [RidesGateway, RealtimeService],
  exports: [RidesGateway, RealtimeService],
})
export class RealtimeModule {}
