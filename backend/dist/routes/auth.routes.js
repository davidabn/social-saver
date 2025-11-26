import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
const router = Router();
// GET /api/auth/me - Get current user info
router.get('/me', authMiddleware, (req, res) => {
    res.json({
        user: req.user
    });
});
export default router;
//# sourceMappingURL=auth.routes.js.map