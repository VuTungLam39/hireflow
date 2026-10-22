import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({ description: 'false = khoá tài khoản (BR-ACC-04)' })
  @IsBoolean()
  isActive: boolean;
}
