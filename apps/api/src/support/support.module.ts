import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { SupportService } from './services/support.service';
import { SupportController } from './controllers/support.controller';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
