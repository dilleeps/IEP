import type { Request, Response, NextFunction } from "express";
import { context, trace } from "@opentelemetry/api";

export function requestContext(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const span = trace.getSpan(context.active());
  const traceId = span?.spanContext().traceId;

  // attach for loggers/controllers
  (req as any).traceId = traceId;
  next();
}
