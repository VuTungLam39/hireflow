import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpStatus,
  INestApplication,
  NotFoundException,
  Post,
  Query,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsEmail } from 'class-validator';
import request from 'supertest';
import { PaginationQueryDto } from '../dto/pagination-query.dto.js';
import { BusinessException } from '../exceptions/business.exception.js';
import { ErrorCode } from '../exceptions/error-code.enum.js';
import { requestId } from '../middleware/request-id.js';
import { createValidationPipe } from '../utils/validation.util.js';
import { AllExceptionsFilter, codeForStatus } from './all-exceptions.filter.js';

class EmailDto {
  @IsEmail()
  email!: string;
}

/** Controller giả để kiểm format lỗi qua HTTP thật, không cần database */
@Controller('t')
class ProbeController {
  @Get('business')
  business() {
    throw new BusinessException(
      ErrorCode.EmailExists,
      'Email already exists',
      HttpStatus.CONFLICT,
      [{ field: 'email', messages: ['Email đã tồn tại'] }],
    );
  }

  @Get('not-found')
  notFound() {
    throw new NotFoundException('User not found');
  }

  @Get('forbidden')
  forbidden() {
    throw new ForbiddenException();
  }

  @Get('unknown-code')
  unknownCode() {
    throw new ForbiddenException({ code: 'MADE_UP', message: 'x' });
  }

  @Get('crash')
  crash() {
    throw new Error('db password is hunter2');
  }

  @Post('validate')
  validate(@Body() dto: EmailDto) {
    return dto;
  }

  @Get('list')
  list(@Query() query: PaginationQueryDto) {
    return { order: query.order };
  }
}

describe('AllExceptionsFilter + request-id (HTTP)', () => {
  let app: INestApplication;
  const server = () => app.getHttpServer();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ controllers: [ProbeController] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.use(requestId);
    app.useGlobalPipes(createValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(() => app.close());

  it('keeps the code and field errors of a BusinessException', async () => {
    const res = await request(server()).get('/t/business').expect(409);
    expect(res.body).toMatchObject({
      success: false,
      statusCode: 409,
      code: 'EMAIL_EXISTS',
      message: 'Email already exists',
      errors: [{ field: 'email', messages: ['Email đã tồn tại'] }],
      path: '/t/business',
    });
  });

  it('derives the code from the status for built-in exceptions', async () => {
    expect((await request(server()).get('/t/not-found').expect(404)).body.code).toBe('NOT_FOUND');
    expect((await request(server()).get('/t/forbidden').expect(403)).body.code).toBe('FORBIDDEN');
  });

  it('ignores a code that is not in ErrorCode', async () => {
    const res = await request(server()).get('/t/unknown-code').expect(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('hides internal details of unexpected errors', async () => {
    const res = await request(server()).get('/t/crash').expect(500);
    expect(res.body).toMatchObject({ code: 'INTERNAL_ERROR', message: 'Internal server error' });
    expect(JSON.stringify(res.body)).not.toContain('hunter2');
  });

  it('returns VALIDATION_FAILED with errors per field', async () => {
    const res = await request(server()).post('/t/validate').send({ email: 'nope' }).expect(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(res.body.errors).toEqual([{ field: 'email', messages: [expect.any(String)] }]);
  });

  describe('order (BE-03)', () => {
    it('defaults to DESC and accepts ASC', async () => {
      expect((await request(server()).get('/t/list').expect(200)).body.order).toBe('DESC');
      expect((await request(server()).get('/t/list?order=ASC').expect(200)).body.order).toBe('ASC');
    });

    it('rejects an invalid order and the old sortOrder name', async () => {
      const bad = await request(server()).get('/t/list?order=sideways').expect(400);
      expect(bad.body.code).toBe('VALIDATION_FAILED');
      const old = await request(server()).get('/t/list?sortOrder=ASC').expect(400);
      expect(old.body.errors).toEqual([expect.objectContaining({ field: 'sortOrder' })]);
    });
  });

  describe('request id', () => {
    it('creates an id when the client sends none', async () => {
      const res = await request(server()).get('/t/list').expect(200);
      expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('reuses a safe id from the client and replaces an unsafe one', async () => {
      const kept = await request(server()).get('/t/list').set('X-Request-Id', 'abc-123');
      expect(kept.headers['x-request-id']).toBe('abc-123');
      // Có khoảng trắng và dấu ; → không được ghi nguyên vào log
      const replaced = await request(server()).get('/t/list').set('X-Request-Id', 'bad id; drop');
      expect(replaced.headers['x-request-id']).not.toBe('bad id; drop');
      expect(replaced.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('is also set on error responses', async () => {
      const res = await request(server()).get('/t/not-found').expect(404);
      expect(res.headers['x-request-id']).toBeTruthy();
    });
  });
});

describe('codeForStatus', () => {
  it.each([
    [400, 'VALIDATION_FAILED'],
    [401, 'UNAUTHORIZED'],
    [403, 'FORBIDDEN'],
    [404, 'NOT_FOUND'],
    [409, 'CONFLICT'],
    [413, 'FILE_TOO_LARGE'],
    [429, 'TOO_MANY_REQUESTS'],
    [500, 'INTERNAL_ERROR'],
    [503, 'INTERNAL_ERROR'],
  ])('%i → %s', (status, code) => {
    expect(codeForStatus(status)).toBe(code);
  });
});
