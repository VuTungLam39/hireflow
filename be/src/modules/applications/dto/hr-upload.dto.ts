import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import { PHONE_REGEX } from '../../candidates/dto/update-candidate.dto.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// BR-APP-10, API Contract 4.5
export class HrUploadDto {
  @ApiProperty({ example: 'Nguyễn Văn An' })
  @Transform(trim)
  @IsString()
  @Length(2, 100)
  fullName: string;

  @ApiProperty({ example: 'an.nguyen@example.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiPropertyOptional({ example: '0912345678' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() || undefined : value))
  @Matches(PHONE_REGEX, { message: 'phone phải bắt đầu bằng +84 hoặc 0, gồm 10–11 số' })
  phone?: string;

  @ApiProperty({ enum: ['true'], description: 'HR xác nhận ứng viên đã đồng ý xử lý dữ liệu' })
  @IsIn(['true'], { message: 'Cần xác nhận ứng viên đã đồng ý xử lý dữ liệu' })
  consentConfirmed: 'true';
}
