import { HttpStatus, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import { DepartmentsService } from './departments.service.js';
import { Department } from './entities/department.entity.js';

describe('DepartmentsService', () => {
  let service: DepartmentsService;
  const eng = { id: 'd-1', name: 'Kỹ thuật', code: 'ENG' } as Department;

  const repo = {
    existsBy: vi.fn(),
    findOneBy: vi.fn(),
    create: vi.fn((data: Partial<Department>) => ({ ...data })),
    save: vi.fn(async (data: Partial<Department>) => ({ id: 'd-new', ...data })),
    softDelete: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    repo.existsBy.mockResolvedValue(false);
    repo.findOneBy.mockImplementation(async ({ id }: { id: string }) =>
      id === eng.id || id === 'd-new' ? { ...eng, id } : null,
    );
    const moduleRef = await Test.createTestingModule({
      providers: [DepartmentsService, { provide: getRepositoryToken(Department), useValue: repo }],
    }).compile();
    service = moduleRef.get(DepartmentsService);
    vi.spyOn(service, 'userCounts').mockResolvedValue(new Map());
  });

  it('returns userCount and jobCount with the department', async () => {
    vi.spyOn(service, 'userCounts').mockResolvedValue(new Map([[eng.id, 3]]));
    expect(await service.findById(eng.id)).toMatchObject({
      code: 'ENG',
      userCount: 3,
      jobCount: 0,
    });
  });

  it('throws NotFoundException for a missing department', async () => {
    await expect(service.findById('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it.each([
    ['code', 'Mã phòng ban đã tồn tại'],
    ['name', 'Tên phòng ban đã tồn tại'],
  ])('rejects a duplicate %s with 409 CONFLICT on that field', async (field, message) => {
    repo.existsBy.mockImplementation(async (where: Record<string, unknown>) => field in where);
    const error = (await service
      .create({ name: 'Kỹ thuật', code: 'ENG' })
      .catch((e: unknown) => e)) as BusinessException;
    expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(error.getResponse()).toMatchObject({
      code: ErrorCode.Conflict,
      errors: [{ field, messages: [message] }],
    });
  });

  it('excludes itself when checking uniqueness on update', async () => {
    await service.update(eng.id, { code: 'ENG' });
    expect(repo.existsBy).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'ENG', id: expect.anything() }),
    );
    expect(repo.save).toHaveBeenCalled();
  });

  describe('remove (BR-ACC-08)', () => {
    it('soft-deletes an empty department', async () => {
      await service.remove(eng.id);
      expect(repo.softDelete).toHaveBeenCalledWith(eng.id);
    });

    it('refuses to delete a department that still has users', async () => {
      vi.spyOn(service, 'userCounts').mockResolvedValue(new Map([[eng.id, 1]]));
      const error = (await service.remove(eng.id).catch((e: unknown) => e)) as BusinessException;
      expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(error.code).toBe(ErrorCode.DepartmentInUse);
      expect(repo.softDelete).not.toHaveBeenCalled();
    });
  });
});
