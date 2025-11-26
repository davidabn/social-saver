import { Router } from 'express';
import { listContents, getContent, createContent, deleteContent } from '../controllers/contents.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
const router = Router();
// All routes require authentication
router.use(authMiddleware);
// GET /api/contents - List all contents for the user
router.get('/', listContents);
// GET /api/contents/:id - Get a specific content with transcription
router.get('/:id', getContent);
// POST /api/contents - Create new content (save Instagram URL)
router.post('/', createContent);
// DELETE /api/contents/:id - Delete a content
router.delete('/:id', deleteContent);
export default router;
//# sourceMappingURL=contents.routes.js.map