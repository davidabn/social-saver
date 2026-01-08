import type { Response, NextFunction } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest, Persona } from '../types/index.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { AppError } from '../middleware/errorHandler.js'
import { perplexityService } from '../services/perplexity.service.js'
import { kieService } from '../services/kie.service.js'
import { uploadToCloudinary } from '../services/cloudinary.service.js'
import { IMAGE_PROMPT_ENGINEER_SYSTEM } from '../prompts/image-prompt-engineer.js'
import { HAND_DRAWN_IMAGE_PROMPT_SYSTEM } from '../prompts/hand-drawn-prompt.js'
import OpenAI from 'openai'

// Schemas
const generateSlidesSchema = z.object({
  topic: z.string().min(1),
  slideCount: z.number().int().min(3).max(10).default(5),
  contentId: z.string().uuid().optional() // Optional: use saved content as base
})

const searchImagesSchema = z.object({
  query: z.string().min(1),
  count: z.number().int().min(1).max(10).default(5)
})

const searchImagesForSlideSchema = z.object({
  headline: z.string().min(1),
  body: z.string().optional(),
  theme: z.string().min(1)
})

const parseScriptSchema = z.object({
  script: z.string().min(1),
  slideCount: z.number().int().min(1).max(20).optional()
})

const generateImagePromptsSchema = z.object({
  slides: z.array(z.object({
    headline: z.string(),
    body: z.string()
  })),
  theme: z.string().min(1),
  templateId: z.string().optional()  // Para selecionar system prompt específico
})

const generateAIImagesSchema = z.object({
  prompts: z.array(z.object({
    slideIndex: z.number().int().min(0),
    prompt: z.string().min(1)
  })),
  templateId: z.string().optional()  // Para selecionar modelo de imagem
})

// Initialize OpenAI
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

