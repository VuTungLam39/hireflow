import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from '../email/email.module.js';
import { User } from '../users/entities/user.entity.js';
import { AuthToken } from './entities/auth-token.entity.js';
import { PasswordResetService } from './password-reset.service.js';
import { PassportModule } from '@nestjs/passport';
import { RefreshTokensModule } from '../refresh-tokens/refresh-tokens.module.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [
    UsersModule,
    RefreshTokensModule,
    PassportModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([User, AuthToken]),
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PasswordResetService],
})
export class AuthModule {}
