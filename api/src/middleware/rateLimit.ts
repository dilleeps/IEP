import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication endpoints (login, register)
 * 5 requests per 15 minutes
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }, // Trust proxy is set to 1 in app.ts
});

/**
 * General API rate limiter
 * 200 requests per 15 minutes
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }, // Trust proxy is set to 1 in app.ts
});

/**
 * Rate limiter for AI endpoints
 * 20 requests per hour
 */
export const aiRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'AI rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }, // Trust proxy is set to 1 in app.ts
});

/**
 * Rate limiter for file uploads
 * 10 uploads per hour
 */
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Upload rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }, // Trust proxy is set to 1 in app.ts
});
