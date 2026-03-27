export class AppError extends Error {
  public details?: any;
  
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    details?: any,
  ) {
    super(message);
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409, "CONFLICT");
  }
}
