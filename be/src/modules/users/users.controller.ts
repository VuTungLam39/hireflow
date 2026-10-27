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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../../common/decorators/response-message.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { Permission } from '../../common/permissions/permission.enum.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { QueryUserDto } from './dto/query-user.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('Users')
@ApiBearerAuth()
@Permissions(Permission.UserManage)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo user (Admin)' })
  @ResponseMessage('User created')
  create(@Body() dto: CreateUserDto, @CurrentUser('id') actorId: string) {
    return this.usersService.create(dto, actorId);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách user có phân trang (Admin)' })
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết user (Admin)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật user (Admin)' })
  @ResponseMessage('User updated')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.usersService.update(id, dto, actorId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Khoá / mở tài khoản; khoá thì thu hồi mọi phiên (Admin)' })
  @ResponseMessage('User status updated')
  setStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.usersService.setStatus(id, dto.isActive, actorId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xoá mềm user (Admin)' })
  @ResponseMessage('User deleted')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') actorId: string) {
    return this.usersService.remove(id, actorId);
  }
}
