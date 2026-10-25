import { plainToInstance, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
  validateSync,
  type ValidationError,
} from 'class-validator';
import { LlmError } from '../ai.types.js';

class SkillDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  years: number | null = null;

  @IsString()
  @MaxLength(500)
  evidence: string;
}

const PERIOD = /^\d{4}(-\d{2})?$/;

class ExperienceDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(200)
  company: string;

  @IsOptional()
  @Matches(PERIOD)
  from: string | null = null;

  @IsOptional()
  @Matches(PERIOD)
  to: string | null = null;

  @IsString()
  @MaxLength(500)
  evidence: string;
}

class EducationDto {
  @IsString()
  @MaxLength(200)
  school: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  degree: string | null = null;

  @IsOptional()
  @IsInt()
  @Min(1950)
  @Max(2100)
  year: number | null = null;

  @IsString()
  @MaxLength(500)
  evidence: string;
}

// Kickoff 8.3, Database Design 4.13
export class CvProfileDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  skills: SkillDto[];

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  experiences: ExperienceDto[];

  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  education: EducationDto[];

  @IsString()
  @MaxLength(2000)
  summary: string;
}

const describe = (errors: ValidationError[], path = ''): string[] =>
  errors.flatMap((e) => {
    const at = path ? `${path}.${e.property}` : e.property;
    return [
      ...Object.values(e.constraints ?? {}).map((c) => `${at}: ${c}`),
      ...describe(e.children ?? [], at),
    ];
  });

// Backend Architecture 14.2
export function parseLlmOutput<T extends object>(
  cls: new () => T,
  data: unknown,
  provider: string,
): T {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new LlmError('LLM output is not an object', provider, 'INVALID_JSON', false);
  }
  const instance = plainToInstance(cls, data);
  const errors = validateSync(instance, { whitelist: true, forbidUnknownValues: true });
  if (errors.length) {
    throw new LlmError(
      `LLM output does not match schema: ${describe(errors).slice(0, 5).join('; ')}`,
      provider,
      'INVALID_JSON',
      false,
    );
  }
  return instance;
}
