import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { PaginatedResult } from '../../common/dto/paginated-result.dto.js';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import { Job } from '../jobs/entities/job.entity.js';
import { User } from '../users/entities/user.entity.js';
import { CreateDepartmentDto } from './dto/create-department.dto.js';
import { QueryDepartmentDto } from './dto/query-department.dto.js';
import { UpdateDepartmentDto } from './dto/update-department.dto.js';
import { Department } from './entities/department.entity.js';

export interface DepartmentView extends Department {
  userCount: number;
  jobCount: number;
}

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentsRepository: Repository<Department>,
  ) {}

  async findAll(query: QueryDepartmentDto): Promise<PaginatedResult<DepartmentView>> {
    const qb = this.departmentsRepository
      .createQueryBuilder('department')
      .orderBy('department.name', query.order)
      .skip(query.skip)
      .take(query.limit);

    if (query.search) {
      qb.andWhere('(department.name ILIKE :search OR department.code ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const [items, total] = await qb.getManyAndCount();
    return new PaginatedResult(await this.withCounts(items), total, query.page, query.limit);
  }

  async findById(id: string): Promise<DepartmentView> {
    const [view] = await this.withCounts([await this.getOrFail(id)]);
    return view;
  }

  exists(id: string): Promise<boolean> {
    return this.departmentsRepository.existsBy({ id });
  }

  async create(dto: CreateDepartmentDto): Promise<DepartmentView> {
    await this.assertUnique(dto);
    const saved = await this.departmentsRepository.save(this.departmentsRepository.create(dto));
    return this.findById(saved.id);
  }

  async update(id: string, dto: UpdateDepartmentDto): Promise<DepartmentView> {
    const department = await this.getOrFail(id);
    await this.assertUnique(dto, id);
    Object.assign(department, dto);
    await this.departmentsRepository.save(department);
    return this.findById(id);
  }

  // BR-ACC-08
  async remove(id: string): Promise<void> {
    const { userCount, jobCount } = await this.findById(id);
    if (userCount > 0 || jobCount > 0) {
      throw new BusinessException(
        ErrorCode.DepartmentInUse,
        'Department still has users or jobs',
        HttpStatus.CONFLICT,
      );
    }
    await this.departmentsRepository.softDelete(id);
  }

  userCounts(ids: string[]): Promise<Map<string, number>> {
    return this.countByDepartment(User, ids);
  }

  jobCounts(ids: string[]): Promise<Map<string, number>> {
    return this.countByDepartment(Job, ids);
  }

  private async countByDepartment(
    entity: typeof User | typeof Job,
    ids: string[],
  ): Promise<Map<string, number>> {
    if (!ids.length) return new Map();
    const rows = await this.departmentsRepository.manager
      .createQueryBuilder(entity, 'row')
      .select('row.departmentId', 'departmentId')
      .addSelect('COUNT(*)::int', 'count')
      .where('row.departmentId IN (:...ids)', { ids })
      .groupBy('row.departmentId')
      .getRawMany<{ departmentId: string; count: number }>();
    return new Map(rows.map((r) => [r.departmentId, r.count]));
  }

  private async withCounts(departments: Department[]): Promise<DepartmentView[]> {
    const ids = departments.map((d) => d.id);
    const [users, jobs] = await Promise.all([this.userCounts(ids), this.jobCounts(ids)]);
    return departments.map((d) =>
      Object.assign(d, { userCount: users.get(d.id) ?? 0, jobCount: jobs.get(d.id) ?? 0 }),
    );
  }

  private async getOrFail(id: string): Promise<Department> {
    const department = await this.departmentsRepository.findOneBy({ id });
    if (!department) throw new NotFoundException('Department not found');
    return department;
  }

  private async assertUnique(dto: UpdateDepartmentDto, excludeId?: string): Promise<void> {
    const notSelf = excludeId ? { id: Not(excludeId) } : {};
    const checks = [
      { field: 'code' as const, message: 'Mã phòng ban đã tồn tại' },
      { field: 'name' as const, message: 'Tên phòng ban đã tồn tại' },
    ];
    for (const { field, message } of checks) {
      const value = dto[field];
      if (value && (await this.departmentsRepository.existsBy({ [field]: value, ...notSelf }))) {
        throw new BusinessException(
          ErrorCode.Conflict,
          `Department ${field} already exists`,
          HttpStatus.CONFLICT,
          [{ field, messages: [message] }],
        );
      }
    }
  }
}
