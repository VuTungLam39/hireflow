import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService, type ConfigType } from '@nestjs/config';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { ResponseMessage } from '../../common/decorators/response-message.decorator.js';
import { jwtConfig } from '../../config/jwt.config.js';
import { UsersService } from '../users/users.service.js';
import { AuthService, type AuthTokens } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import {
  clearRefreshCookie,
  REFRESH_COOKIE,
  type RefreshCookieConfig,
  setRefreshCookie,
} from './refresh-cookie.js';

/** Access token trả về trong body; refresh token chỉ nằm trong cookie httpOnly */
export type AccessTokenResponse = Omit<AuthTokens, 'refreshToken'>;

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly cookieConfig: RefreshCookieConfig;

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    config: ConfigService,
    @Inject(jwtConfig.KEY) jwt: ConfigType<typeof jwtConfig>,
  ) {
    this.cookieConfig = {
      apiPrefix: config.get<string>('app.apiPrefix', 'api'),
      isProduction: config.get<string>('app.env') === 'production',
      maxAgeSeconds: jwt.refreshExpiresIn,
    };
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản' })
  @ResponseMessage('Register successfully')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.authService.register(dto);
    return { user, tokens: this.withCookie(res, tokens) };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // chống brute-force
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập' })
  @ResponseMessage('Login successfully')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.authService.login(dto);
    return { user, tokens: this.withCookie(res, tokens) };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth(REFRESH_COOKIE)
  @ApiOperation({ summary: 'Lấy access token mới bằng refresh token trong cookie' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AccessTokenResponse> {
    const token: unknown = req.cookies?.[REFRESH_COOKIE];
    if (typeof token !== 'string' || !token) {
      throw new UnauthorizedException('Missing refresh token');
    }
    try {
      return this.withCookie(res, await this.authService.refresh(token));
    } catch (error) {
      // Token sai hoặc đã dùng: xoá cookie để client không gửi lại mãi
      clearRefreshCookie(res, this.cookieConfig);
      throw error;
    }
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất (thu hồi refresh token, xoá cookie)' })
  @ResponseMessage('Logout successfully')
  async logout(@CurrentUser('id') userId: string, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(userId);
    clearRefreshCookie(res, this.cookieConfig);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Thông tin user đang đăng nhập' })
  me(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  /** Đặt refresh token vào cookie và bỏ nó khỏi body */
  private withCookie(res: Response, { refreshToken, ...rest }: AuthTokens): AccessTokenResponse {
    setRefreshCookie(res, refreshToken, this.cookieConfig);
    return rest;
  }
}
