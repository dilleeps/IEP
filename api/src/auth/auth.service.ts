import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from './user.model.js';
import { UserRegistrationRequest } from '../admin/userRegistrationRequest.model.js';
import { AppError } from '../../shared/errors/appError.js';
import {
  AuthResponse,
  RegisterDto,
  LoginDto,
  TokenPayload,
  ExchangeFirebaseTokenDto,
  ExchangeTokenResponse,
} from './auth.types.js';
import { ChildProfile } from '../child/child.model.js';
import { appenv } from '../../config/appenv.js';
import { getFirebaseAuth } from '../../config/firebase.js';
import { logger } from '../../config/logger.js';

/**
 * Decode a Firebase ID token without cryptographic verification.
 * ONLY use when FIREBASE_BYPASS_VERIFY=true (local dev).
 */
function decodeFirebaseTokenUnsafe(token: string): { email?: string; name?: string; sub?: string } {
  try {
    const [, payloadB64] = token.split('.');
    if (!payloadB64) throw new Error('Malformed JWT');
    const padded = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(padded, 'base64').toString('utf-8');
    return JSON.parse(json);
  } catch {
    throw new AppError('Invalid Firebase token (decode failed)', 401, 'INVALID_FIREBASE_TOKEN');
  }
}

export class AuthService {
  private readonly JWT_SECRET = (() => {
    const secret = appenv.get('JWT_SECRET');
    if (!secret || secret === 'default-secret-change-me') {
      throw new Error('JWT_SECRET environment variable must be set to a strong secret');
    }
    return secret;
  })();
  private readonly JWT_REFRESH_SECRET = appenv.get('JWT_REFRESH_SECRET') || appenv.get('JWT_SECRET') || (() => { throw new Error('JWT_REFRESH_SECRET or JWT_SECRET must be set'); })();
  private readonly JWT_EXPIRES_IN = appenv.get('JWT_EXPIRES_IN') || '24h';
  private readonly JWT_REFRESH_EXPIRES_IN = appenv.get('JWT_REFRESH_EXPIRES_IN') || '30d';
  private readonly SALT_ROUNDS = 10;

  /**
   * Register new parent user (auto-approved, can log in immediately)
   */
  async registerParent(data: Omit<RegisterDto, 'role'>): Promise<AuthResponse> {
    return this.registerUser(data, 'PARENT');
  }

  /**
   * Register new advocate user (pending approval)
   */
  async registerAdvocate(data: Omit<RegisterDto, 'role'>): Promise<{ message: string; requestId: string }> {
    return this.createRegistrationRequest(data, 'advocate');
  }

  /**
   * Register new teacher/therapist user (pending approval)
   */
  async registerTeacher(data: Omit<RegisterDto, 'role'>): Promise<{ message: string; requestId: string }> {
    return this.createRegistrationRequest(data, 'teacher');
  }

  /**
   * Create registration request for roles that need approval
   */
  private async createRegistrationRequest(
    data: Omit<RegisterDto, 'role'>,
    role: 'parent' | 'advocate' | 'teacher'
  ): Promise<{ message: string; requestId: string }> {
    const { email, password, displayName } = data;

    // Map role to uppercase enum values expected by the model
    const roleMap: Record<string, string> = {
      parent: 'PARENT',
      advocate: 'ADVOCATE',
      teacher: 'TEACHER_THERAPIST',
    };
    const mappedRole = roleMap[role];

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
    }

    // Check if pending request already exists
    const existingRequest = await UserRegistrationRequest.findOne({
      where: { email, status: 'pending' }
    });
    if (existingRequest) {
      throw new AppError('Registration request already pending approval', 409, 'REQUEST_PENDING');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Create registration request
    const request = await UserRegistrationRequest.create({
      email,
      passwordHash,
      displayName,
      role: mappedRole,
      status: 'pending',
    } as any);

    return {
      message: 'Registration request submitted. You will be notified once approved by an administrator.',
      requestId: request.id,
    };
  }

