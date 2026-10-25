import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

// BR-APP-09
export class CreateNoteDto {
  @ApiProperty({ minLength: 1, maxLength: 2000 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 2000)
  content: string;
}
