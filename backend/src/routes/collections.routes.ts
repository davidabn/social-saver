import { Router } from 'express'
import {
  listCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection
} from '../controllers/collections.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = Router()

router.use(authMiddleware)

// GET /api/collections - List all collections
router.get('/', listCollections)

// GET /api/collections/:id - Get collection with contents
router.get('/:id', getCollection)

// POST /api/collections - Create new collection
router.post('/', createCollection)

// PUT /api/collections/:id - Update collection
router.put('/:id', updateCollection)

// DELETE /api/collections/:id - Delete collection
router.delete('/:id', deleteCollection)

export default router
