import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { EmploymentType, JobLevel, SalaryVisibility, WorkMode } from '../entities/job.entity.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
export const SALARY_LIMIT = 2_000_000_000;

// API Contract 4.4
export class CreateJobDto {
  @ApiProperty({ example: 'Backend Developer (NestJS)' })
  @Transform(trim)
  @IsString()
  @Length(5, 200)
  title: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  departmentId: string;

  @ApiProperty({ example: 'Hà Nội' })
  @Transform(trim)
  @IsString()
  @Length(2, 100)
  location: string;

  @ApiProperty({ minLength: 50 })
  @Transform(trim)
  @IsString()
  @MinLength(50)
  jdText: string;

  // F-JOB-10 · BR-JOB-08
  @ApiPropertyOptional({ nullable: true, example: 25_000_000, description: 'VND/tháng' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(SALARY_LIMIT)
  salaryMin?: number | null;

  @ApiPropertyOptional({ nullable: true, example: 40_000_000, description: 'VND/tháng' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(SALARY_LIMIT)
  salaryMax?: number | null;

  @ApiPropertyOptional({ enum: SalaryVisibility })
  @IsOptional()
  @IsEnum(SalaryVisibility)
  salaryVisibility?: SalaryVisibility;

  @ApiPropertyOptional({ enum: JobLevel, nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsEnum(JobLevel)
  level?: JobLevel | null;

  @ApiPropertyOptional({ enum: EmploymentType })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ enum: WorkMode })
  @IsOptional()
  @IsEnum(WorkMode)
  workMode?: WorkMode;

  @ApiPropertyOptional({ minimum: 1, maximum: 999, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  headcount?: number;

  // BR-JOB-10
  @ApiPropertyOptional({ nullable: true, example: '2026-11-30', description: 'Ngày giờ Việt Nam' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Matches(DAY, { message: 'deadline phải có dạng YYYY-MM-DD' })
  deadline?: string | null;

  // F-JOB-11 · BR-JOB-09
  @ApiPropertyOptional({ maxLength: 5000 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  benefits?: string;
}
