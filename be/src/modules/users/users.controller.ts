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
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/enums/role.enum.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { QueryUserDto } from './dto/query-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('Users')
@ApiBearerAuth()
@Roles(Role.Admin)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo user (Admin)' })
  @ResponseMessage('User created')
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
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
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xoá mềm user (Admin)' })
  @ResponseMessage('User deleted')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