// POST /api/carousel/generate-slides
export async function generateSlides(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) throw new AppError('User not authenticated', 401)

    if (!openai) throw new AppError('OpenAI API key not configured', 500)

    const { topic, slideCount, contentId } = generateSlidesSchema.parse(req.body)

    // Get persona for styling
    const userMetadata = req.user?.user_metadata
    const persona = userMetadata?.persona as Persona | undefined

    // If contentId provided, fetch transcription as additional context
    let additionalContext = ''
    if (contentId) {
      const { data: content } = await supabaseAdmin
        .from('saved_contents')
        .select(`
          caption,
          transcription:transcriptions(full_text)
        `)
        .eq('id', contentId)
        .eq('user_id', userId)
        .single()

      if (content) {
        const transcription = Array.isArray(content.transcription)
          ? (content.transcription[0] as any)?.full_text
          : (content.transcription as any)?.full_text

        additionalContext = transcription || content.caption || ''
      }
    }

    const systemPrompt = `You are an expert carousel designer for social media.
Create engaging carousel slides that tell a story and keep viewers swiping.

${persona ? `
User Persona:
- Niche: ${persona.niche}
- Target Audience: ${persona.targetAudience}
- Tone of Voice: ${persona.toneOfVoice}
${persona.contentPillars ? `- Content Pillars: ${persona.contentPillars}` : ''}
` : ''}

Guidelines:
- First slide should be a strong hook/headline to grab attention
- Each slide should have a clear headline (max 10 words) and body text (max 30 words)
- Build curiosity and maintain flow between slides
- Last slide should have a call to action
- Make content scannable and impactful`

    const userPrompt = `Create ${slideCount} carousel slides about: "${topic}"

${additionalContext ? `Additional context/reference:\n${additionalContext.substring(0, 1500)}\n\n` : ''}

Return ONLY a JSON array with the slides. Each slide object should have:
- slideNumber: number (1 to ${slideCount})
- headline: string (short, impactful headline)
- body: string (supporting text)
- imageSearchQuery: string (search query to find a relevant image for this slide)

Return ONLY the JSON array, no other text.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const content = response.choices[0]?.message?.content || '[]'

    // Parse the response
    try {
      let cleanContent = content.trim()
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7)
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3)
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3)
      }
      cleanContent = cleanContent.trim()

      const slides = JSON.parse(cleanContent)

      res.json({ slides })
    } catch (parseError) {
      console.error('[Carousel] Failed to parse slides:', content)
      throw new AppError('Failed to generate slides', 500)
    }
  } catch (error) {
    next(error)
  }
}

// POST /api/carousel/search-images
export async function searchImages(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) throw new AppError('User not authenticated', 401)

    const { query, count } = searchImagesSchema.parse(req.body)

    console.log(`[Carousel] Searching images for: "${query}"`)

    const images = await perplexityService.searchImages(query, count)

    res.json({ images })
  } catch (error) {
    next(error)
  }
}

// POST /api/carousel/search-images-for-slide
export async function searchImagesForSlide(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) throw new AppError('User not authenticated', 401)

    const { headline, body, theme } = searchImagesForSlideSchema.parse(req.body)

    console.log(`[Carousel] Searching images for slide: "${headline}"`)

    const images = await perplexityService.searchImagesForSlide(headline, body || '', theme)

    res.json({ images })
  } catch (error) {
    next(error)
  }
}

// POST /api/carousel/generate-slides-with-images
// Combined endpoint that generates slides AND fetches images in one call
export async function generateSlidesWithImages(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) throw new AppError('User not authenticated', 401)

    if (!openai) throw new AppError('OpenAI API key not configured', 500)

    const { topic, slideCount, contentId } = generateSlidesSchema.parse(req.body)

    // Get persona for styling
    const userMetadata = req.user?.user_metadata
    const persona = userMetadata?.persona as Persona | undefined

    // If contentId provided, fetch transcription as additional context
    let additionalContext = ''
    if (contentId) {
      const { data: content } = await supabaseAdmin
        .from('saved_contents')
        .select(`
          caption,
          transcription:transcriptions(full_text)
        `)
        .eq('id', contentId)
        .eq('user_id', userId)
        .single()

      if (content) {
        const transcription = Array.isArray(content.transcription)
          ? (content.transcription[0] as any)?.full_text
          : (content.transcription as any)?.full_text

        additionalContext = transcription || content.caption || ''
      }
    }

    const systemPrompt = `You are an expert carousel designer for social media.
Create engaging carousel slides that tell a story and keep viewers swiping.

${persona ? `
User Persona:
- Niche: ${persona.niche}
- Target Audience: ${persona.targetAudience}
- Tone of Voice: ${persona.toneOfVoice}
${persona.contentPillars ? `- Content Pillars: ${persona.contentPillars}` : ''}
` : ''}

Guidelines:
- First slide should be a strong hook/headline to grab attention
- Each slide should have a clear headline (max 10 words) and body text (max 30 words)
- Build curiosity and maintain flow between slides
- Last slide should have a call to action
- Make content scannable and impactful`

    const userPrompt = `Create ${slideCount} carousel slides about: "${topic}"

${additionalContext ? `Additional context/reference:\n${additionalContext.substring(0, 1500)}\n\n` : ''}

Return ONLY a JSON array with the slides. Each slide object should have:
- slideNumber: number (1 to ${slideCount})
- headline: string (short, impactful headline)
- body: string (supporting text)
- imageSearchQuery: string (2-4 word search query to find a relevant background image)

