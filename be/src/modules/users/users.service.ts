import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PaginatedResult } from '../../common/dto/paginated-result.dto.js';
import type { Role } from '../../common/enums/role.enum.js';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import type { FieldError } from '../../common/interfaces/api-response.interface.js';
import { dataScope } from '../../common/utils/department-scope.js';
import { escapeLike } from '../../common/utils/text.js';
import { AuditService } from '../audit/audit.service.js';
import {
  AuditAction,
  AuditEntity,
  type AuditMetadata,
} from '../audit/entities/audit-log.entity.js';
import { DepartmentsService } from '../departments/departments.service.js';
import { RefreshTokensService } from '../refresh-tokens/refresh-tokens.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { QueryUserDto } from './dto/query-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from './entities/user.entity.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { orgIdOf } from '../../common/utils/department-scope.js';

type Actor = Pick<AuthUser, 'id' | 'organizationId'>;

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly departmentsService: DepartmentsService,
    private readonly refreshTokensService: RefreshTokensService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateUserDto, actor: Actor): Promise<User> {
    const organizationId = orgIdOf(actor);
    if (await this.usersRepository.existsBy({ email: dto.email })) {
      // BR-ACC-02
      throw new BusinessException(
        ErrorCode.EmailExists,
        'Email already exists',
        HttpStatus.CONFLICT,
        [{ field: 'email', messages: ['Email đã tồn tại'] }],
      );
    }
    const { password, ...rest } = dto;
    const user = this.usersRepository.create({
      ...rest,
      organizationId,
      departmentId: await this.resolveDepartment(dto.role, dto.departmentId, organizationId),
      passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
      emailVerifiedAt: new Date(),
    });
    const saved = await this.usersRepository.save(user);
    await this.record(actor, AuditAction.UserCreated, saved.id, {
      role: saved.role,
      departmentId: saved.departmentId,
    });
    return this.findById(saved.id);
  }

  async findAll(query: QueryUserDto, actor: Actor): Promise<PaginatedResult<User>> {
    const qb = this.withDepartment(this.usersRepository.createQueryBuilder('user'))
      .where('user.organizationId = :organizationId', { organizationId: orgIdOf(actor) })
      .orderBy('user.createdAt', query.order)
      .skip(query.skip)
      .take(query.limit);

    if (query.search) {
      qb.andWhere('(user.email ILIKE :search OR user.fullName ILIKE :search)', {
        search: `%${escapeLike(query.search)}%`,
      });
    }
    if (query.role) {
      qb.andWhere('user.role = :role', { role: query.role });
    }

    const [items, total] = await qb.getManyAndCount();
    return new PaginatedResult(items, total, query.page, query.limit);
  }

  async findById(id: string): Promise<User> {
    const user = await this.withDepartment(this.usersRepository.createQueryBuilder('user'))
      .where('user.id = :id', { id })
      .getOne();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // BR-TEN-02
  async findInOrg(id: string, actor: Actor): Promise<User> {
    const user = await this.findById(id);
    if (user.organizationId !== orgIdOf(actor)) throw new NotFoundException('User not found');
    return user;
  }

  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  findByIdWithPassword(id: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id })
      .getOne();
  }

  async setPassword(id: string, password: string): Promise<void> {
    await this.usersRepository.update(id, {
      passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
    });
  }

  async update(id: string, dto: UpdateUserDto, actor: Actor): Promise<User> {
    const user = await this.findInOrg(id, actor);
    // BR-ACC-05
    if (dto.role !== undefined && dto.role !== user.role) {
      this.assertNotSelf(id, actor.id, 'Cannot change your own role');
    }
    const { password, departmentId, ...rest } = dto;
    const before = { role: user.role, departmentId: user.departmentId };
    const role = dto.role ?? user.role;
    Object.assign(user, rest, {
      role,
      departmentId: await this.resolveDepartment(
        role,
        departmentId !== undefined ? departmentId : user.departmentId,
        user.organizationId!,
      ),
    });
    delete user.department;
    delete user.organization;
    if (password) {
      user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    }
    await this.usersRepository.save(user);
    const changes: AuditMetadata = {};
    if (user.role !== before.role)
      Object.assign(changes, { roleFrom: before.role, roleTo: user.role });
    if (user.departmentId !== before.departmentId) {
      Object.assign(changes, {
        departmentFrom: before.departmentId,
        departmentTo: user.departmentId,
      });
    }
    if (password) changes.passwordReset = true;
    if (Object.keys(changes).length) await this.record(actor, AuditAction.UserUpdated, id, changes);
    // BR-ACC-06
    if (password) await this.refreshTokensService.revokeAllForUser(id);
    return this.findById(id);
  }

  // BR-ACC-04, BR-ACC-05
  async setStatus(id: string, isActive: boolean, actor: Actor): Promise<User> {
    if (!isActive) this.assertNotSelf(id, actor.id, 'Cannot disable your own account');
    await this.findInOrg(id, actor);
    await this.usersRepository.update(id, { isActive });
    await this.record(actor, AuditAction.UserUpdated, id, { isActive });
    if (!isActive) await this.refreshTokensService.revokeAllForUser(id);
    return this.findById(id);
  }

  // BR-ACC-05
  async remove(id: string, actor: Actor): Promise<void> {
    this.assertNotSelf(id, actor.id, 'Cannot delete your own account');
    await this.findInOrg(id, actor);
    await this.usersRepository.softDelete(id);
    await this.record(actor, AuditAction.UserDeleted, id, {});
    await this.refreshTokensService.revokeAllForUser(id);
  }

  // F-AUDIT-01
  private record(actor: Actor, action: AuditAction, userId: string, metadata: AuditMetadata) {
    return this.audit.record({
      organizationId: orgIdOf(actor),
      actorId: actor.id,
      action,
      entity: AuditEntity.User,
      entityId: userId,
      metadata,
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, { lastLoginAt: new Date() });
  }

  // BR-ACC-03
  private async resolveDepartment(
    role: Role,
    departmentId: string | null | undefined,
    organizationId: string,
  ): Promise<string | null> {
    if (dataScope(role) !== 'department') return null;
    let error: FieldError | undefined;
    if (!departmentId) {
      error = { field: 'departmentId', messages: ['Hiring Manager phải thuộc một phòng ban'] };
    } else if (!(await this.departmentsService.exists(departmentId, organizationId))) {
      error = { field: 'departmentId', messages: ['Phòng ban không tồn tại'] };
    }
    if (error) {
      throw new BusinessException(
        ErrorCode.ValidationFailed,
        'Validation failed',
        HttpStatus.BAD_REQUEST,
        [error],
      );
    }
    return departmentId!;
  }

  private assertNotSelf(id: string, actorId: string, message: string): void {
    if (id !== actorId) return;
    throw new BusinessException(ErrorCode.ValidationFailed, message, HttpStatus.BAD_REQUEST);
  }

  private withDepartment(qb: SelectQueryBuilder<User>): SelectQueryBuilder<User> {
    return qb
      .leftJoin('user.department', 'department')
      .addSelect(['department.id', 'department.name'])
      .leftJoin('user.organization', 'organization')
      .addSelect([
        'organization.id',
        'organization.name',
        'organization.slug',
        'organization.status',
      ]);
  }
}
