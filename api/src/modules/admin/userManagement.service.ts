import bcrypt from 'bcrypt';
import { Op, QueryTypes } from 'sequelize';
import { User } from '../auth/user.model.js';
import { UserRegistrationRequest } from './userRegistrationRequest.model.js';
import { getFirebaseAuth } from '../../config/firebase.js';
import {
  CreateUserDto,
  UpdateUserDto,
  ApproveRequestDto,
  RejectRequestDto,
  BulkUserImportDto,
  UserResponse,
  RegistrationRequestResponse,
  UserStatsResponse,
} from './userManagement.types.js';
import { AppError } from '../../shared/errors/appError.js';
import { logger } from '../../config/logger.js';

const SALT_ROUNDS = 10;

const PASSWORD_POLICY_MESSAGE = 'Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, and one number';
const hasUppercase = /[A-Z]/;
const hasLowercase = /[a-z]/;
const hasNumber = /[0-9]/;

function isPasswordValid(password: string): boolean {
  return password.length >= 8 && hasUppercase.test(password) && hasLowercase.test(password) && hasNumber.test(password);
}

export class UserManagementService {
  /**
   * Get all users with optional filters
   */
  async getAllUsers(filters?: {
    role?: string;
    status?: string;
    search?: string;
  }): Promise<UserResponse[]> {
    const where: any = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${filters.search}%` } },
        { displayName: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    const users = await User.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    return users.map(this.toUserResponse);
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserResponse> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    return this.toUserResponse(user);
  }

  /**
   * Create user directly (admin creation - bypasses approval)
   */
  async createUser(data: CreateUserDto, adminId: string): Promise<UserResponse> {
    const { email, password, displayName, role, status } = data;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
    }

    // Password is required - no auto-generation
    if (!password) {
      throw new AppError('Password is required', 400, 'PASSWORD_REQUIRED');
    }

    if (!isPasswordValid(password)) {
      throw new AppError(PASSWORD_POLICY_MESSAGE, 400, 'WEAK_PASSWORD');
    }

    // Generate simple password if not provided (COMMENTED OUT - password now required)
    // const finalPassword = password || this.generateSimplePassword(displayName, email);
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Admin-created users are set to active by default
    const user = await User.create({
      email,
      passwordHash,
      displayName,
      role: role.toUpperCase() as any,
      status: status || 'active',
    } as any);

    return this.toUserResponse(user);
  }

  /**
   * Update user
   */
  async updateUser(userId: string, data: UpdateUserDto, adminId: string): Promise<UserResponse> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Update allowed fields
    if (data.displayName !== undefined) user.displayName = data.displayName;
    if (data.email !== undefined) {
      // Check email uniqueness
      const existing = await User.findOne({
        where: { email: data.email, id: { [Op.ne]: userId } },
      });
      if (existing) {
        throw new AppError('Email already in use', 409, 'EMAIL_EXISTS');
      }
      user.email = data.email;
    }
    if (data.role !== undefined) user.role = data.role.toUpperCase() as any;
    if (data.status !== undefined) user.status = data.status;

    await user.save();
    return this.toUserResponse(user);
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string, adminId: string): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Prevent admin from deleting themselves
    if (user.id === adminId) {
      throw new AppError('Cannot delete your own account', 400, 'CANNOT_DELETE_SELF');
    }

    await this.deleteFirebaseAccount(user.email);
    await user.destroy();
  }

  /**
   * Bulk delete users by IDs. Returns counts and failures per-row.
   */
  async deleteUsers(userIds: string[], adminId: string): Promise<{
    deleted: number;
    failed: Array<{ id: string; reason: string }>;
  }> {
    const deleted: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];

    for (const id of userIds) {
      try {
        const user = await User.findByPk(id);
        if (!user) {
          failed.push({ id, reason: 'User not found' });
          continue;
        }

        if (user.id === adminId) {
          failed.push({ id, reason: 'Cannot delete your own account' });
          continue;
        }

        await this.deleteFirebaseAccount(user.email);
        await user.destroy();
        deleted.push(id);
      } catch (error) {
        failed.push({ id, reason: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return {
      deleted: deleted.length,
      failed,
    };
  }

  private async deleteFirebaseAccount(email: string): Promise<void> {
    if (!email) return;

    try {
      const auth = getFirebaseAuth();
      const firebaseUser = await auth.getUserByEmail(email);
      await auth.deleteUser(firebaseUser.uid);
      logger.info('Deleted Firebase user', { email, uid: firebaseUser.uid });
    } catch (error: any) {
      // If the Firebase user does not exist, treat as best-effort and continue.
      if (error?.code === 'auth/user-not-found') {
        logger.info('Firebase user not found during delete', { email });
        return;
      }

      logger.warn('Failed to delete Firebase user', { email, error });
    }
  }

  /**
   * Bulk update users by IDs. Returns counts and failures per-row.
   */
  async bulkUpdateUsers(
    userIds: string[],
    updates: { role?: string; status?: string },
    adminId: string
  ): Promise<{
    updated: number;
    failed: Array<{ id: string; reason: string }>;
  }> {
    const updated: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];

    if (!updates.role && !updates.status) {
      throw new AppError('At least one field (role or status) must be provided', 400, 'NO_UPDATES');
    }

    for (const id of userIds) {
      try {
        const user = await User.findByPk(id);
        if (!user) {
          failed.push({ id, reason: 'User not found' });
          continue;
        }

        // Prevent admin from changing their own role
        if (user.id === adminId && updates.role && updates.role.toUpperCase() !== user.role) {
          failed.push({ id, reason: 'Cannot change your own role' });
          continue;
        }

        // Update fields
        if (updates.role) {
          user.role = updates.role.toUpperCase() as any;
        }
        if (updates.status) {
          const normalizedStatus = updates.status.toLowerCase();
          const allowedStatuses = ['active', 'inactive', 'pending', 'suspended'];
          if (!allowedStatuses.includes(normalizedStatus)) {
            throw new AppError(`Invalid status: '${updates.status}'`, 400, 'INVALID_STATUS');
          }
          user.status = normalizedStatus as 'active' | 'inactive' | 'pending' | 'suspended';
        }

        await user.save();
        updated.push(id);
      } catch (error) {
        failed.push({ id, reason: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return {
      updated: updated.length,
      failed,
    };
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStatsResponse> {
    const sequelize = User.sequelize;
    if (!sequelize) {
      throw new AppError('Database not initialized', 500, 'DB_NOT_INITIALIZED');
    }

      const [pendingRequestsResult, byRoleRowsRaw, byStatusRowsRaw, totalRowsRaw] = await Promise.all([
        sequelize.query('SELECT * FROM user_registration_requests WHERE status = \'pending\''),
        sequelize.query('SELECT role, COUNT(*)::text AS count FROM users GROUP BY role', { type: QueryTypes.SELECT }),
        sequelize.query('SELECT status, COUNT(*)::text AS count FROM users GROUP BY status', { type: QueryTypes.SELECT }),
        sequelize.query('SELECT COUNT(*)::text AS count FROM users', { type: QueryTypes.SELECT }),
      ]);
      const pendingRequests = (pendingRequestsResult[0] as any[]);
      const byRoleRows = byRoleRowsRaw as Array<{ role: string; count: string }>;
      const byStatusRows = byStatusRowsRaw as Array<{ status: string; count: string }>;
      const totalRows = totalRowsRaw as Array<{ count: string }>;

    const byRole: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    byRoleRows.forEach((row) => {
      byRole[row.role] = Number(row.count);
    });

    byStatusRows.forEach((row) => {
      byStatus[row.status] = Number(row.count);
    });

    const total = totalRows[0] ? Number(totalRows[0].count) : 0;

    return {
      total,
      byRole,
      byStatus,
      pendingRequests: pendingRequests.length,
    };
  }

  /**
   * Get available user roles from database
   */
  async getRoles(): Promise<string[]> {
    const sequelize = User.sequelize;
    if (!sequelize) {
      throw new AppError('Database not initialized', 500, 'DB_NOT_INITIALIZED');
    }

    // Get roles from existing users
    const results = await sequelize.query(
      'SELECT DISTINCT role FROM users ORDER BY role',
      { type: QueryTypes.SELECT }
    ) as Array<{ role: string }>;

    const existingRoles = results.map((row) => row.role);

    // Define standard roles that should always be available
    const standardRoles = ['PARENT', 'ADVOCATE', 'TEACHER', 'TEACHER_THERAPIST', 'ADMIN', 'SUPPORT'];

    // Merge and deduplicate
    const allRoles = Array.from(new Set([...standardRoles, ...existingRoles]));

    return allRoles.sort();
  }

  /**
   * Get all pending registration requests
   */
  async getPendingRequests(): Promise<RegistrationRequestResponse[]> {
    const sequelize = User.sequelize;
    if (!sequelize) {
      throw new AppError('Database not initialized', 500, 'DB_NOT_INITIALIZED');
    }
    const [results] = await sequelize.query(
      `SELECT * FROM user_registration_requests WHERE status = 'pending' ORDER BY created_at DESC;`
    );

    // Results from raw queries use snake_case column names. Map them to the
    // expected RegistrationRequestResponse shape to avoid runtime errors
    return (results as any[]).map((row) => {
      const firstName = row.first_name ?? row.firstName ?? '';
      const lastName = row.last_name ?? row.lastName ?? '';
      const displayName = row.display_name ?? row.displayName ?? `${firstName}${lastName ? ' ' + lastName : ''}`.trim();
      const createdAtRaw = row.created_at ?? row.createdAt ?? null;
      const createdAt = createdAtRaw ? new Date(createdAtRaw).toISOString() : new Date().toISOString();

      return {
        id: row.id,
        email: row.email,
        displayName,
        role: row.role,
        reason: row.reason,
        status: row.status,
        createdAt,
      } as RegistrationRequestResponse;
    });
  }

  /**
   * Approve registration requests (bulk)
   */
  async approveRequests(data: ApproveRequestDto, adminId: string): Promise<{
    approved: number;
    failed: Array<{ requestId: string; reason: string }>;
  }> {
    const { requestIds } = data;
    const approved: string[] = [];
    const failed: Array<{ requestId: string; reason: string }> = [];

    for (const requestId of requestIds) {
      try {
        const request = await UserRegistrationRequest.findByPk(requestId);
        
        if (!request) {
          failed.push({ requestId, reason: 'Request not found' });
          continue;
        }

        if (request.status !== 'pending') {
          failed.push({ requestId, reason: `Request already ${request.status}` });
          continue;
        }

        // Check if user with email already exists
        const existingUser = await User.findOne({ where: { email: request.email } });
        if (existingUser) {
          failed.push({ requestId, reason: 'Email already registered' });
          continue;
        }

        // Create user from request
        await User.create({
          email: request.email,
          passwordHash: request.passwordHash,
          displayName: request.displayName,
          role: request.role.toUpperCase() as any,
          status: 'active',
        } as any);

        // Update request status
        request.status = 'approved';
        request.approvedBy = adminId;
        request.approvedAt = new Date();
        await request.save();

        // Delete the request after successful approval
        await request.destroy();

        approved.push(requestId);
      } catch (error) {
        failed.push({
          requestId,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      approved: approved.length,
      failed,
    };
  }

  /**
   * Reject registration requests (bulk)
   */
  async rejectRequests(data: RejectRequestDto, adminId: string): Promise<{
    rejected: number;
    failed: Array<{ requestId: string; reason: string }>;
  }> {
    const { requestIds, reason } = data;
    const rejected: string[] = [];
    const failed: Array<{ requestId: string; reason: string }> = [];

    for (const requestId of requestIds) {
      try {
        const request = await UserRegistrationRequest.findByPk(requestId);
        
        if (!request) {
          failed.push({ requestId, reason: 'Request not found' });
          continue;
        }

        if (request.status !== 'pending') {
          failed.push({ requestId, reason: `Request already ${request.status}` });
          continue;
        }

        // Update request status before deletion (for audit trail if needed)
        request.status = 'rejected';
        request.rejectedBy = adminId;
        request.rejectedAt = new Date();
        request.rejectionReason = reason;
        await request.save();

        // Delete the rejected request
        await request.destroy();

        rejected.push(requestId);
      } catch (error) {
        failed.push({
          requestId,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      rejected: rejected.length,
      failed,
    };
  }

  /**
   * Import users from CSV (bulk)
   */
  async importUsersFromCSV(data: BulkUserImportDto, adminId: string): Promise<{
    imported: number;
    failed: Array<{ row: number; email: string; reason: string }>;
  }> {
    const { users } = data;
    const imported: number[] = [];
    const failed: Array<{ row: number; email: string; reason: string }> = [];

    for (let i = 0; i < users.length; i++) {
      const userData = users[i];
      const rowNumber = i + 2; // +2 because row 1 is header and arrays are 0-indexed

      try {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
          failed.push({ row: rowNumber, email: userData.email, reason: 'Invalid email format' });
          continue;
        }

        // Normalize and validate role (avoid Sequelize "isIn" validation errors)
        const rawRole = (userData.role ?? '').toString().trim();
        const normalizedRole = rawRole.toLowerCase();
        const allowedRoles = ['parent', 'advocate', 'teacher_therapist', 'admin', 'support'];
        if (!allowedRoles.includes(normalizedRole)) {
          failed.push({ row: rowNumber, email: userData.email, reason: `Invalid role: '${userData.role}'` });
          continue;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email: userData.email } });
        if (existingUser) {
          failed.push({ row: rowNumber, email: userData.email, reason: 'Email already registered' });
          continue;
        }

        // Password is required - no auto-generation
        const finalPassword = userData.password?.toString().trim();
        if (!finalPassword) {
          failed.push({ row: rowNumber, email: userData.email, reason: 'Password is required' });
          continue;
        }
        
        // Use provided password or generate random one (COMMENTED OUT - password now required)
        // let finalPassword = userData.password?.toString().trim();
        // if (!finalPassword) {
        //   finalPassword = this.generateRandomPassword();
        // } else if (finalPassword.length < 8) {
        if (!isPasswordValid(finalPassword)) {
          failed.push({ row: rowNumber, email: userData.email, reason: PASSWORD_POLICY_MESSAGE });
          continue;
        }
        const passwordHash = await bcrypt.hash(finalPassword, SALT_ROUNDS);

        // Create user with active status (admin import bypasses approval)
        await User.create({
          email: userData.email.trim(),
          passwordHash,
          displayName: (userData.displayName ?? '').toString().trim(),
          role: normalizedRole.toUpperCase() as any,
          status: 'active',
        } as any);

        imported.push(rowNumber);

        // TODO: Send email with temporary password (implement email service)
      } catch (error) {
        failed.push({
          row: rowNumber,
          email: userData.email,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      imported: imported.length,
      failed,
    };
  }

  /**
   * Generate CSV template
   */
  generateCSVTemplate(): string {
    // Provide a parser-friendly template: header + example rows only.
    const lines = [
      'email,displayName,role,password',
      'parent@example.com,John Doe,parent,Password123!',
      'advocate@example.com,Jane Smith,advocate,SecurePass456#',
      'therapist@example.com,Sarah Therapist,teacher_therapist,MyPass789$',
      'support@example.com,Alex Support,support,Support321@',
      'admin@example.com,Admin User,admin,Admin999!',
    ];

    return lines.join('\n');
  }

  /**
   * Return metadata about CSV template so frontends can validate files
   */
  getCSVTemplateInfo() {
    return {
      headers: ['email', 'displayName', 'role', 'password'],
      required: ['email', 'displayName', 'role', 'password'],
      roles: ['parent', 'advocate', 'teacher_therapist', 'admin', 'support'],
      notes: `Role must be one of: parent, advocate, teacher_therapist, admin, or support. Password is REQUIRED and must be at least 8 characters, with at least one uppercase letter, one lowercase letter, and one number.`,
    };
  }

  /**
   * Helper: Convert User model to UserResponse
   */
  private toUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  /**
   * Helper: Convert UserRegistrationRequest to RegistrationRequestResponse
   */
  private toRequestResponse(request: UserRegistrationRequest): RegistrationRequestResponse {
    return {
      id: request.id,
      email: request.email,
      displayName: request.displayName,
      role: request.role,
      reason: request.reason,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
    };
  }

  /**
   * Helper: Generate simple password from name and email
   * Format: FirstName + Last3DigitsOfEmail + @
   * Example: John.doe@example.com + displayName "John Doe" = "John345@"
   */
  private generateSimplePassword(displayName: string, email: string): string {
    // Get first name from display name
    const firstName = displayName.trim().split(/\s+/)[0] || 'User';
    
    // Get last 3 characters before @ in email (digits if possible)
    const emailPart = email.split('@')[0];
    const digits = emailPart.match(/\d/g) || [];
    const last3Digits = digits.slice(-3).join('') || Math.floor(Math.random() * 900 + 100).toString();
    
    // Ensure we have exactly 3 digits
    const paddedDigits = last3Digits.padStart(3, '0').slice(-3);
    
    return `${firstName}${paddedDigits}@`;
  }

  /**
   * Helper: Generate random password for CSV imports
   */
  private generateRandomPassword(): string {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one of each required character type
    password += 'A'; // uppercase
    password += 'a'; // lowercase
    password += '0'; // number
    password += '!'; // special
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

export const userManagementService = new UserManagementService();
