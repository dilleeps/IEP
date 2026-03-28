// src/modules/admin/users/admin-users.service.ts
import { AdminUsersRepository } from './admin-users.repo.js';
import {
  CreateUserDto,
  UpdateUserDto,
  AdminUserResponse,
  AdminUserListResponse,
  UserStatsResponse,
  DirectRegisterDto,
  RegisterRoleDto,
} from './admin-users.types.js';
import { AppError } from '../../shared/errors/appError.js';
import { User } from '../../auth/user.model.js';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

export class AdminUsersService {
  private repo: AdminUsersRepository;

  constructor() {
    this.repo = new AdminUsersRepository();
  }

  async create(dto: CreateUserDto): Promise<AdminUserResponse> {
    // Check if user already exists
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) {
      throw new AppError('User with this email already exists', 400);
    }

    // Generate temporary password
    const tempPassword = this.generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await this.repo.create({
      id: uuidv4(),
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      status: dto.status || 'pending',
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // TODO: Send welcome email with temp password if sendWelcomeEmail is true
    if (dto.sendWelcomeEmail) {
      // await emailService.sendWelcome(user.email, tempPassword);
    }

    return this.toResponse(user);
  }

  async list(filters: {
    role?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
  }): Promise<AdminUserListResponse> {
    const { rows, count } = await this.repo.findAllUsers(
      {
        role: filters.role,
        status: filters.status,
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      },
      filters.page || 1,
      filters.limit || 50
    );

    return {
      users: rows.map(u => this.toResponse(u)),
      total: count,
    };
  }

  async getById(id: string): Promise<AdminUserResponse> {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return this.toResponse(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<AdminUserResponse> {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updated = await this.repo.update(id, dto);
    return this.toResponse(updated);
  }

  async changeStatus(id: string, status: string, reason?: string): Promise<AdminUserResponse> {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const changed = await this.repo.changeStatus(id, status as any, reason);
    if (!changed) {
      throw new AppError('Failed to change user status', 500);
    }

    const updated = await this.repo.findById(id);
    return this.toResponse(updated!);
  }

  async delete(id: string): Promise<void> {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Soft delete
    await this.repo.delete(id);
  }

  async getStats(): Promise<UserStatsResponse> {
    const { stats, newThisMonth } = await this.repo.getUserStats();

    const byRole: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let total = 0;

    for (const stat of stats) {
      const count = parseInt((stat as any).total);
      total += count;

      const role = (stat as any).role;
      const status = (stat as any).status;

      byRole[role] = (byRole[role] || 0) + count;
      byStatus[status] = (byStatus[status] || 0) + count;
    }

    return {
      total,
      byRole,
      byStatus,
      newThisMonth,
    };
  }

  async directRegister(dto: DirectRegisterDto, createdBy: any): Promise<AdminUserResponse> {
    // Check if user already exists
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) {
      throw new AppError('User with this email already exists', 400);
    }

    // Hash the provided password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.repo.create({
      id: uuidv4(),
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      status: 'active', // Auto-approve for direct registration
      emailVerified: true, // Auto-verify email for admin-created users
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // TODO: Send welcome email if requested
    if (dto.sendWelcomeEmail) {
      // await emailService.sendWelcomeDirectRegister(user.email);
    }

    // TODO: Log audit trail
    // await auditService.log({
    //   action: 'DIRECT_REGISTER',
    //   userId: createdBy.id,
    //   targetUserId: user.id,
    //   details: { role: dto.role }
    // });

    return this.toResponse(user);
  }

  async registerAdmin(dto: RegisterRoleDto, createdBy: any): Promise<AdminUserResponse> {
    return this.registerUserByRole(dto, 'ADMIN', createdBy);
  }

  async registerAdvocate(dto: RegisterRoleDto, createdBy: any): Promise<AdminUserResponse> {
    return this.registerUserByRole(dto, 'ADVOCATE', createdBy);
  }

  async registerTeacher(dto: RegisterRoleDto, createdBy: any): Promise<AdminUserResponse> {
    return this.registerUserByRole(dto, 'TEACHER_THERAPIST', createdBy);
  }

  async registerParent(dto: RegisterRoleDto, createdBy: any): Promise<AdminUserResponse> {
    return this.registerUserByRole(dto, 'PARENT', createdBy);
  }

  private async registerUserByRole(
    dto: RegisterRoleDto,
    role: 'ADMIN' | 'ADVOCATE' | 'TEACHER_THERAPIST' | 'PARENT',
    createdBy: any
  ): Promise<AdminUserResponse> {
    // Check if user already exists
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) {
      throw new AppError('User with this email already exists', 400);
    }

    // Hash the provided password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.repo.create({
      id: uuidv4(),
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role,
      status: 'active', // Auto-approve all admin-created users
      emailVerified: true, // Auto-verify email for admin-created users
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // TODO: Send welcome email if requested
    if (dto.sendWelcomeEmail) {
      // await emailService.sendWelcomeDirectRegister(user.email);
    }

    // TODO: Log audit trail
    // await auditService.log({
    //   action: 'REGISTER_USER',
    //   userId: createdBy.id,
    //   targetUserId: user.id,
    //   details: { role }
    // });

    return this.toResponse(user);
  }

  private toResponse(user: any): AdminUserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      subscriptionPlanSlug: user.subscriptionPlanSlug,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
