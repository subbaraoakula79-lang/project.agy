import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { RideStateMachineService } from '../rides/services/ride-state-machine.service';
import { PaymentStateMachineService } from './payment-state-machine.service';
import {
  DriverPaymentAliasController,
  DriversPaymentAliasController,
  PaymentsController,
} from './payments.controller';
import { PaymentsService } from './payments.service';
import { MockPaymentProvider } from './providers/mock-payment.provider';

@Module({
  imports: [DatabaseModule, RealtimeModule, AuthModule],
  controllers: [
    PaymentsController,
    DriverPaymentAliasController,
    DriversPaymentAliasController,
  ],
  providers: [
    PaymentsService,
    PaymentStateMachineService,
    MockPaymentProvider,
    RideStateMachineService,
  ],
  exports: [PaymentsService, PaymentStateMachineService, MockPaymentProvider],
})
export class PaymentsModule {}