Return ONLY the JSON array, no other text.`

    console.log(`[Carousel] Generating ${slideCount} slides for topic: "${topic}"`)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const content = response.choices[0]?.message?.content || '[]'

    // Parse the response
    let slides: Array<{
      slideNumber: number
      headline: string
      body: string
      imageSearchQuery: string
      imageUrl?: string
    }> = []

    try {
      let cleanContent = content.trim()
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7)
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3)
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3)
      }
      cleanContent = cleanContent.trim()

      slides = JSON.parse(cleanContent)
    } catch (parseError) {
      console.error('[Carousel] Failed to parse slides:', content)
      throw new AppError('Failed to generate slides', 500)
    }

    console.log(`[Carousel] Generated ${slides.length} slides, now fetching images...`)

    // Fetch images for each slide in parallel
    const slidesWithImages = await Promise.all(
      slides.map(async (slide) => {
        try {
          const searchQuery = `${topic} ${slide.imageSearchQuery}`.substring(0, 60)
          const images = await perplexityService.searchImages(searchQuery, 1)
          return {
            ...slide,
            imageUrl: images[0]?.url || null
          }
        } catch (error) {
          console.error(`[Carousel] Failed to fetch image for slide ${slide.slideNumber}:`, error)
          return {
            ...slide,
            imageUrl: null
          }
        }
      })
    )

    console.log(`[Carousel] Completed generating slides with images`)

    res.json({ slides: slidesWithImages })
  } catch (error) {
    next(error)
  }
}

// POST /api/carousel/parse-script
// Uses AI to intelligently parse any script format into structured slides
export async function parseScriptWithAI(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) throw new AppError('User not authenticated', 401)

    if (!openai) throw new AppError('OpenAI API key not configured', 500)

    const { script, slideCount } = parseScriptSchema.parse(req.body)

    console.log(`[Carousel] Parsing script with AI (${script.length} chars)`)

    const systemPrompt = `You are an expert at analyzing and parsing carousel scripts for social media.
Your task is to extract the structured content from any format of script text.

Guidelines:
- Identify slide separations (could be numbered, marked with headers, or separated by context)
- For each slide, extract:
  - headline: The main title/hook (short, impactful - max 10 words)
  - body: The supporting text/explanation (can be longer)
- The first slide is usually a hook/cover
- The last slide often has a call to action
- If text has bullet points or lists, keep them as body text
- If a section only has a short phrase, use it as headline with empty body
- Preserve line breaks in body text using \\n`

    const userPrompt = `Parse this carousel script and extract the slides:

---
${script}
---

${slideCount ? `The user expects approximately ${slideCount} slides.` : 'Determine the appropriate number of slides based on the content.'}

Return ONLY a JSON array with the slides. Each slide object should have:
- slideNumber: number (starting from 1)
- headline: string (the main title/hook for this slide)
- body: string (supporting text, can include \\n for line breaks)
- imageSearchQuery: string (2-4 word query to find a relevant image)

Important:
- Extract ALL content from the script - don't summarize or skip parts
- Preserve the original meaning and wording as much as possible
- If you can't clearly identify slides, split by logical content sections

Return ONLY the JSON array, no other text.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, // Lower temperature for more consistent parsing
      max_tokens: 4000
    })

    const content = response.choices[0]?.message?.content || '[]'

    // Parse the response
    try {
      let cleanContent = content.trim()
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7)
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3)
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3)
      }
      cleanContent = cleanContent.trim()

      const slides = JSON.parse(cleanContent)

      console.log(`[Carousel] AI parsed ${slides.length} slides from script`)

      res.json({ slides })
    } catch (parseError) {
      console.error('[Carousel] Failed to parse AI response:', content)
      throw new AppError('Failed to parse script with AI', 500)
    }
  } catch (error) {
    next(error)
  }
}

// POST /api/carousel/upload-image
// Upload image to Cloudinary
export async function uploadImage(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) throw new AppError('User not authenticated', 401)

    const file = req.file
    if (!file) throw new AppError('No file uploaded', 400)

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.mimetype)) {
      throw new AppError('Invalid file type. Only JPEG, PNG, and WebP are allowed', 400)
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      throw new AppError('File too large. Maximum size is 10MB', 400)
    }

    console.log(`[Carousel] Uploading image to Cloudinary: ${file.originalname} (${file.size} bytes)`)

    // Upload to Cloudinary
    // Organize by user_id: `carousels/{userId}`
    const folder = `carousels/${userId}`
    const imageUrl = await uploadToCloudinary(file.buffer, folder)

    console.log(`[Carousel] Image uploaded successfully: ${imageUrl}`)

    res.json({ url: imageUrl })
  } catch (error) {
    next(error)
  }
}

