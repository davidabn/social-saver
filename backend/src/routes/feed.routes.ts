import { Router } from 'express'
import { listProfiles, addProfile, deleteProfile, getFeed, refreshFeed, saveFeedItem } from '../controllers/feed.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = Router()

router.use(authMiddleware)

router.get('/profiles', listProfiles)
router.post('/profiles', addProfile)
router.delete('/profiles/:id', deleteProfile)

router.get('/', getFeed)
router.post('/refresh', refreshFeed)
router.post('/:id/save', saveFeedItem)

export default router
