import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../types/index.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { AppError } from './errorHandler.js'

export async function authMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Missing or invalid authorization header', 401)
    }

    const token = authHeader.split(' ')[1]

    if (!token) {
      throw new AppError('No token provided', 401)
    }

    // Verify the JWT with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      throw new AppError('Invalid or expired token', 401)
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email ?? '',
      user_metadata: user.user_metadata
    }

    next()
  } catch (error) {
    next(error)
  }
}
