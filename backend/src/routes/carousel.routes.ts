import { Router } from 'express'
import multer from 'multer'
import {
  generateSlides,
  searchImages,
  searchImagesForSlide,
  generateSlidesWithImages,
  parseScriptWithAI,
  uploadImage,
  generateImagePrompts,
  generateAIImages,
  saveCarousel,
  listCarousels,
  getCarousel,
  deleteCarousel,
  listUserImages,
  getStorageUsage
} from '../controllers/carousel.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = Router()

// Configure multer for memory storage (for Supabase upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit (Cloudinary Free Plan)
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed'))
    }
  }
})

router.use(authMiddleware)

// POST /api/carousel/generate-slides - Generate carousel slide content with AI
router.post('/generate-slides', generateSlides)

// POST /api/carousel/generate-slides-with-images - Generate slides AND fetch images in one call
router.post('/generate-slides-with-images', generateSlidesWithImages)

// POST /api/carousel/search-images - Search for images via Perplexity
router.post('/search-images', searchImages)

// POST /api/carousel/search-images-for-slide - Search images specific to a slide
router.post('/search-images-for-slide', searchImagesForSlide)

// POST /api/carousel/parse-script - Parse any script format using AI
router.post('/parse-script', parseScriptWithAI)

// POST /api/carousel/upload-image - Upload image to Supabase Storage
router.post('/upload-image', upload.single('image'), uploadImage)

// POST /api/carousel/generate-image-prompts - Generate prompts for AI images
router.post('/generate-image-prompts', generateImagePrompts)

// POST /api/carousel/generate-ai-images - Generate images via Kie.ai Flux 2 Pro
router.post('/generate-ai-images', generateAIImages)

// === CRUD para persistência de carrosseis ===

// POST /api/carousel/save - Criar ou atualizar carrossel
router.post('/save', saveCarousel)

// GET /api/carousel/images - Listar imagens do usuário (upload e geradas)
router.get('/images', listUserImages)

// GET /api/carousel/storage-usage - Consultar uso de armazenamento do Cloudinary
router.get('/storage-usage', getStorageUsage)

// GET /api/carousel/list - Listar carrosseis do usuário
router.get('/list', listCarousels)

// GET /api/carousel/:id - Buscar carrossel por ID
router.get('/:id', getCarousel)

// DELETE /api/carousel/:id - Deletar carrossel
router.delete('/:id', deleteCarousel)



export default router
