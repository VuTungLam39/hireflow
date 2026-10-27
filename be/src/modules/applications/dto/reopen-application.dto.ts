import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// F-APP-10, BR-APP-05
export class ReopenApplicationDto {
  @ApiProperty({ description: 'Lý do mở lại, ghi vào lịch sử trạng thái', maxLength: 1000 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}
