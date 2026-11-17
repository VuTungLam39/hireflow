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
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ResponseMessage } from '../../common/decorators/response-message.decorator.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { orgIdOf } from '../../common/utils/department-scope.js';
import { Authenticated, Permissions } from '../../common/decorators/permissions.decorator.js';
import { Permission } from '../../common/permissions/permission.enum.js';
import { DepartmentsService } from './departments.service.js';
import { CreateDepartmentDto } from './dto/create-department.dto.js';
import { QueryDepartmentDto } from './dto/query-department.dto.js';
import { UpdateDepartmentDto } from './dto/update-department.dto.js';

@ApiTags('Departments')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @Authenticated()
  @ApiOperation({ summary: 'Danh sách phòng ban (mọi người dùng đăng nhập)' })
  findAll(@Query() query: QueryDepartmentDto, @CurrentUser() user: AuthUser) {
    return this.departmentsService.findAll(query, orgIdOf(user));
  }

  @Post()
  @Permissions(Permission.DepartmentManage)
  @ApiOperation({ summary: 'Tạo phòng ban (Admin)' })
  @ResponseMessage('Department created')
  create(@Body() dto: CreateDepartmentDto, @CurrentUser() user: AuthUser) {
    return this.departmentsService.create(dto, orgIdOf(user));
  }

  @Patch(':id')
  @Permissions(Permission.DepartmentManage)
  @ApiOperation({ summary: 'Sửa phòng ban (Admin)' })
  @ResponseMessage('Department updated')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.departmentsService.update(id, dto, orgIdOf(user));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions(Permission.DepartmentManage)
  @ApiOperation({ summary: 'Xoá mềm phòng ban không còn user, job (Admin)' })
  @ResponseMessage('Department deleted')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.departmentsService.remove(id, orgIdOf(user));
  }
}
