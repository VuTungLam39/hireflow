import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';
import { OrganizationStatus } from '../entities/organization.entity.js';

export class QueryOrganizationsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: OrganizationStatus })
  @IsOptional()
  @IsEnum(OrganizationStatus)
  status?: OrganizationStatus;
}

// BR-ORG-04: từ chối, khoá bắt buộc lý do 5–500 ký tự
export class OrgReasonDto {
  @ApiProperty({ example: 'Mã số thuế không khớp tên công ty' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason: string;
}
