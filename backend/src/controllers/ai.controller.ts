import type { Response, NextFunction } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest, Persona, GenerateContentInput } from '../types/index.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { AppError } from '../middleware/errorHandler.js'
import { aiService } from '../services/ai.service.js'

const personaSchema = z.object({
  niche: z.string().min(1),
  targetAudience: z.string().min(1),
  toneOfVoice: z.string().min(1),
  contentPillars: z.string().optional(),
  additionalContext: z.string().optional(),
  // Profile branding fields
  displayName: z.string().optional(),
  username: z.string().optional(),
  avatarUrl: z.string().optional(),
  isVerified: z.boolean().optional(),
})

const generateContentSchema = z.object({
  contentId: z.string().uuid(),
  type: z.enum(['reel', 'post', 'carousel']),
  instructions: z.string().optional(),
})

export async function getPersona(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userMetadata = req.user?.user_metadata
    const persona = userMetadata?.persona as Persona | undefined

    res.json(persona || null)
  } catch (error) {
    next(error)
  }
}

export async function updatePersona(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError('User not authenticated', 401)
    }

    const persona = personaSchema.parse(req.body)

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...req.user?.user_metadata,
        persona,
      },
    })

    if (error) {
      throw new AppError('Failed to update persona', 500)
    }

    res.json(persona)
  } catch (error) {
    next(error)
  }
}

export async function generateContent(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError('User not authenticated', 401)
    }

    const userMetadata = req.user?.user_metadata
    const persona = userMetadata?.persona as Persona | undefined

    if (!persona) {
      throw new AppError('Persona not configured. Please set up your persona first.', 400)
    }

    const { contentId, type, instructions } = generateContentSchema.parse(req.body)

    // Fetch content
    const { data: content, error } = await supabaseAdmin
      .from('saved_contents')
      .select(`
        *,
        transcription:transcriptions(*)
      `)
      .eq('id', contentId)
      .eq('user_id', userId)
      .single()

    if (error || !content) {
      throw new AppError('Content not found', 404)
    }

    const transcription = Array.isArray(content.transcription)
      ? content.transcription[0]
      : content.transcription

    const generatedText = await aiService.generateContent(
      content,
      transcription,
      persona,
      type,
      instructions
    )

    // Save generated script to database
    await supabaseAdmin
      .from('saved_contents')
      .update({ generated_script: generatedText })
      .eq('id', contentId)

    res.json({ content: generatedText })
  } catch (error) {
    next(error)
  }
}
