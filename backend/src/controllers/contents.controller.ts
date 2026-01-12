import type { Response, NextFunction } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest, PaginatedResponse, SavedContent, ContentWithTranscription } from '../types/index.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { AppError } from '../middleware/errorHandler.js'
import { scrapeInstagramPost, scrapeYouTubeVideo, scrapeTikTokVideo } from '../services/apify.service.js'
import { queueTranscription } from '../services/assemblyai.service.js'
import { queueImageTranscription } from '../services/ocr.service.js'
import { uploadFromUrl } from '../services/cloudinary.service.js'

// Validation schemas
const createContentSchema = z.object({
  instagram_url: z
    .string()
    .url('Invalid URL format')
    .refine(
      (url) => {
        const instagramRegex = /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|reel|reels|tv)\/[\w-]+/i
        const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|shorts\/|live\/|embed\/)?[\w-]+/i
        const tiktokRegex = /^https?:\/\/(www\.)?(tiktok\.com\/)(@[\w.-]+\/video\/[\d]+|v\/[\d]+|t\/[\w]+)/i
        const tiktokRegex2 = /^https?:\/\/(www\.|vm\.|vt\.)?tiktok\.com\//i

        return instagramRegex.test(url) || youtubeRegex.test(url) || tiktokRegex2.test(url)
      },
      { message: 'URL must be a valid Instagram, YouTube, or TikTok link' }
    )
})

const listContentsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  filter: z.enum(['all', 'reel', 'post', 'carousel']).default('all'),
  platform: z.enum(['all', 'instagram', 'youtube', 'tiktok']).default('all'),
  search: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional()
})

// Helper to extract post ID from Instagram URL
function extractPostId(url: string): string {
  const match = url.match(/\/(p|reel|reels|tv)\/([\w-]+)/)
  return match?.[2] ?? ''
}

// Helper to extract YouTube ID
function extractYouTubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/)
  return match?.[1] ?? ''
}

// Helper to extract TikTok ID
function extractTikTokId(url: string): string {
  const match = url.match(/\/video\/(\d+)/)
  if (match) return match[1]

  const digits = url.match(/(\d{15,})/)
  return digits ? digits[0] : url
}

