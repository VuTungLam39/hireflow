import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

// BR-AI-10
export class ChatDto {
  @ApiProperty({ example: 'Ai từng làm fintech và biết Kafka?' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 500)
  question: string;
}
