import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { PaginatedResult } from '../../common/dto/paginated-result.dto.js';
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
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    if (await this.usersRepository.existsBy({ email: dto.email })) {
      throw new ConflictException('Email already exists');
    }
    const user = this.usersRepository.create({
      ...dto,
      password: await bcrypt.hash(dto.password, SALT_ROUNDS),
    });
    return this.usersRepository.save(user);
  }

  async findAll(query: QueryUserDto): Promise<PaginatedResult<User>> {
    const qb = this.usersRepository
      .createQueryBuilder('user')
      .orderBy('user.createdAt', query.sortOrder)
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
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Lấy user kèm password để kiểm tra đăng nhập */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  /** Lấy user kèm refresh token hash để kiểm tra refresh */
  findByIdWithRefreshToken(id: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.refreshTokenHash')
      .where('user.id = :id', { id })
      .getOne();
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    const { password, ...rest } = dto;
    Object.assign(user, rest);
    if (password) {
      user.password = await bcrypt.hash(password, SALT_ROUNDS);
    }
    return this.usersRepository.save(user);
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
}
