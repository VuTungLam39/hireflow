import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches, MaxLength } from 'class-validator';
import { PASSWORD_MESSAGE, PASSWORD_REGEX } from '../../users/dto/create-user.dto.js';

// SG-06 · R6
export class ForgotPasswordDto {
  @ApiProperty({ example: 'hr@example.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(255)
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token trong link email (fragment #t=)' })
  @IsString()
  @Length(20, 200)
  token: string;

  @ApiProperty({
    example: 'NewPassword123',
    description: 'BR-ACC-06: 8–72 ký tự, có chữ hoa, chữ thường và số',
  })
  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  @MaxLength(72)
  password: string;
}
