import type { Response, NextFunction } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest, Persona } from '../types/index.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { AppError } from '../middleware/errorHandler.js'
import { perplexityService } from '../services/perplexity.service.js'
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
          ? content.transcription[0]?.full_text
          : content.transcription?.full_text

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
          ? content.transcription[0]?.full_text
          : content.transcription?.full_text

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
// Upload image to Supabase Storage
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

    // Generate unique filename
    const ext = file.originalname.split('.').pop() || 'jpg'
    const filename = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

    console.log(`[Carousel] Uploading image: ${filename} (${file.size} bytes)`)

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('carousel-images')
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      })

    if (error) {
      console.error('[Carousel] Supabase upload error:', error)
      throw new AppError('Failed to upload image', 500)
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('carousel-images')
      .getPublicUrl(filename)

    console.log(`[Carousel] Image uploaded successfully: ${urlData.publicUrl}`)

    res.json({ url: urlData.publicUrl })
  } catch (error) {
    next(error)
  }
}
