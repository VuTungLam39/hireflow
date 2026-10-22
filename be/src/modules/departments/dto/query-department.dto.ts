import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';
import { SortOrder } from '../../../common/enums/sort-order.enum.js';

export class QueryDepartmentDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.ASC, description: 'Theo tên' })
  @IsOptional()
  @IsEnum(SortOrder)
  override order: SortOrder = SortOrder.ASC;
}
