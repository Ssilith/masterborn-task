import { NextFunction, Request, Response } from "express";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class ValidationError extends HttpError {
  constructor(errors: string[]) {
    super(400, "Validation failed", errors);
    this.name = "ValidationError";
  }
}

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof HttpError) {
    res
      .status(err.status)
      .json({
        message: err.message,
        ...(err.details !== undefined ? { errors: err.details } : {}),
      });
    return;
  }
  res.status(500).json({ message: "Internal server error" });
};
