import { Controller, Get, Param, ParseUUIDPipe, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { Permission } from '../../common/permissions/permission.enum.js';
import { FileLinkQueryDto } from './dto/file-link-query.dto.js';
import { FilesService } from './files.service.js';

// API Contract 4.6
@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get(':fileId/url')
  @ApiBearerAuth()
  @Permissions(Permission.CvRead)
  @ApiOperation({ summary: 'Đường dẫn xem/tải CV, hết hạn sau 5 phút (kiểm quyền và phạm vi)' })
  url(@Param('fileId', ParseUUIDPipe) fileId: string, @CurrentUser() user: AuthUser) {
    return this.filesService.createLink(fileId, user);
  }

  // STORAGE_DRIVER=local
  @Get(':fileId/content')
  @Public()
  @ApiOperation({ summary: 'Nội dung CV qua đường dẫn có chữ ký (driver local)' })
  async content(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Query() query: FileLinkQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.filesService.readSigned(fileId, query.expires, query.signature);
    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': file.disposition,
      'Cache-Control': 'private, no-store',
    });
    return new StreamableFile(file.body);
  }
}
