import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApplicationStatus } from '../../../common/enums/application-status.enum.js';
import { RejectReasonCode } from '../../../common/enums/reject-reason-code.enum.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class ChangeStatusDto {
  @ApiProperty({ enum: ApplicationStatus, description: 'Không nhận HIRED (dùng /hire)' })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @ApiPropertyOptional({ description: 'Bắt buộc khi status = REJECTED và reasonCode = OTHER' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @ApiPropertyOptional({ enum: RejectReasonCode, description: 'Bắt buộc khi status = REJECTED' })
  @IsOptional()
  @IsEnum(RejectReasonCode)
  reasonCode?: RejectReasonCode;
}

export class DeclineOfferDto {
  @ApiProperty({ enum: RejectReasonCode, description: 'Bắt buộc (BR-STS-03)' })
  @IsOptional()
  @IsEnum(RejectReasonCode)
  reasonCode?: RejectReasonCode;

  @ApiPropertyOptional({ description: 'Bắt buộc khi reasonCode = OTHER' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
