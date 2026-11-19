import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { SalaryPeriod } from '../entities/offer.entity.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export const OFFER_CURRENCIES = ['VND', 'USD'] as const;

// MVP 3.1 · F-OFFER-01
export class CreateOfferDto {
  @ApiProperty({ example: 25_000_000 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000_000_000)
  salaryAmount: number;

  @ApiPropertyOptional({ enum: OFFER_CURRENCIES, default: 'VND' })
  @IsOptional()
  @IsIn(OFFER_CURRENCIES)
  salaryCurrency?: (typeof OFFER_CURRENCIES)[number];

  @ApiPropertyOptional({ enum: SalaryPeriod, default: SalaryPeriod.Month })
  @IsOptional()
  @IsEnum(SalaryPeriod)
  salaryPeriod?: SalaryPeriod;

  @ApiProperty({ example: '2026-12-15' })
  @IsISO8601({ strict: true })
  startDate: string;

  @ApiProperty({
    example: '2026-11-30',
    description: 'Hạn ứng viên trả lời, không sau ngày bắt đầu',
  })
  @IsISO8601({ strict: true })
  respondBy: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export class UpdateOfferDto extends PartialType(CreateOfferDto) {}

export class OfferReasonDto {
  @ApiProperty({ maxLength: 500 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}

export class DeclineOfferDto {
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  reason?: string;
}
