import { Router } from 'express'
import type { Response } from 'express'
import type { AuthenticatedRequest } from '../types/index.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = Router()

// GET /api/auth/me - Get current user info
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    user: req.user
  })
})

export default router
