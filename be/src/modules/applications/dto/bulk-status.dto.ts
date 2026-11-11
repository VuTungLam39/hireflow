import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApplicationStatus } from '../../../common/enums/application-status.enum.js';

export const BULK_STATUS_MAX = 100;

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// F2 · BR-APP-12
export class BulkStatusDto {
  @ApiProperty({ type: [String], format: 'uuid', maxItems: BULK_STATUS_MAX })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(BULK_STATUS_MAX)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  ids: string[];

  @ApiProperty({ enum: ApplicationStatus, description: 'Chỉ SCREENING, INTERVIEW, REJECTED' })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @ApiPropertyOptional({ description: 'Bắt buộc khi status = REJECTED, dùng chung cho cả lô' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
