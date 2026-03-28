import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import { userManagementService } from './userManagement.service.js';
import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  displayName: z.string().min(1).max(255),
  role: z.enum(['parent', 'advocate', 'teacher_therapist', 'support', 'admin', 'counselor']),
  status: z.enum(['active', 'pending', 'inactive']).optional(),
});

const updateUserSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  role: z.enum(['parent', 'advocate', 'teacher_therapist', 'support', 'admin', 'counselor']).optional(),
  status: z.enum(['active', 'pending', 'inactive', 'suspended']).optional(),
});

const approveRequestsSchema = z.object({
  requestIds: z.array(z.string().uuid()).min(1),
});

const rejectRequestsSchema = z.object({
  requestIds: z.array(z.string().uuid()).min(1),
  reason: z.string().optional(),
});

const bulkDeleteSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1),
});

const bulkUpdateSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1),
  role: z.string().min(1).optional(),
  status: z.enum(['active', 'pending', 'inactive', 'suspended']).optional(),
});

const bulkImportSchema = z.object({
  users: z.array(z.object({
    email: z.string().email(),
    displayName: z.string().min(1).max(255),
    role: z.enum(['parent', 'advocate', 'teacher_therapist', 'support', 'admin', 'counselor']),
    password: passwordSchema,
  })).min(1),
});

export class UserManagementController {
  /**
   * GET /admin/users
   * Get all users with optional filters
   */
  async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role, status, search } = req.query;

      const users = await userManagementService.getAllUsers({
        role: role as string | undefined,
        status: status as string | undefined,
        search: search as string | undefined,
      });

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/users/stats
   * Get user statistics
   */
  async getUserStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await userManagementService.getUserStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/roles
   * Get available user roles
   */
  async getRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await userManagementService.getRoles();

      res.json({
        success: true,
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/users/:id
   * Get user by ID
   */
  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userManagementService.getUserById(id);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /admin/users
   * Create new user (direct admin creation)
   */
  async createUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.id;
      const dto = createUserSchema.parse(req.body);

      const user = await userManagementService.createUser(dto, adminId);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /admin/users/:id
   * Update user
   */
  async updateUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;
      const dto = updateUserSchema.parse(req.body);

      const user = await userManagementService.updateUser(id, dto, adminId);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /admin/users/:id
   * Delete user
   */
  async deleteUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;

      await userManagementService.deleteUser(id, adminId);

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/requests/pending
   * Get all pending registration requests
   */
  async getPendingRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requests = await userManagementService.getPendingRequests();

      res.json({
        success: true,
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /admin/requests/approve
   * Approve registration requests (bulk)
   */
  async approveRequests(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.id;
      const dto = approveRequestsSchema.parse(req.body);

      const result = await userManagementService.approveRequests(dto, adminId);

      res.json({
        success: true,
        message: `${result.approved} request(s) approved`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /admin/requests/reject
   * Reject registration requests (bulk)
   */
  async rejectRequests(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.id;
      const dto = rejectRequestsSchema.parse(req.body);

      const result = await userManagementService.rejectRequests(dto, adminId);

      res.json({
        success: true,
        message: `${result.rejected} request(s) rejected`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /admin/users/import/csv
   * Import users from CSV (bulk)
   */
  async importUsersFromCSV(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.id;
      const dto = bulkImportSchema.parse(req.body);

      const result = await userManagementService.importUsersFromCSV(dto, adminId);

      res.json({
        success: true,
        message: `${result.imported} user(s) imported`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /admin/users/delete
   * Bulk delete users by ID
   */
  async deleteUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.id;
      const dto = bulkDeleteSchema.parse(req.body);

      const result = await userManagementService.deleteUsers(dto.userIds, adminId);

      res.json({ success: true, message: `${result.deleted} user(s) deleted`, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /admin/users/bulk-update
   * Bulk update user roles and statuses
   */
  async bulkUpdateUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Normalize role and status to lowercase before validation
      const body = {
        ...req.body,
        role: req.body.role?.toLowerCase(),
        status: req.body.status?.toLowerCase(),
      };

      const dto = bulkUpdateSchema.parse(body);

      const result = await userManagementService.bulkUpdateUsers(
        dto.userIds,
        {
          role: dto.role,
          status: dto.status,
        },
        req.user!.id
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/users/import/template
   * Download CSV template
   */
  async downloadCSVTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const csvContent = userManagementService.generateCSVTemplate();

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="user_import_template.csv"');
      res.send(csvContent);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/users/import/template/info
   * Return CSV template metadata (headers, required fields, accepted values)
   */
  async getCSVTemplateInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const info = userManagementService.getCSVTemplateInfo();
      res.json({ success: true, data: info });
    } catch (error) {
      next(error);
    }
  }
}

export const userManagementController = new UserManagementController();
