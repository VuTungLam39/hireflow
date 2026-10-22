import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Patch,
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
import type { SessionMeta } from '../refresh-tokens/refresh-tokens.service.js';
import { AuthService, type AuthTokens } from './auth.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import {
  clearRefreshCookie,
  REFRESH_COOKIE,
  type RefreshCookieConfig,
  setRefreshCookie,
} from './refresh-cookie.js';

export type AccessTokenResponse = Omit<AuthTokens, 'refreshToken'>;

const refreshTokenOf = (req: Request): string | undefined => {
  const token: unknown = req.cookies?.[REFRESH_COOKIE];
  return typeof token === 'string' && token ? token : undefined;
};

const metaOf = (req: Request): SessionMeta => ({
  userAgent: req.header('user-agent') ?? null,
  ip: req.ip ?? null,
});

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly cookieConfig: RefreshCookieConfig;

  constructor(
    private readonly authService: AuthService,
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
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập; mở một chuỗi refresh token mới' })
  @ResponseMessage('Login successfully')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.authService.login(dto, metaOf(req));
    return { user, tokens: this.withCookie(res, tokens) };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth(REFRESH_COOKIE)
  @ApiOperation({ summary: 'Xoay vòng refresh token; dùng lại token cũ thì thu hồi cả chuỗi' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AccessTokenResponse> {
    const token = refreshTokenOf(req);
    if (!token) throw new UnauthorizedException('Missing refresh token');
    try {
      return this.withCookie(res, await this.authService.refresh(token, metaOf(req)));
    } catch (error) {
      clearRefreshCookie(res, this.cookieConfig);
      throw error;
    }
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất: thu hồi chuỗi token hiện tại, xoá cookie' })
  @ResponseMessage('Logout successfully')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(refreshTokenOf(req));
    clearRefreshCookie(res, this.cookieConfig);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'User đang đăng nhập, kèm phòng ban và danh sách quyền' })
  me(@CurrentUser('id') userId: string) {
    return this.authService.me(userId);
  }

  @ApiBearerAuth()
  @Patch('password')
  @ApiOperation({ summary: 'Đổi mật khẩu; thu hồi mọi phiên khác (BR-ACC-06)' })
  @ResponseMessage('Password changed')
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    return this.authService.changePassword(userId, dto, refreshTokenOf(req));
  }

  private withCookie(res: Response, { refreshToken, ...rest }: AuthTokens): AccessTokenResponse {
    setRefreshCookie(res, refreshToken, this.cookieConfig);
    return rest;
  }
}
