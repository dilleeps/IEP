import type { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger.js";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const statusCode = err?.statusCode ?? 500;
  const logPayload = {
    traceId: (req as any).traceId,
    err: { message: err?.message, stack: err?.stack },
  };

  if (statusCode >= 500) {
    logger.error('request failed', logPayload);
  } else {
    logger.warn('request failed', logPayload);
  }

  const response: any = {
    error: err?.message ?? "Internal Server Error",
    traceId: (req as any).traceId,
  };

  // Add error code if present
  if (err?.code) {
    response.code = err.code;
  }

  // Add additional details if present (e.g., for duplicate document errors)
  if (err?.details) {
    response.details = err.details;
  }

  res.status(err?.statusCode ?? 500).json(response);
}