// Helper to upload all media to Cloudinary
async function processMediaUploads(scrapedData: any) {
  console.log('[Content] Processing media uploads to Cloudinary...')

  // Upload thumbnail
  if (scrapedData.thumbnail_url) {
    const newThumbnail = await uploadFromUrl(scrapedData.thumbnail_url, 'social-saver/thumbnails')
    if (newThumbnail) scrapedData.thumbnail_url = newThumbnail
  }

  // Upload video (if exists)
  if (scrapedData.video_url) {
    const newVideo = await uploadFromUrl(scrapedData.video_url, 'social-saver/videos')
    if (newVideo) scrapedData.video_url = newVideo
  }

  // Upload image list
  if (scrapedData.image_urls && scrapedData.image_urls.length > 0) {
    const newImageUrls = await Promise.all(
      scrapedData.image_urls.map((url: string) => uploadFromUrl(url, 'social-saver/posts'))
    )
    // Filter out any failures (nulls) or keep original if upload failed (helper returns original on error? No, returns null or original depending on implementation. Our helper returns original on error now.)
    scrapedData.image_urls = newImageUrls.filter(Boolean)
  }

  // Upload carousel rich media
  if (scrapedData.carousel_media && scrapedData.carousel_media.length > 0) {
    await Promise.all(scrapedData.carousel_media.map(async (media: any) => {
      if (media.url) {
        const folder = media.type === 'video' ? 'social-saver/videos' : 'social-saver/posts'
        const newUrl = await uploadFromUrl(media.url, folder)
        if (newUrl) media.url = newUrl
      }
      if (media.thumbnail) {
        const newThumb = await uploadFromUrl(media.thumbnail, 'social-saver/thumbnails')
        if (newThumb) media.thumbnail = newThumb
      }
    }))
  }

  // Upload Author profile pic
  if (scrapedData.author_profile_pic) {
    const newProfilePic = await uploadFromUrl(scrapedData.author_profile_pic, 'social-saver/profiles')
    if (newProfilePic) scrapedData.author_profile_pic = newProfilePic
  }

  return scrapedData
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

    const { page, limit, filter, platform, search, date_from, date_to } = listContentsSchema.parse(req.query)
    const offset = (page - 1) * limit

    if (search && search.trim()) {
      const searchResults = await searchContents(userId, search.trim(), { page, limit, filter, platform, date_from, date_to })
      res.json(searchResults)
      return
    }

    let query = supabaseAdmin
      .from('saved_contents')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('saved_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (filter !== 'all') {
      query = query.eq('content_type', filter)
    }

    if (platform !== 'all') {
      query = query.eq('platform', platform)
    }

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

async function searchContents(
  userId: string,
  searchTerm: string,
  options: { page: number; limit: number; filter: string; platform: string; date_from?: string; date_to?: string }
): Promise<PaginatedResponse<SavedContent>> {
  const { page, limit, filter, platform, date_from, date_to } = options
  const offset = (page - 1) * limit
  const searchPattern = `%${searchTerm}%`

  const { data: transcriptionMatches } = await supabaseAdmin
    .from('transcriptions')
    .select('content_id')
    .ilike('text', searchPattern)

  const transcriptionContentIds = transcriptionMatches?.map(t => t.content_id) || []

  let query = supabaseAdmin
    .from('saved_contents')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)

  if (transcriptionContentIds.length > 0) {
    query = query.or(`author_username.ilike.${searchPattern},author_name.ilike.${searchPattern},caption.ilike.${searchPattern},id.in.(${transcriptionContentIds.join(',')})`)
  } else {
    query = query.or(`author_username.ilike.${searchPattern},author_name.ilike.${searchPattern},caption.ilike.${searchPattern}`)
  }

  if (filter !== 'all') {
    query = query.eq('content_type', filter)
  }

  if (platform !== 'all') {
    query = query.eq('platform', platform)
  }

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
    const isYouTube = instagram_url.includes('youtube.com') || instagram_url.includes('youtu.be')
    const isTikTok = instagram_url.includes('tiktok.com')

    let postId = ''
    if (isYouTube) {
      postId = extractYouTubeId(instagram_url)
    } else if (isTikTok) {
      postId = extractTikTokId(instagram_url)
    } else {
      postId = extractPostId(instagram_url)
    }

    if (!postId) {
      throw new AppError('Could not extract content ID from URL', 400)
    }

    const { data: existing } = await supabaseAdmin
      .from('saved_contents')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .single()

    if (existing) {
      throw new AppError('Content already saved', 409)
    }

    console.log(`[Content] Scraping ${isYouTube ? 'YouTube' : isTikTok ? 'TikTok' : 'Instagram'} content: ${postId}`)

    let scrapedData;
    if (isYouTube) {
      scrapedData = await scrapeYouTubeVideo(instagram_url)
    } else if (isTikTok) {
      scrapedData = await scrapeTikTokVideo(instagram_url)
      if (scrapedData.post_id && scrapedData.post_id !== postId) {
        postId = scrapedData.post_id
      }
    } else {
      scrapedData = await scrapeInstagramPost(instagram_url)
    }

    // Upload media to Cloudinary (preserve URLs forever)
    // Note: We do this AFTER scraping but BEFORE inserting to DB
    scrapedData = await processMediaUploads(scrapedData)

    const hasVideo = !!scrapedData.video_url
    const hasImages = scrapedData.image_urls && scrapedData.image_urls.length > 0
    const needsTranscription = hasVideo || hasImages

    const { data: content, error } = await supabaseAdmin
      .from('saved_contents')
      .insert({
        user_id: userId,
        instagram_url,
        post_id: scrapedData.post_id || postId,
        platform: scrapedData.platform,
        content_type: scrapedData.content_type,
        author_username: scrapedData.author_username,
        author_name: scrapedData.author_name,
        author_profile_pic: scrapedData.author_profile_pic,
        author_verified: scrapedData.author_verified,
        caption: scrapedData.caption,
        thumbnail_url: scrapedData.thumbnail_url,
        video_url: scrapedData.video_url,
        image_urls: scrapedData.image_urls,
        carousel_media: scrapedData.carousel_media,
        likes_count: scrapedData.likes_count,
        comments_count: scrapedData.comments_count,
        views_count: scrapedData.views_count,
        plays_count: scrapedData.plays_count,
        posted_at: scrapedData.posted_at,
        is_processed: true,
        transcription_status: needsTranscription ? 'pending' : 'completed'
      })
      .select()
      .single()

    if (error) {
      console.error('[DB Error]', error)
      throw new AppError('Failed to save content', 500)
    }

    console.log(`[Content] Created content ${content.id} for user ${userId}`)

    let transcriptionSaved = false

    // YOUTUBE: Use transcription from scraper if available
    if (isYouTube && (scrapedData as any).transcription) {
      const textToSave = (scrapedData as any).transcription || scrapedData.caption

      if (textToSave) {
        console.log(`[Content] Saving YouTube text content for ${content.id} (${textToSave.length} chars)`)
        await supabaseAdmin
          .from('transcriptions')
          .upsert({
            content_id: content.id,
            text: textToSave,
            language: 'auto',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        transcriptionSaved = true

        await supabaseAdmin
          .from('saved_contents')
          .update({
            transcription_status: 'completed',
            is_processed: true
          })
          .eq('id', content.id)
      }
    }

    if (!transcriptionSaved) {
      // INSTAGRAM/TIKTOK (or YouTube fallback): Use AI Transcription
      if (hasVideo) {
        console.log(`[Content] Queueing video transcription for content ${content.id}`)
        // Note: For Cloudinary video URLs, AssemblyAI works great because they are public and stable
        queueTranscription(content.id, scrapedData.video_url!)
      } else if (hasImages && scrapedData.image_urls) {
        console.log(`[Content] Queueing image transcription for content ${content.id}`)
        queueImageTranscription(content.id, scrapedData.image_urls)
      }
    }

    res.status(201).json(content)
  } catch (error) {
    next(error)
  }
}

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
