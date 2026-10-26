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
  ValidateIf,
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

const hasValue = (key: string) => (env: object) => !!(env as Record<string, unknown>)[key];
const withoutDatabaseUrl = (env: { DATABASE_URL?: string }) => !env.DATABASE_URL;

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

  @ValidateIf(hasValue('DATABASE_URL'))
  @Matches(/^postgres(ql)?:\/\/.+/, { message: 'DATABASE_URL phải có dạng postgres://...' })
  DATABASE_URL?: string;

  @ValidateIf(withoutDatabaseUrl)
  @IsString()
  @IsNotEmpty()
  DB_HOST: string;

  @IsInt()
  DB_PORT: number = 5432;

  @ValidateIf(withoutDatabaseUrl)
  @IsString()
  @IsNotEmpty()
  DB_USERNAME: string;

  @ValidateIf(withoutDatabaseUrl)
  @IsString()
  DB_PASSWORD: string;

  @ValidateIf(withoutDatabaseUrl)
  @IsString()
  @IsNotEmpty()
  DB_DATABASE: string;

  @Transform(toBoolean)
  @IsBoolean()
  DB_SSL: boolean = false;

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

  @IsInt()
  @Min(0)
  @Max(10)
  TRUST_PROXY: number = 0;

  @Transform(toBoolean)
  @IsBoolean()
  DEBUG_CLIENT_IP: boolean = false;

  // F-PUB-04
  @ValidateIf(hasValue('PRERENDER_DEPLOY_HOOK_URL'))
  @Matches(/^https:\/\/.+/, { message: 'PRERENDER_DEPLOY_HOOK_URL phải là URL https://' })
  PRERENDER_DEPLOY_HOOK_URL?: string;

  @IsInt()
  @Min(0)
  @Max(600000)
  PRERENDER_DEBOUNCE_MS: number = 30000;

  // BR-DATA-04
  @IsInt()
  @Min(1)
  @Max(120)
  CV_RETENTION_MONTHS: number = 12;

  @Matches(/^(gemini|groq|ollama|fake)(,(gemini|groq|ollama|fake))*$/, {
    message: 'LLM_PROVIDERS là danh sách gemini, groq, ollama, fake cách nhau bằng dấu phẩy',
  })
  LLM_PROVIDERS: string = 'fake';

  @IsInt()
  @Min(1000)
  AI_TIMEOUT_MS: number = 60000;

  @IsString()
  @IsNotEmpty()
  AI_PROMPT_VERSION: string = 'v3';

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

  @ValidateIf(hasValue('REDIS_URL'))
  @Matches(/^rediss?:\/\/.+/, { message: 'REDIS_URL phải có dạng redis://... hoặc rediss://...' })
  REDIS_URL?: string;

  @IsString()
  REDIS_HOST: string = 'localhost';

  @IsInt()
  @Min(1)
  @Max(65535)
  REDIS_PORT: number = 6379;

  @IsOptional()
  @IsString()
  REDIS_USERNAME?: string;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  @Transform(toBoolean)
  @IsBoolean()
  REDIS_TLS: boolean = false;

  @IsOptional()
  @Matches(/^[\w-]{0,32}$/)
  QUEUE_PREFIX?: string;

  @IsIn(['local', 's3'])
  STORAGE_DRIVER: string = 'local';

  @IsString()
  STORAGE_LOCAL_ROOT: string = 'storage';

  @IsString()
  S3_ENDPOINT: string = 'http://localhost:9000';

  @IsOptional()
  @IsString()
  S3_PUBLIC_ENDPOINT?: string;

  @IsString()
  S3_REGION: string = 'us-east-1';

  @Matches(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/)
  S3_BUCKET: string = 'hireflow-cv';

  @ValidateIf((env: EnvironmentVariables) => env.STORAGE_DRIVER === 's3')
  @IsString()
  @IsNotEmpty()
  S3_ACCESS_KEY?: string;

  @ValidateIf((env: EnvironmentVariables) => env.STORAGE_DRIVER === 's3')
  @IsString()
  @IsNotEmpty()
  S3_SECRET_KEY?: string;

  @IsIn(['true', 'false'])
  S3_FORCE_PATH_STYLE: string = 'true';

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