  /**
   * Internal method to register user with specified role
   * PARENT role is auto-approved, others need admin approval
   */
  private async registerUser(data: Omit<RegisterDto, 'role'>, role: 'PARENT' | 'ADVOCATE' | 'TEACHER_THERAPIST'): Promise<AuthResponse> {
    const { email, password, displayName } = data;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

    // PARENT role is auto-approved (active), others need approval (pending)
    const status = role === 'PARENT' ? 'active' : 'pending';

    // Create user
    const user = await User.create({
      email,
      passwordHash,
      displayName,
      role,
      status,
      provider: 'internal',
    } as any);

    // Generate tokens
    const token = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: this.toUserResponse(user),
      token,
      refreshToken,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginDto): Promise<AuthResponse> {
    const { email, password } = data;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    if (user.provider !== 'internal' || !user.passwordHash) {
      throw new AppError(
        'This account uses Google sign-in. Please continue with Google.',
        401,
        'OAUTH_LOGIN_REQUIRED'
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Check account status
    if (user.status === 'inactive') {
      throw new AppError('Account is inactive', 403, 'ACCOUNT_INACTIVE');
    }

    if (user.status === 'suspended') {
      throw new AppError('Account has been suspended', 403, 'ACCOUNT_SUSPENDED');
    }

    if (user.status === 'pending') {
      throw new AppError('Account pending approval', 403, 'ACCOUNT_PENDING_APPROVAL');
    }

    // Generate tokens
    const token = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    // Check if user has children — if not, they need onboarding
    const childCount = await ChildProfile.count({ where: { userId: user.id } });

    return {
      user: this.toUserResponse(user),
      token,
      refreshToken,
      needsOnboarding: childCount === 0,
    };
  }

  /**
   * Exchange Firebase ID token for app JWT
   */
  async exchangeFirebaseToken(firebaseToken: ExchangeFirebaseTokenDto['firebaseToken']): Promise<ExchangeTokenResponse> {
    if (!firebaseToken) {
      throw new AppError('Firebase token is required', 400, 'INVALID_FIREBASE_TOKEN');
    }

    const bypassVerify = appenv.get('FIREBASE_BYPASS_VERIFY') === 'true';

    let decodedToken: { email?: string; name?: string };
    if (bypassVerify) {
      logger.warn('⚠️  FIREBASE_BYPASS_VERIFY=true — skipping token verification (dev only)');
      decodedToken = decodeFirebaseTokenUnsafe(firebaseToken);
    } else {
      try {
        decodedToken = await getFirebaseAuth().verifyIdToken(firebaseToken);
      } catch (error: any) {
        if (
          error instanceof Error &&
          (error.message?.includes('Firebase not initialized') ||
            error.message?.includes('FIREBASE_SERVICE_ACCOUNT_JSON'))
        ) {
          throw new AppError('Authentication provider not configured', 500, 'FIREBASE_NOT_CONFIGURED');
        }

        throw new AppError('Invalid Firebase token', 401, 'INVALID_FIREBASE_TOKEN');
      }
    }

    const { email, name } = decodedToken;

    if (!email) {
      throw new AppError('Email not found in Firebase token', 400, 'MISSING_EMAIL');
    }

    let user = await User.findOne({ where: { email } });
    let isNewUser = false;
    let requiresSetup = false;

    if (user) {
      if (user.provider === 'internal') {
        throw new AppError(
          'This email is registered with password. Please sign in with email and password.',
          409,
          'EMAIL_EXISTS_WITH_PASSWORD'
        );
      }

      await user.update({ lastLoginAt: new Date() });
    } else {
      isNewUser = true;
      requiresSetup = true;

      user = await User.create({
        email,
        displayName: name || email.split('@')[0],
        passwordHash: null,
        role: 'PARENT',
        status: 'active',
        provider: 'google',
        approvedAt: new Date(),
        lastLoginAt: new Date(),
      } as any);
    }

    if (user.status === 'inactive') {
      throw new AppError('Account is inactive', 403, 'ACCOUNT_INACTIVE');
    }

    if (user.status === 'suspended') {
      throw new AppError('Account has been suspended', 403, 'ACCOUNT_SUSPENDED');
    }

    if (user.status === 'pending') {
      throw new AppError('Account pending approval', 403, 'ACCOUNT_PENDING_APPROVAL');
    }

    const token = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Check if user has children — if not, they need onboarding
    const childCount = await ChildProfile.count({ where: { userId: user.id } });

    return {
      user: this.toUserResponse(user),
      token,
      refreshToken,
      isNewUser,
      requiresSetup,
      needsOnboarding: childCount === 0,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ token: string }> {
    try {
      const payload = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as TokenPayload;
      
      // Find user
      const user = await User.findByPk(payload.sub);
      if (!user || user.status !== 'active') {
        throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
      }

      // Generate new access token
      const token = this.generateAccessToken(user);
      
      return { token };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
      }
      throw error;
    }
  }

  /**
   * Verify password for profile updates
   */
  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (!user.passwordHash) {
      throw new AppError('Password not set for this account', 400, 'PASSWORD_NOT_SET');
    }

    return bcrypt.compare(password, user.passwordHash);
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (!user.passwordHash) {
      throw new AppError('Password not set for this account', 400, 'PASSWORD_NOT_SET');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new AppError('Invalid current password', 401, 'INVALID_PASSWORD');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    
    // Update password
    await user.update({ passwordHash });
  }

  /**
   * Generate access token (short-lived)
   */
  private generateAccessToken(user: any): string {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      isApproved: user.approvedAt !== null,
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token (long-lived)
   */
  private generateRefreshToken(user: any): string {
    const payload = {
      sub: user.id,
      type: 'refresh',
    };

    return jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * Transform user model to response format
   */
  private toUserResponse(user: any) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      provider: user.provider,
      // Derived fields for frontend convenience
      isApproved: user.status !== 'pending',
      isActive: user.status === 'active',
    };
  }
}
