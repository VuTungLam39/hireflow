import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Kỹ thuật' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ example: 'ENG', description: '2–20 ký tự A–Z, 0–9, _ (tự chuyển chữ in hoa)' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @Matches(/^[A-Z0-9_]{2,20}$/, { message: 'code 2–20 ký tự, chỉ gồm A–Z, 0–9 và _' })
  code: string;
}
