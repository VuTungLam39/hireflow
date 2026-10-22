import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PaginatedResult } from '../../common/dto/paginated-result.dto.js';
import { Role } from '../../common/enums/role.enum.js';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import type { FieldError } from '../../common/interfaces/api-response.interface.js';
import { DepartmentsService } from '../departments/departments.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { QueryUserDto } from './dto/query-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from './entities/user.entity.js';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly departmentsService: DepartmentsService,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
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
      departmentId: await this.resolveDepartment(dto.role, dto.departmentId),
      passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
    });
    const saved = await this.usersRepository.save(user);
    return this.findById(saved.id);
  }

  async findAll(query: QueryUserDto): Promise<PaginatedResult<User>> {
    const qb = this.withDepartment(this.usersRepository.createQueryBuilder('user'))
      .orderBy('user.createdAt', query.order)
      .skip(query.skip)
      .take(query.limit);

    if (query.search) {
      qb.andWhere('(user.email ILIKE :search OR user.fullName ILIKE :search)', {
        search: `%${query.search}%`,
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

  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  findByIdWithRefreshToken(id: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.refreshTokenHash')
      .where('user.id = :id', { id })
      .getOne();
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    const { password, departmentId, ...rest } = dto;
    const role = dto.role ?? user.role;
    Object.assign(user, rest, {
      role,
      departmentId: await this.resolveDepartment(
        role,
        departmentId !== undefined ? departmentId : user.departmentId,
      ),
    });
    delete user.department;
    if (password) {
      user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    }
    await this.usersRepository.save(user);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.usersRepository.softDelete(id);
  }

  async updateRefreshTokenHash(id: string, refreshTokenHash: string | null): Promise<void> {
    await this.usersRepository.update(id, { refreshTokenHash });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, { lastLoginAt: new Date() });
  }

  // BR-ACC-03
  private async resolveDepartment(
    role: Role,
    departmentId: string | null | undefined,
  ): Promise<string | null> {
    if (role !== Role.HiringManager) return null;
    let error: FieldError | undefined;
    if (!departmentId) {
      error = { field: 'departmentId', messages: ['Hiring Manager phải thuộc một phòng ban'] };
    } else if (!(await this.departmentsService.exists(departmentId))) {
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

  private withDepartment(qb: SelectQueryBuilder<User>): SelectQueryBuilder<User> {
    return qb
      .leftJoin('user.department', 'department')
      .addSelect(['department.id', 'department.name']);
  }
}
