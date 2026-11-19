import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export const MAX_STAGES = 10;
export const MAX_STAGE_CRITERIA = 12;

// BR-INT-05
export class StageCriterionDto {
  @ApiPropertyOptional({ description: 'Giữ id khi sửa tiêu chí đã có; bỏ trống khi thêm mới' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 'Thiết kế API' })
  @Transform(trim)
  @IsString()
  @Length(2, 100)
  label: string;
}

export class InterviewStageDto {
  @ApiPropertyOptional({ description: 'Giữ id khi sửa vòng đã có; bỏ trống khi thêm mới' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 'Vòng kỹ thuật' })
  @Transform(trim)
  @IsString()
  @Length(2, 80)
  name: string;

  @ApiProperty({ type: [StageCriterionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_STAGE_CRITERIA)
  @ValidateNested({ each: true })
  @Type(() => StageCriterionDto)
  criteria: StageCriterionDto[];
}

/** Thay toàn bộ danh sách vòng; thứ tự trong mảng là thứ tự vòng */
export class SaveInterviewStagesDto {
  @ApiProperty({ type: [InterviewStageDto] })
  @IsArray()
  @ArrayMaxSize(MAX_STAGES)
  @ValidateNested({ each: true })
  @Type(() => InterviewStageDto)
  stages: InterviewStageDto[];
}