// POST /api/carousel/generate-image-prompts
// Uses GPT-4o with Elite Prompt Engineer to create high-quality image generation prompts
export async function generateImagePrompts(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) throw new AppError('User not authenticated', 401)

    if (!openai) throw new AppError('OpenAI API key not configured', 500)

    const { slides, theme, templateId } = generateImagePromptsSchema.parse(req.body)

    // Selecionar system prompt baseado no template
    const systemPrompt = templateId === 'hand-drawn'
      ? HAND_DRAWN_IMAGE_PROMPT_SYSTEM
      : IMAGE_PROMPT_ENGINEER_SYSTEM

    console.log(`[Carousel] Generating elite image prompts for ${slides.length} slides, theme: "${theme}", template: "${templateId || 'default'}"`)

    // Formatar o script do carrossel de forma estruturada para o assistente elite
    const slidesDescription = slides.map((slide, index) =>
      `**SLIDE ${index + 1}:**
- Título/Headline: "${slide.headline}"
- Texto/Body: "${slide.body}"`
    ).join('\n\n')

    const userPrompt = `## Script do Carrossel

**Tema/Tópico:** ${theme}
**Total de Slides:** ${slides.length}

### Conteúdo dos Slides:

${slidesDescription}

---

Analise este carrossel estrategicamente e gere prompts de imagem otimizados para cada slide.

REQUISITOS TÉCNICOS:
1. Os prompts devem ser em INGLÊS
2. NÃO inclua texto, palavras ou tipografia nas imagens
3. Formato da imagem: 4:5 vertical (Instagram carousel)
4. Mantenha coesão visual entre todos os slides
5. Use terminologia técnica de fotografia/cinema

FORMATO DE RESPOSTA:
Retorne APENAS um JSON array com os prompts, sem texto adicional:
[
  { "slideIndex": 0, "prompt": "detailed technical prompt in English..." },
  { "slideIndex": 1, "prompt": "detailed technical prompt in English..." }
]

IMPORTANTE: Retorne APENAS o JSON array, nenhum outro texto ou análise.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    })

    const content = response.choices[0]?.message?.content || '[]'

    try {
      let cleanContent = content.trim()

      // Remove markdown code blocks se presentes
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7)
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3)
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3)
      }
      cleanContent = cleanContent.trim()

      // Tenta encontrar o JSON array se houver texto antes
      const jsonMatch = cleanContent.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        cleanContent = jsonMatch[0]
      }

      const prompts = JSON.parse(cleanContent)

      console.log(`[Carousel] Generated ${prompts.length} elite image prompts`)

      res.json({ prompts })
    } catch (parseError) {
      console.error('[Carousel] Failed to parse prompts:', content)
      throw new AppError('Failed to generate image prompts', 500)
    }
  } catch (error) {
    next(error)
  }
}

// POST /api/carousel/generate-ai-images
// Sends prompts to Kie.ai (Flux 2 Pro or GPT Image 1.5) and returns generated image URLs
export async function generateAIImages(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) throw new AppError('User not authenticated', 401)

    const { prompts, templateId } = generateAIImagesSchema.parse(req.body)

    // Selecionar modelo baseado no template
    const model = templateId === 'hand-drawn'
      ? 'gpt-image/1.5-text-to-image' as const
      : 'flux-2/pro-text-to-image' as const

    console.log(`[Carousel] Generating ${prompts.length} AI images via Kie.ai with model "${model}"...`)

    // Generate all images in parallel
    const imagePromises = prompts.map(async ({ slideIndex, prompt }) => {
      try {
        console.log(`[Carousel] Generating image for slide ${slideIndex}...`)
        const imageUrl = await kieService.generateImage(prompt, { model })
        return { slideIndex, imageUrl, error: null }
      } catch (error) {
        console.error(`[Carousel] Failed to generate image for slide ${slideIndex}:`, error)
        return { slideIndex, imageUrl: null, error: (error as Error).message }
      }
    })

    const results = await Promise.all(imagePromises)

    // Build response
    const images = results
      .filter(r => r.imageUrl !== null)
      .map(r => ({ slideIndex: r.slideIndex, imageUrl: r.imageUrl as string }))

    const errors = results
      .filter(r => r.error !== null)
      .map(r => ({ slideIndex: r.slideIndex, error: r.error as string }))

    const successCount = images.length
    const errorCount = errors.length

    console.log(`[Carousel] AI image generation complete: ${successCount} success, ${errorCount} failed`)

    res.json({ images, errors, successCount, errorCount })
  } catch (error) {
    next(error)
  }
}

// ===============================================
// CRUD para persistência de carrosseis
// ===============================================

const saveCarouselSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).default('Sem título'),
  data: z.object({
    design: z.any(),
    headerTexts: z.any(),
    templateId: z.string().nullable(),
    customPalette: z.any()
  })
})

// POST /api/carousel/save - Criar ou atualizar carrossel
export async function saveCarousel(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) throw new AppError('User not authenticated', 401)

    const { id, name, data } = saveCarouselSchema.parse(req.body)

    console.log(`[Carousel] Saving carousel for user ${userId}, id: ${id || 'new'}`)

    let result

    if (id) {
      // Update existing carousel
      const { data: carousel, error } = await supabaseAdmin
        .from('carousels')
        .update({ name, data })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('[Carousel] Update error:', error)
        throw new AppError('Failed to update carousel', 500)
      }

      result = carousel
    } else {
      // Create new carousel
      const { data: carousel, error } = await supabaseAdmin
        .from('carousels')
        .insert({ user_id: userId, name, data })
        .select()
        .single()

      if (error) {
        console.error('[Carousel] Insert error:', error)
        throw new AppError('Failed to create carousel', 500)
      }

      result = carousel
    }

    console.log(`[Carousel] Carousel saved successfully: ${result.id}`)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

// GET /api/carousel/list - Listar carrosseis do usuário
export async function listCarousels(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) throw new AppError('User not authenticated', 401)

    console.log(`[Carousel] Listing carousels for user ${userId}`)

    const { data: carousels, error } = await supabaseAdmin
      .from('carousels')
      .select('id, name, updated_at, created_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[Carousel] List error:', error)
      throw new AppError('Failed to list carousels', 500)
    }

    console.log(`[Carousel] Found ${carousels?.length || 0} carousels`)
    res.json(carousels || [])
  } catch (error) {
    next(error)
  }
}

// GET /api/carousel/:id - Buscar carrossel por ID
export async function getCarousel(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) throw new AppError('User not authenticated', 401)

    const { id } = req.params
    if (!id) throw new AppError('Carousel ID required', 400)

    console.log(`[Carousel] Getting carousel ${id} for user ${userId}`)

    const { data: carousel, error } = await supabaseAdmin
      .from('carousels')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !carousel) {
      console.error('[Carousel] Get error:', error)
      throw new AppError('Carousel not found', 404)
    }

    console.log(`[Carousel] Found carousel: ${carousel.name}`)
    res.json(carousel)
  } catch (error) {
    next(error)
  }
}

// DELETE /api/carousel/:id - Deletar carrossel
export async function deleteCarousel(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) throw new AppError('User not authenticated', 401)

    const { id } = req.params
    if (!id) throw new AppError('Carousel ID required', 400)

    console.log(`[Carousel] Deleting carousel ${id} for user ${userId}`)

    const { error } = await supabaseAdmin
      .from('carousels')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('[Carousel] Delete error:', error)
      throw new AppError('Failed to delete carousel', 500)
    }

    console.log(`[Carousel] Carousel deleted successfully`)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}
