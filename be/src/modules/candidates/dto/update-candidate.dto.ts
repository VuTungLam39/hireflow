import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, Matches, ValidateIf } from 'class-validator';

export const PHONE_REGEX = /^(\+84|0)\d{9,10}$/;

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// BR-CAND-01, BR-APP-01
export class UpdateCandidateDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn An' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(2, 100)
  fullName?: string;

  @ApiPropertyOptional({ example: '0912345678', nullable: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() || null : value))
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @Matches(PHONE_REGEX, { message: 'phone phải bắt đầu bằng +84 hoặc 0, gồm 10–11 số' })
  phone?: string | null;
}
