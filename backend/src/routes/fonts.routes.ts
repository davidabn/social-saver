import { Router } from 'express'
import multer from 'multer'
import { uploadFont, listFonts, deleteFont } from '../controllers/fonts.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = Router()

// Configurar multer para upload em memória
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
})

// Todas as rotas requerem autenticação
router.use(authMiddleware)

// POST /api/fonts/upload - Upload de nova fonte
router.post('/upload', upload.single('font'), uploadFont)

// GET /api/fonts - Listar fontes do usuário
router.get('/', listFonts)

// DELETE /api/fonts/:id - Deletar fonte
router.delete('/:id', deleteFont)

export default router
