import { Type } from 'class-transformer';
import { IsHexadecimal, IsInt, Length } from 'class-validator';

export class FileLinkQueryDto {
  @Type(() => Number)
  @IsInt()
  expires: number;

  @IsHexadecimal()
  @Length(64, 64)
  signature: string;
}
