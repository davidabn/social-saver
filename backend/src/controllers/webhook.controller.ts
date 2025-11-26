import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest, WebhookToken } from '../types/index.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { AppError } from '../middleware/errorHandler.js'
import { scrapeInstagramPost } from '../services/apify.service.js'
import { queueTranscription } from '../services/assemblyai.service.js'

// Validation schemas
const createWebhookSchema = z.object({
  name: z.string().min(1).max(100).default('Default')
})

// Helper to extract post ID from Instagram URL
function extractPostId(url: string): string {
  const match = url.match(/\/(p|reel|reels|tv)\/([\w-]+)/)
  return match?.[2] ?? ''
}

// Helper to clean Instagram URL (remove tracking params)
function cleanInstagramUrl(url: string): string {
  try {
    const urlObj = new URL(url.trim())
    // Keep only the path, remove query params
    return `${urlObj.origin}${urlObj.pathname}`
  } catch {
    return url.trim()
  }
}

// Helper to validate Instagram URL
function isValidInstagramUrl(url: string): boolean {
  const instagramRegex = /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|reel|reels|tv)\/[\w-]+/i
  return instagramRegex.test(url)
}

// Helper to extract URL from various body formats
function extractUrlFromBody(body: unknown): string | null {
  // Handle string body (text/plain)
  if (typeof body === 'string') {
    return body.trim()
  }

  // Handle object body (JSON)
  if (body && typeof body === 'object') {
    const obj = body as Record<string, unknown>
    // Try common field names
    if (typeof obj.url === 'string') return obj.url.trim()
    if (typeof obj.text === 'string') return obj.text.trim()
    if (typeof obj.link === 'string') return obj.link.trim()
    if (typeof obj.instagram_url === 'string') return obj.instagram_url.trim()
  }

  return null
}

// POST /api/webhook/:token - Public endpoint (auth via token)
export async function handleWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.params

    // 1. Find webhook by token
    const { data: webhook, error: webhookError } = await supabaseAdmin
      .from('webhook_tokens')
      .select('*')
      .eq('token', token)
      .eq('is_active', true)
      .single()

    if (webhookError || !webhook) {
      throw new AppError('Webhook not found or inactive', 404)
    }

    console.log(`[Webhook] Received request for user ${webhook.user_id}`)

    // 2. Extract URL from body
    const rawUrl = extractUrlFromBody(req.body)
    if (!rawUrl) {
      throw new AppError('No Instagram URL provided in request body', 400)
    }

    // 3. Clean URL (remove tracking params)
    const instagramUrl = cleanInstagramUrl(rawUrl)
    console.log(`[Webhook] Processing URL: ${instagramUrl}`)

    // 4. Validate Instagram URL
    if (!isValidInstagramUrl(instagramUrl)) {
      throw new AppError('Invalid Instagram URL. Must be a post, reel, or TV link.', 400)
    }

    // 5. Extract post ID
    const postId = extractPostId(instagramUrl)
    if (!postId) {
      throw new AppError('Could not extract post ID from URL', 400)
    }

    // 6. Check if content already exists for this user
    const { data: existing } = await supabaseAdmin
      .from('saved_contents')
      .select('id')
      .eq('user_id', webhook.user_id)
      .eq('post_id', postId)
      .single()

    if (existing) {
      // Return 200 OK for already saved (idempotent behavior)
      res.status(200).json({
        success: true,
        message: 'Content already saved',
        content_id: existing.id
      })
      return
    }

    console.log(`[Webhook] Scraping Instagram post: ${postId}`)

    // 7. Scrape Instagram post data
    const scrapedData = await scrapeInstagramPost(instagramUrl)

    // 8. Save content to database
    const { data: content, error: insertError } = await supabaseAdmin
      .from('saved_contents')
      .insert({
        user_id: webhook.user_id,
        instagram_url: instagramUrl,
        post_id: scrapedData.post_id || postId,
        content_type: scrapedData.content_type,
        author_username: scrapedData.author_username,
        author_name: scrapedData.author_name,
        author_profile_pic: scrapedData.author_profile_pic,
        author_verified: scrapedData.author_verified,
        caption: scrapedData.caption,
        thumbnail_url: scrapedData.thumbnail_url,
        video_url: scrapedData.video_url,
        image_urls: scrapedData.image_urls,
        likes_count: scrapedData.likes_count,
        comments_count: scrapedData.comments_count,
        views_count: scrapedData.views_count,
        plays_count: scrapedData.plays_count,
        posted_at: scrapedData.posted_at,
        is_processed: true,
        transcription_status: scrapedData.video_url ? 'pending' : 'completed'
      })
      .select()
      .single()

    if (insertError) {
      console.error('[Webhook] DB Error:', insertError)
      throw new AppError('Failed to save content', 500)
    }

    console.log(`[Webhook] Created content ${content.id} for user ${webhook.user_id}`)

    // 9. Queue transcription for videos
    if (scrapedData.video_url) {
      console.log(`[Webhook] Queueing transcription for content ${content.id}`)
      queueTranscription(content.id, scrapedData.video_url)
    }

    // 10. Update last_used_at
    await supabaseAdmin
      .from('webhook_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', webhook.id)

    res.status(201).json({
      success: true,
      message: 'Content saved successfully',
      content_id: content.id
    })
  } catch (error) {
    next(error)
  }
}

// GET /api/webhook - List user's webhooks (requires auth)
export async function listWebhooks(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { data: webhooks, error } = await supabaseAdmin
      .from('webhook_tokens')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Webhook] DB Error:', error)
      throw new AppError('Failed to fetch webhooks', 500)
    }

    res.json(webhooks || [])
  } catch (error) {
    next(error)
  }
}

// POST /api/webhook - Create new webhook (requires auth)
export async function createWebhook(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { name } = createWebhookSchema.parse(req.body)

    const { data: webhook, error } = await supabaseAdmin
      .from('webhook_tokens')
      .insert({
        user_id: userId,
        name
      })
      .select()
      .single()

    if (error) {
      console.error('[Webhook] DB Error:', error)
      throw new AppError('Failed to create webhook', 500)
    }

    console.log(`[Webhook] Created webhook ${webhook.id} for user ${userId}`)

    res.status(201).json(webhook)
  } catch (error) {
    next(error)
  }
}

// DELETE /api/webhook/:id - Delete webhook (requires auth)
export async function deleteWebhook(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('webhook_tokens')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('[Webhook] DB Error:', error)
      throw new AppError('Failed to delete webhook', 500)
    }

    console.log(`[Webhook] Deleted webhook ${id} for user ${userId}`)

    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

// POST /api/webhook/:id/regenerate - Regenerate webhook token (requires auth)
export async function regenerateWebhook(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { id } = req.params

    // Generate new UUID token using Supabase's gen_random_uuid()
    const { data: webhook, error } = await supabaseAdmin
      .from('webhook_tokens')
      .update({
        token: crypto.randomUUID(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !webhook) {
      console.error('[Webhook] DB Error:', error)
      throw new AppError('Failed to regenerate webhook token', 500)
    }

    console.log(`[Webhook] Regenerated token for webhook ${id}`)

    res.json(webhook)
  } catch (error) {
    next(error)
  }
}
