import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export const MAX_INTERVIEWERS = 5;

// F-INT-01, BR-INT-01
export class ScheduleInterviewDto {
  @ApiProperty({ description: 'ISO 8601, phải ở tương lai' })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({ minimum: 15, maximum: 240, default: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(240)
  durationMinutes: number = 60;

  @ApiProperty({ description: 'Phòng họp hoặc link họp online', maxLength: 500 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  location: string;

  @ApiProperty({ type: [String], minItems: 1, maxItems: MAX_INTERVIEWERS })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_INTERVIEWERS)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  interviewerIds: string[];
}

export class UpdateInterviewDto extends PartialType(ScheduleInterviewDto) {}

export class CancelInterviewDto {
  @ApiProperty({ maxLength: 1000 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}

export class QueryInterviewDto {
  @ApiPropertyOptional({ description: 'ISO 8601, mặc định đầu ngày hôm qua' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO 8601, mặc định 30 ngày sau' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: 'Chỉ buổi mình được phân công' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  mine?: boolean;

  @ApiPropertyOptional({ description: 'Gồm cả buổi đã huỷ' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeCancelled?: boolean;
}

export class RatingDto {
  @ApiProperty()
  @IsUUID()
  requirementId: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  score: number;
}

// F-INT-03, BR-INT-03
export class FeedbackDto {
  @ApiProperty({ minimum: 1, maximum: 5, description: 'Đánh giá chung' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  overall: number;

  @ApiProperty({ type: [RatingDto], description: 'Mỗi tiêu chí của tin một điểm 1–5' })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => RatingDto)
  ratings: RatingDto[];

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
