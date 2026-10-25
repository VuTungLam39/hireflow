import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { RequirementType } from '../entities/job-requirement.entity.js';

// BR-JOB-05
export class RequirementInputDto {
  @ApiProperty({ example: 'NestJS' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 100)
  label: string;

  @ApiProperty({ enum: RequirementType })
  @IsEnum(RequirementType)
  type: RequirementType;

  @ApiProperty({ minimum: 1, maximum: 3 })
  @IsInt()
  @Min(1)
  @Max(3)
  weight: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 30, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(30)
  minYears: number | null = null;

  @ApiProperty({ type: [String], example: ['nestjs', 'nest.js'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @Length(1, 50, { each: true })
  keywords: string[];
}

export class SaveRequirementsDto {
  @ApiProperty({ type: [RequirementInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => RequirementInputDto)
  requirements: RequirementInputDto[];
}
