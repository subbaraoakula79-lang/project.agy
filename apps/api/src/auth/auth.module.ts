import { Module } from '@nestjs/common';
import { MockServicesModule } from '../providers/mock/mock-services.module';
import { AuthController } from './controllers/auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { UserService } from './services/user.service';

@Module({
  imports: [MockServicesModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserService,
    TokenService,
    PasswordService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [AuthService, UserService, TokenService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
