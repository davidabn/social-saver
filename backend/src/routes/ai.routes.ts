import { Router } from 'express'
import { getPersona, updatePersona, generateContent } from '../controllers/ai.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = Router()

router.use(authMiddleware)

router.get('/persona', getPersona)
router.post('/persona', updatePersona)
router.post('/generate', generateContent)

export default router
