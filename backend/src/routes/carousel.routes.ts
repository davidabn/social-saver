import { Router } from 'express'
import {
  generateSlides,
  searchImages,
  searchImagesForSlide,
  generateSlidesWithImages,
  parseScriptWithAI
} from '../controllers/carousel.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = Router()

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

export default router
