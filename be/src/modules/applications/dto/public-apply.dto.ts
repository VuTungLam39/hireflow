import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import { PHONE_REGEX } from '../../candidates/dto/update-candidate.dto.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// BR-APP-01, BR-APP-04, BR-APP-06, API Contract 4.7
export class PublicApplyDto {
  @ApiProperty({ example: 'Nguyễn Văn An' })
  @Transform(trim)
  @IsString()
  @Length(2, 100)
  fullName: string;

  @ApiProperty({ example: 'an.nguyen@gmail.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: '0912345678' })
  @Transform(trim)
  @Matches(PHONE_REGEX, { message: 'phone phải bắt đầu bằng +84 hoặc 0, gồm 10–11 số' })
  phone: string;

  @ApiProperty({ enum: ['true'], description: 'Ứng viên đồng ý xử lý dữ liệu cá nhân' })
  @IsIn(['true'], { message: 'Bạn cần đồng ý xử lý dữ liệu cá nhân' })
  consent: 'true';

  @ApiPropertyOptional({ description: 'Honeypot: người thật để trống' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;
}
