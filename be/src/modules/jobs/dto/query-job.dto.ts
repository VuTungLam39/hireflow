import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';
import { JobStatus } from '../entities/job.entity.js';

export const JOB_SORT_FIELDS = ['createdAt', 'title', 'publishedAt'] as const;

export class QueryJobDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: JOB_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsIn(JOB_SORT_FIELDS)
  sortBy: (typeof JOB_SORT_FIELDS)[number] = 'createdAt';

  @ApiPropertyOptional({ enum: JobStatus })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
