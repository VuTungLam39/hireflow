import { HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { BusinessException, ErrorCode } from '../../../common/exceptions/index.js';
import type { AuthUser, JwtPayload } from '../../../common/interfaces/jwt-payload.interface.js';
import { jwtConfig } from '../../../config/jwt.config.js';
import { canSignIn } from '../../organizations/entities/organization.entity.js';
import { UsersService } from '../../users/users.service.js';

/** Xác thực access token trong header Authorization: Bearer <token> */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(jwtConfig.KEY) config: ConfigType<typeof jwtConfig>,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.accessSecret,
    });
  }

  // Giá trị trả về sẽ được gán vào req.user
  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.usersService.findById(payload.sub).catch(() => null);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is inactive or does not exist');
    }
    // BR-ORG-04
    if (user.organization && !canSignIn(user.organization.status)) {
      throw new BusinessException(
        ErrorCode.OrgDisabled,
        'Organization is disabled',
        HttpStatus.FORBIDDEN,
      );
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      organizationId: user.organizationId,
    };
  }
}
