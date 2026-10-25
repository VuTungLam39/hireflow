import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsUUID, Matches, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';
import { ApplicationStatus } from '../../../common/enums/application-status.enum.js';

export const APPLICATION_SORT_FIELDS = ['createdAt', 'score'] as const;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

// US-06, API Contract 4.5
export class QueryApplicationDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: APPLICATION_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsIn(APPLICATION_SORT_FIELDS)
  sortBy: (typeof APPLICATION_SORT_FIELDS)[number] = 'createdAt';

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  jobId?: string;

  @ApiPropertyOptional({ enum: ApplicationStatus })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  scoreMin?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  scoreMax?: number;

  @ApiPropertyOptional({ enum: ['true'], description: 'Chỉ hồ sơ có cờ MISSING_MUST' })
  @IsOptional()
  @IsIn(['true'])
  missingMust?: 'true';

  @ApiPropertyOptional({
    example: '2026-10-01',
    description: 'YYYY-MM-DD giờ Việt Nam, tính cả ngày này',
  })
  @IsOptional()
  @Matches(DAY, { message: 'createdFrom phải có dạng YYYY-MM-DD' })
  createdFrom?: string;

  @ApiPropertyOptional({
    example: '2026-10-31',
    description: 'YYYY-MM-DD giờ Việt Nam, tính cả ngày này',
  })
  @IsOptional()
  @Matches(DAY, { message: 'createdTo phải có dạng YYYY-MM-DD' })
  createdTo?: string;
}
