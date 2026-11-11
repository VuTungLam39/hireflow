import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, Matches } from 'class-validator';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

// F1 · BR-REP-01
export class QueryFunnelDto {
  @ApiPropertyOptional({
    example: '2026-08-01',
    description: 'Ngày nộp từ (YYYY-MM-DD giờ VN); mặc định 89 ngày trước `to`',
  })
  @IsOptional()
  @Matches(DAY, { message: 'from phải có dạng YYYY-MM-DD' })
  from?: string;

  @ApiPropertyOptional({
    example: '2026-10-29',
    description: 'Ngày nộp đến (YYYY-MM-DD giờ VN, tính cả ngày này); mặc định hôm nay',
  })
  @IsOptional()
  @Matches(DAY, { message: 'to phải có dạng YYYY-MM-DD' })
  to?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Chỉ tính hồ sơ của một tin' })
  @IsOptional()
  @IsUUID()
  jobId?: string;
}
