import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsUUID, Length, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// API Contract 4.4
export class CreateJobDto {
  @ApiProperty({ example: 'Backend Developer (NestJS)' })
  @Transform(trim)
  @IsString()
  @Length(5, 200)
  title: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  departmentId: string;

  @ApiProperty({ example: 'Hà Nội' })
  @Transform(trim)
  @IsString()
  @Length(2, 100)
  location: string;

  @ApiProperty({ minLength: 50 })
  @Transform(trim)
  @IsString()
  @MinLength(50)
  jdText: string;
}
