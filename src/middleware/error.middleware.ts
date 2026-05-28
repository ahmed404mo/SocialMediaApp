import type { NextFunction, Request, Response } from "express";
interface IError extends Error {
  statusCode: number;
}

export const globalErrorHandler = async (
  error: IError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const status = error.statusCode || 500;
  return res.status(status).json({
    message: error.message || "internal server error ",
    error,
    cause: error.cause,
    stack: error.stack,
  });
};
