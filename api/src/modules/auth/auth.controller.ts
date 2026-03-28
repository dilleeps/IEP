import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate.js';
import { AuthService } from './auth.service.js';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Register new parent (auto-approved)
   * POST /api/v1/auth/register/parent
   */
  registerParent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.registerParent(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Register new advocate (pending approval)
   * POST /api/v1/auth/register/advocate
   */
  registerAdvocate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.registerAdvocate(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Register new teacher/therapist (pending approval)
   * POST /api/v1/auth/register/teacher
   */
  registerTeacher = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.registerTeacher(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.login(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Exchange Firebase token for JWT
   * POST /api/v1/auth/exchange-token
   */
  exchangeFirebaseToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.exchangeFirebaseToken(req.body.firebaseToken);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.refreshAccessToken(req.body.refreshToken);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logout (client-side token deletion)
   * POST /api/v1/auth/logout
   */
  logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // In a real implementation, you might want to blacklist the token
      // For now, we just return success and let client delete the token
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get current user profile
   * GET /api/v1/auth/me
   */
  me = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      res.json({
        user: req.user,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Change password
   * POST /api/v1/auth/change-password
   */
  changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.authService.changePassword(
        req.user!.id,
        req.body.currentPassword,
        req.body.newPassword
      );
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  };
}
