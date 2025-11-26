import type { Request, Response, NextFunction } from 'express'
import type { ApiError } from '../types/index.js'

export class AppError extends Error {
  statusCode: number
  isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error]', err)

  if (err instanceof AppError) {
    const response: ApiError = {
      error: err.name,
      message: err.message,
      statusCode: err.statusCode
    }
    res.status(err.statusCode).json(response)
    return
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    const response: ApiError = {
      error: 'ValidationError',
      message: 'Invalid request data',
      statusCode: 400
    }
    res.status(400).json(response)
    return
  }

  // Default error
  const response: ApiError = {
    error: 'InternalServerError',
    message: 'Something went wrong',
    statusCode: 500
  }
  res.status(500).json(response)
}

export function notFoundHandler(_req: Request, res: Response): void {
  const response: ApiError = {
    error: 'NotFound',
    message: 'Route not found',
    statusCode: 404
  }
  res.status(404).json(response)
}
