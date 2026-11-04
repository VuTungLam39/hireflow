import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CompanySize } from '../entities/company-profile.entity.js';
import { MediaKind } from '../entities/media-file.entity.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const emptyToNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? null : trim({ value });

// BR-ORG-02: chỉ https://, chặn javascript:, data:, http:
const HTTPS = { protocols: ['https'], require_protocol: true };
const HTTPS_MESSAGE = 'Chỉ nhận đường dẫn bắt đầu bằng https://';

export class BenefitDto {
  @ApiProperty({ example: 'Bảo hiểm sức khoẻ' })
  @Transform(trim)
  @IsString()
  @Length(2, 80)
  title: string;

  @ApiProperty({ example: 'Cho bản thân và gia đình' })
  @Transform(trim)
  @IsString()
  @MaxLength(300)
  description: string;
}

export class OfficeDto {
  @ApiProperty({ example: 'Văn phòng Hà Nội' })
  @Transform(trim)
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ example: 'Tầng 12, 54 Liễu Giai, Ba Đình, Hà Nội' })
  @Transform(trim)
  @IsString()
  @Length(5, 300)
  address: string;

  @ApiPropertyOptional({ nullable: true })
  @Transform(emptyToNull)
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUrl(HTTPS, { message: HTTPS_MESSAGE })
  @MaxLength(300)
  mapUrl: string | null;
}

export class MilestoneDto {
  @ApiProperty({ example: 2018 })
  @Type(() => Number)
  @IsInt()
  @Min(1800)
  @Max(2100)
  year: number;

  @ApiProperty({ example: 'Thành lập văn phòng Đà Nẵng' })
  @Transform(trim)
  @IsString()
  @Length(2, 150)
  title: string;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  description: string;
}

export class SocialsDto {
  @ApiPropertyOptional()
  @Transform(emptyToNull)
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUrl(HTTPS, { message: HTTPS_MESSAGE })
  @MaxLength(300)
  linkedin?: string | null;

  @ApiPropertyOptional()
  @Transform(emptyToNull)
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUrl(HTTPS, { message: HTTPS_MESSAGE })
  @MaxLength(300)
  facebook?: string | null;

  @ApiPropertyOptional()
  @Transform(emptyToNull)
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUrl(HTTPS, { message: HTTPS_MESSAGE })
  @MaxLength(300)
  youtube?: string | null;

  @ApiPropertyOptional()
  @Transform(emptyToNull)
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUrl(HTTPS, { message: HTTPS_MESSAGE })
  @MaxLength(300)
  tiktok?: string | null;
}

// F-ORG-01 · API Contract 9.2: cập nhật từng khối, trường không gửi thì giữ nguyên
export class UpdateCompanyDto {
  @ApiPropertyOptional({ example: 'Công ty Cổ phần HireFlow' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  tagline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  about?: string;

  @ApiPropertyOptional({ enum: CompanySize, nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsEnum(CompanySize)
  sizeRange?: CompanySize | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @Length(2, 50, { each: true })
  industries?: string[];

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1800)
  @Max(2100)
  foundedYear?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(emptyToNull)
  @ValidateIf((_, v) => v !== null)
  @IsUrl(HTTPS, { message: HTTPS_MESSAGE })
  @MaxLength(300)
  website?: string | null;

  @ApiPropertyOptional({ type: SocialsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialsDto)
  socials?: SocialsDto;

  @ApiPropertyOptional({ type: [BenefitDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => BenefitDto)
  benefits?: BenefitDto[];

  @ApiPropertyOptional({ type: [OfficeDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => OfficeDto)
  offices?: OfficeDto[];

  @ApiPropertyOptional({ type: [MilestoneDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => MilestoneDto)
  milestones?: MilestoneDto[];
}

export class UploadMediaDto {
  @ApiProperty({ enum: MediaKind })
  @IsIn(Object.values(MediaKind))
  kind: MediaKind;

  @ApiPropertyOptional({ maxLength: 200, description: 'Bắt buộc với ảnh thư viện' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  alt?: string;
}

export class UpdateMediaDto {
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(2, 200)
  alt?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 99 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(99)
  position?: number;
}
