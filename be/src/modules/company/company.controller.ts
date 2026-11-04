import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { Permission } from '../../common/permissions/permission.enum.js';
import { CompanyService } from './company.service.js';
import { UpdateCompanyDto, UpdateMediaDto, UploadMediaDto } from './dto/company.dto.js';
import { MEDIA_MAX_BYTES, type UploadedImage } from './media.rules.js';
import { MediaKind } from './entities/media-file.entity.js';

const MEDIA_UPLOAD_OPTIONS = {
  limits: { fileSize: MEDIA_MAX_BYTES[MediaKind.Gallery], files: 1 },
  defParamCharset: 'utf8',
};

// F-ORG-01 · API Contract 9.2 · BR-ORG-01: chỉ Admin và HR
@ApiTags('Company')
@ApiBearerAuth()
@Permissions(Permission.CompanyManage)
@Controller('company')
export class CompanyController {
  constructor(private readonly company: CompanyService) {}

  @Get()
  @ApiOperation({ summary: 'Hồ sơ công ty (nội bộ)' })
  get() {
    return this.company.get();
  }

  @Put()
  @ApiOperation({ summary: 'Cập nhật hồ sơ công ty; trường không gửi thì giữ nguyên' })
  update(@Body() dto: UpdateCompanyDto, @CurrentUser() user: AuthUser) {
    return this.company.update(dto, user);
  }

  @Post('media')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Tải logo, ảnh bìa hoặc ảnh thư viện (JPEG, PNG, WebP)' })
  @UseInterceptors(FileInterceptor('file', MEDIA_UPLOAD_OPTIONS))
  upload(
    @UploadedFile() file: UploadedImage | undefined,
    @Body() dto: UploadMediaDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.company.upload(file, dto, user);
  }

  @Patch('media/:id')
  @ApiOperation({ summary: 'Đổi mô tả ảnh (alt) hoặc vị trí trong thư viện' })
  updateMedia(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMediaDto) {
    return this.company.updateMedia(id, dto);
  }

  @Delete('media/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xoá ảnh; xoá logo hoặc ảnh bìa thì trang công ty ẩn nếu thiếu logo' })
  async removeMedia(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    await this.company.removeMedia(id, user);
    return null;
  }
}

// F-PUB-06, F-FILE-03 · BR-MEDIA-02
@ApiTags('Public')
@Public()
@Controller('public')
export class PublicCompanyController {
  constructor(private readonly company: CompanyService) {}

  @Get('company')
  @ApiOperation({ summary: 'Hồ sơ công ty công khai; 404 khi chưa đủ tên, logo, giới thiệu' })
  get() {
    return this.company.publicView();
  }

  @Get('media/:file')
  @Throttle({ default: { limit: 300, ttl: 60_000 } })
  @ApiOperation({ summary: 'Ảnh công khai theo khoá nội dung, cache 1 năm' })
  async media(@Param('file') file: string, @Res() res: Response) {
    const { body, mime } = await this.company.publicMedia(file);
    res
      .status(HttpStatus.OK)
      .set({
        'Content-Type': mime,
        'Content-Length': String(body.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline',
      })
      .end(body);
  }
}
