import { Router } from 'express';
import { handleWebhook, listWebhooks, createWebhook, deleteWebhook, regenerateWebhook } from '../controllers/webhook.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
const router = Router();
// Public route - authentication via token in URL
// POST /api/webhook/:token - Receive Instagram URL via webhook
router.post('/:token', handleWebhook);
// Protected routes - require JWT authentication
// GET /api/webhook - List user's webhooks
router.get('/', authMiddleware, listWebhooks);
// POST /api/webhook - Create new webhook (without token param, this is management)
router.post('/', authMiddleware, createWebhook);
// DELETE /api/webhook/:id - Delete webhook by ID
router.delete('/:id', authMiddleware, deleteWebhook);
// POST /api/webhook/:id/regenerate - Regenerate webhook token
router.post('/:id/regenerate', authMiddleware, regenerateWebhook);
export default router;
//# sourceMappingURL=webhook.routes.js.map