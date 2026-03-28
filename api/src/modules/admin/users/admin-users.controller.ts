// src/modules/admin/users/admin-users.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../middleware/authenticate.js';
import { AdminUsersService } from './admin-users.service.js';
import {
  createUserSchema,
  updateUserSchema,
  listUsersSchema,
  changeStatusSchema,
  directRegisterSchema,
  registerAdminSchema,
  registerAdvocateSchema,
  registerTeacherSchema,
  registerParentSchema,
} from './admin-users.validation.js';

export class AdminUsersController {
  private service: AdminUsersService;

  constructor() {
    this.service = new AdminUsersService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const dto = createUserSchema.parse(req.body);
      const user = await this.service.create(dto);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const filters = listUsersSchema.parse(req.query);
      const users = await this.service.list(filters);
      res.json(users);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await this.service.getById(id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const dto = updateUserSchema.parse(req.body);
      const user = await this.service.update(id, dto);
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  changeStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status, reason } = changeStatusSchema.parse(req.body);
      const user = await this.service.changeStatus(id, status, reason);
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.service.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  getStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const stats = await this.service.getStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  };

  directRegister = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const dto = directRegisterSchema.parse(req.body);
      const user = await this.service.directRegister(dto, req.user!);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  };

  registerAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const dto = registerAdminSchema.parse(req.body);
      const user = await this.service.registerAdmin(dto, req.user!);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  };

  registerAdvocate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const dto = registerAdvocateSchema.parse(req.body);
      const user = await this.service.registerAdvocate(dto, req.user!);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  };

  registerTeacher = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const dto = registerTeacherSchema.parse(req.body);
      const user = await this.service.registerTeacher(dto, req.user!);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  };

  registerParent = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const dto = registerParentSchema.parse(req.body);
      const user = await this.service.registerParent(dto, req.user!);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  };
}
