import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validateBody } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { authRateLimit } from '../middleware/rateLimit.js';
import { registerSchema, registerParentSchema, registerAdvocateSchema, registerTeacherSchema, loginSchema, refreshTokenSchema, changePasswordSchema, exchangeFirebaseTokenSchema } from './auth.validation.js';

export const authRouter = Router();
const controller = new AuthController();

// Public routes (with rate limiting)
// Parent registration (auto-approved)
authRouter.post(
  '/register/parent',
  authRateLimit,
  validateBody(registerParentSchema),
  controller.registerParent
);

// Advocate registration (pending approval)
authRouter.post(
  '/register/advocate',
  authRateLimit,
  validateBody(registerAdvocateSchema),
  controller.registerAdvocate
);

// Teacher/Therapist registration (pending approval)
authRouter.post(
  '/register/teacher',
  authRateLimit,
  validateBody(registerTeacherSchema),
  controller.registerTeacher
);

authRouter.post(
  '/login',
  authRateLimit,
  validateBody(loginSchema),
  controller.login
);

authRouter.post(
  '/exchange-token',
  authRateLimit,
  validateBody(exchangeFirebaseTokenSchema),
  controller.exchangeFirebaseToken
);

authRouter.post(
  '/refresh',
  validateBody(refreshTokenSchema),
  controller.refresh
);

// Protected routes
authRouter.post(
  '/logout',
  authenticate,
  controller.logout
);

authRouter.get(
  '/me',
  authenticate,
  controller.me
);

authRouter.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  controller.changePassword
);
