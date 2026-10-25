import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  Matches,
  MinLength,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

// Đọc giá trị gốc (obj[key]) vì enableImplicitConversion đã biến chuỗi "false"
// thành true trước khi @Transform chạy.
const toBoolean = ({ obj, key }: { obj: Record<string, unknown>; key: string }) => {
  const raw = obj[key];
  return raw === true || raw === 'true' || raw === '1';
};

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsInt()
  @Min(0)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  API_PREFIX: string = 'api';

  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;

  @IsString()
  @IsNotEmpty()
  DB_HOST: string;

  @IsInt()
  DB_PORT: number = 5432;

  @IsString()
  @IsNotEmpty()
  DB_USERNAME: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  DB_DATABASE: string;

  @Transform(toBoolean)
  @IsBoolean()
  DB_SYNCHRONIZE: boolean = false;

  @Transform(toBoolean)
  @IsBoolean()
  DB_LOGGING: boolean = false;

  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET: string;

  @IsInt()
  @Min(60)
  JWT_ACCESS_EXPIRES_IN: number = 900;

  @IsInt()
  @Min(60)
  JWT_REFRESH_EXPIRES_IN: number = 604800;

  @IsInt()
  THROTTLE_TTL: number = 60000;

  @IsInt()
  THROTTLE_LIMIT: number = 100;

  @Matches(/^(gemini|groq|ollama|fake)(,(gemini|groq|ollama|fake))*$/, {
    message: 'LLM_PROVIDERS là danh sách gemini, groq, ollama, fake cách nhau bằng dấu phẩy',
  })
  LLM_PROVIDERS: string = 'fake';

  @IsInt()
  @Min(1000)
  AI_TIMEOUT_MS: number = 60000;

  @IsString()
  @IsNotEmpty()
  AI_PROMPT_VERSION: string = 'v1';

  @IsOptional()
  @IsString()
  GEMINI_API_KEY?: string;

  @IsOptional()
  @IsString()
  GEMINI_MODEL?: string;

  @IsOptional()
  @IsString()
  GEMINI_MODEL_EXTRACT?: string;

  @IsOptional()
  @IsString()
  GROQ_API_KEY?: string;

  @IsOptional()
  @IsString()
  GROQ_MODEL?: string;

  @IsIn(['json_schema', 'json_object'])
  GROQ_JSON_MODE: string = 'json_object';

  @IsString()
  OLLAMA_BASE_URL: string = 'http://localhost:11434';

  @IsString()
  OLLAMA_MODEL: string = 'qwen3:4b';

  @IsIn(['json_schema', 'json_object'])
  OLLAMA_JSON_MODE: string = 'json_schema';

  @IsIn(['gemini', 'ollama', 'fake'])
  EMBEDDING_PROVIDER: string = 'fake';

  @IsOptional()
  @IsString()
  EMBEDDING_MODEL?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  EMBEDDING_BATCH_SIZE: number = 100;

  // Database Design 4.9
  @IsInt()
  @Min(1)
  @Max(2000)
  EMBEDDING_DIM: number = 1024;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors
      .map((e) => `  - ${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${details}`);
  }
  return validated;
}
