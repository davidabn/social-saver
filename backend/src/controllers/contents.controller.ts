import type { Response, NextFunction } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest, PaginatedResponse, SavedContent, ContentWithTranscription } from '../types/index.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { AppError } from '../middleware/errorHandler.js'
import { scrapeInstagramPost } from '../services/apify.service.js'
import { queueTranscription } from '../services/assemblyai.service.js'

// Validation schemas
const createContentSchema = z.object({
  instagram_url: z
    .string()
    .url('Invalid URL format')
    .refine(
      (url) => {
        const instagramRegex = /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|reel|reels|tv)\/[\w-]+/i
        return instagramRegex.test(url)
      },
      { message: 'URL must be a valid Instagram post, reel, or TV link' }
    )
})

const listContentsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  filter: z.enum(['all', 'reel', 'post', 'carousel']).default('all'),
  search: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional()
})

// Helper to extract post ID from Instagram URL
function extractPostId(url: string): string {
  const match = url.match(/\/(p|reel|reels|tv)\/([\w-]+)/)
  return match?.[2] ?? ''
}

// GET /api/contents
export async function listContents(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { page, limit, filter, search, date_from, date_to } = listContentsSchema.parse(req.query)
    const offset = (page - 1) * limit

    // If search is provided, use the search function
    if (search && search.trim()) {
      const searchResults = await searchContents(userId, search.trim(), { page, limit, filter, date_from, date_to })
      res.json(searchResults)
      return
    }

    // Build query
    let query = supabaseAdmin
      .from('saved_contents')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('saved_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (filter !== 'all') {
      query = query.eq('content_type', filter)
    }

    // Date filters
    if (date_from) {
      query = query.gte('saved_at', date_from)
    }
    if (date_to) {
      query = query.lte('saved_at', date_to + 'T23:59:59.999Z')
    }

    const { data, error, count } = await query

    if (error) {
      console.error('[DB Error]', error)
      throw new AppError('Failed to fetch contents', 500)
    }

    const response: PaginatedResponse<SavedContent> = {
      data: data ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit)
      }
    }

    res.json(response)
  } catch (error) {
    next(error)
  }
}

// Search contents by author, caption, or transcription
async function searchContents(
  userId: string,
  searchTerm: string,
  options: { page: number; limit: number; filter: string; date_from?: string; date_to?: string }
): Promise<PaginatedResponse<SavedContent>> {
  const { page, limit, filter, date_from, date_to } = options
  const offset = (page - 1) * limit
  const searchPattern = `%${searchTerm}%`

  // First, get content IDs that match in transcriptions
  const { data: transcriptionMatches } = await supabaseAdmin
    .from('transcriptions')
    .select('content_id')
    .ilike('text', searchPattern)

  const transcriptionContentIds = transcriptionMatches?.map(t => t.content_id) || []

  // Build the main query with OR conditions
  let query = supabaseAdmin
    .from('saved_contents')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)

  // Search in author_username, author_name, or caption, or matching transcription
  if (transcriptionContentIds.length > 0) {
    query = query.or(`author_username.ilike.${searchPattern},author_name.ilike.${searchPattern},caption.ilike.${searchPattern},id.in.(${transcriptionContentIds.join(',')})`)
  } else {
    query = query.or(`author_username.ilike.${searchPattern},author_name.ilike.${searchPattern},caption.ilike.${searchPattern}`)
  }

  if (filter !== 'all') {
    query = query.eq('content_type', filter)
  }

  // Date filters
  if (date_from) {
    query = query.gte('saved_at', date_from)
  }
  if (date_to) {
    query = query.lte('saved_at', date_to + 'T23:59:59.999Z')
  }

  query = query
    .order('saved_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('[DB Error] Search failed:', error)
    throw new AppError('Failed to search contents', 500)
  }

  return {
    data: data ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit)
    }
  }
}

// GET /api/contents/:id
export async function getContent(
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

    // Fetch content with transcription
    const { data: content, error } = await supabaseAdmin
      .from('saved_contents')
      .select(`
        *,
        transcription:transcriptions(*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !content) {
      throw new AppError('Content not found', 404)
    }

    const response: ContentWithTranscription = {
      ...content,
      transcription: Array.isArray(content.transcription)
        ? content.transcription[0] ?? null
        : content.transcription
    }

    res.json(response)
  } catch (error) {
    next(error)
  }
}

// POST /api/contents
export async function createContent(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { instagram_url } = createContentSchema.parse(req.body)
    const postId = extractPostId(instagram_url)

    if (!postId) {
      throw new AppError('Could not extract post ID from URL', 400)
    }

    // Check if content already exists for this user
    const { data: existing } = await supabaseAdmin
      .from('saved_contents')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .single()

    if (existing) {
      throw new AppError('Content already saved', 409)
    }

    console.log(`[Content] Scraping Instagram post: ${postId}`)

    // Scrape Instagram post data using Apify
    const scrapedData = await scrapeInstagramPost(instagram_url)

    // Create new content with scraped data
    const { data: content, error } = await supabaseAdmin
      .from('saved_contents')
      .insert({
        user_id: userId,
        instagram_url,
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

    if (error) {
      console.error('[DB Error]', error)
      throw new AppError('Failed to save content', 500)
    }

    console.log(`[Content] Created content ${content.id} for user ${userId}`)

    // Queue transcription for videos in background
    if (scrapedData.video_url) {
      console.log(`[Content] Queueing transcription for content ${content.id}`)
      queueTranscription(content.id, scrapedData.video_url)
    }

    res.status(201).json(content)
  } catch (error) {
    next(error)
  }
}

// DELETE /api/contents/:id
export async function deleteContent(
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
      .from('saved_contents')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('[DB Error]', error)
      throw new AppError('Failed to delete content', 500)
    }

    console.log(`[Content] Deleted content ${id} for user ${userId}`)

    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
