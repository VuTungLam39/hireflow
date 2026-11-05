import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

// F-SEARCH-01 · US-13
export class CvSearchDto {
  @ApiProperty({ example: 'Kafka', description: 'Kỹ năng hoặc mô tả, gõ không dấu cũng được' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 200)
  q: string;
}
