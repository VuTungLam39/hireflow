import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  Equals,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PASSWORD_MESSAGE, PASSWORD_REGEX } from '../../users/dto/create-user.dto.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const NO_CONTROL_CHARS = /^[^\p{Cc}]*$/u;

// MVP 3 · US-19, BR-ORG-05, BR-ACC-09
export class RegisterEmployerDto {
  @ApiProperty({ example: 'Công ty Cổ phần Ví Mây' })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  @Matches(NO_CONTROL_CHARS, { message: 'companyName không được chứa ký tự điều khiển' })
  companyName: string;

  @ApiProperty({ example: '0312345678', description: '10 hoặc 13 chữ số' })
  @Transform(trim)
  @Matches(/^\d{10}(\d{3})?$/, { message: 'Mã số thuế gồm 10 hoặc 13 chữ số' })
  taxCode: string;

  @ApiPropertyOptional({ example: 'https://vimay.vn' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() ? value.trim() : undefined))
  @IsOptional()
  @IsUrl(
    { protocols: ['https'], require_protocol: true },
    { message: 'Website phải bắt đầu bằng https://' },
  )
  @MaxLength(255)
  website?: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(NO_CONTROL_CHARS, { message: 'fullName không được chứa ký tự điều khiển' })
  fullName: string;

  @ApiProperty({ example: 'tuyendung@vimay.vn' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  @MaxLength(72)
  password: string;

  @ApiProperty({ example: true })
  @Equals(true, { message: 'Cần đồng ý điều khoản sử dụng sàn' })
  acceptTerms: boolean;
}

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  @MinLength(16)
  @MaxLength(200)
  token: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: 'tuyendung@vimay.vn' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(255)
  email: string;
}
