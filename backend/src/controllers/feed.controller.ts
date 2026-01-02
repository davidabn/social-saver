import type { Response, NextFunction } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest, PaginatedResponse, FeedItem, MonitoredProfile } from '../types/index.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { AppError } from '../middleware/errorHandler.js'
import { scrapeInstagramProfilePosts } from '../services/apify.service.js'

// Schemas
const addProfileSchema = z.object({
  username: z.string().min(1),
  platform: z.enum(['instagram', 'tiktok']).default('instagram')
})

const listFeedSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  profileId: z.string().uuid().optional()
})

// GET /api/feed/profiles
export async function listProfiles(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) throw new AppError('User not authenticated', 401)

    const { data, error } = await supabaseAdmin
      .from('monitored_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new AppError('Failed to fetch profiles', 500)

    res.json(data)
  } catch (error) {
    next(error)
  }
}

// POST /api/feed/profiles
export async function addProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) throw new AppError('User not authenticated', 401)

    const { username, platform } = addProfileSchema.parse(req.body)

    // Check if already exists
    const { data: existing } = await supabaseAdmin
      .from('monitored_profiles')
      .select('id')
      .eq('user_id', userId)
      .eq('username', username)
      .eq('platform', platform)
      .single()

    if (existing) {
      throw new AppError('Profile already monitored', 409)
    }

    // Initial scrape to validate and get avatar
    // We'll fetch just 1 post to verify existence and get metadata
    const posts = await scrapeInstagramProfilePosts(username, 1)
    
    let avatarUrl: string | null = null
    let fullName: string | null = null

    if (posts.length > 0) {
      avatarUrl = posts[0].author_profile_pic
      fullName = posts[0].author_name
    }

    const { data, error } = await supabaseAdmin
      .from('monitored_profiles')
      .insert({
        user_id: userId,
        username,
        platform,
        avatar_url: avatarUrl,
        full_name: fullName,
        last_checked_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw new AppError('Failed to add profile', 500)

    // If we found posts, insert them into feed
    if (posts.length > 0) {
       await saveFeedItems(userId, data.id, posts)
    }

    res.status(201).json(data)
  } catch (error) {
    next(error)
  }
}

// DELETE /api/feed/profiles/:id
export async function deleteProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) throw new AppError('User not authenticated', 401)

    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('monitored_profiles')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new AppError('Failed to delete profile', 500)

    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

// GET /api/feed
export async function getFeed(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) throw new AppError('User not authenticated', 401)

    const { page, limit, profileId } = listFeedSchema.parse(req.query)
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('feed_items')
      .select(`
        *,
        profile:monitored_profiles(username, avatar_url)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('posted_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (profileId) {
      query = query.eq('profile_id', profileId)
    }

    const { data, count, error } = await query

    if (error) throw new AppError('Failed to fetch feed', 500)

    const response: PaginatedResponse<FeedItem> = {
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

// POST /api/feed/refresh
export async function refreshFeed(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) throw new AppError('User not authenticated', 401)

    // Get all profiles
    const { data: profiles } = await supabaseAdmin
      .from('monitored_profiles')
      .select('*')
      .eq('user_id', userId)

    if (!profiles || profiles.length === 0) {
      res.json({ message: 'No profiles to refresh' })
      return
    }

    // In a real prod app, this should be a background job (BullMQ/Redis)
    // For this personal app, we'll do it inline but maybe limit concurrency
    // Or just do them sequentially to avoid rate limits
    
    const results = []

    for (const profile of profiles) {
      try {
        // Fetch last 5 posts
        const posts = await scrapeInstagramProfilePosts(profile.username, 5)
        if (posts.length > 0) {
          await saveFeedItems(userId, profile.id, posts)
          
          // Update last checked
          await supabaseAdmin
            .from('monitored_profiles')
            .update({ last_checked_at: new Date().toISOString() })
            .eq('id', profile.id)
        }
        results.push({ username: profile.username, status: 'success', newPosts: posts.length })
      } catch (e) {
        console.error(`Failed to refresh ${profile.username}`, e)
        results.push({ username: profile.username, status: 'error' })
      }
    }

    res.json({ results })
  } catch (error) {
    next(error)
  }
}

// Helper to bulk upsert feed items
async function saveFeedItems(userId: string, profileId: string, posts: any[]) {
  const items = posts.map(post => ({
    user_id: userId,
    profile_id: profileId,
    post_id: post.post_id,
    platform: post.platform,
    content_type: post.content_type,
    thumbnail_url: post.thumbnail_url,
    video_url: post.video_url,
    image_urls: post.image_urls,
    carousel_media: post.carousel_media, // Ensure this is JSON stringified if needed, Supabase JS client handles JSONB usually
    caption: post.caption,
    likes_count: post.likes_count,
    comments_count: post.comments_count,
    posted_at: post.posted_at,
    created_at: new Date().toISOString()
  }))

  // Upsert (ignore duplicates based on unique constraint user_id + post_id)
  const { error } = await supabaseAdmin
    .from('feed_items')
    .upsert(items, { onConflict: 'user_id,post_id', ignoreDuplicates: true })

  if (error) {
    console.error('[DB Error] Failed to save feed items', error)
  }
}

// POST /api/feed/:id/save
// Converts a feed item to a saved content (triggering standard workflow)
export async function saveFeedItem(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) throw new AppError('User not authenticated', 401)

    const { id } = req.params // feed item id

    const { data: feedItem, error: fetchError } = await supabaseAdmin
      .from('feed_items')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !feedItem) throw new AppError('Feed item not found', 404)

    // Call the internal create content logic or just duplicate raw
    // We can reuse the `createContent` logic but we already have the data, 
    // so we don't need to scrape again. We just insert into `saved_contents`.

    const { data: savedContent, error: insertError } = await supabaseAdmin
      .from('saved_contents')
      .insert({
        user_id: userId,
        instagram_url: `https://www.instagram.com/p/${feedItem.post_id}`, // Reconstruct URL
        post_id: feedItem.post_id,
        platform: feedItem.platform,
        content_type: feedItem.content_type,
        caption: feedItem.caption,
        thumbnail_url: feedItem.thumbnail_url,
        video_url: feedItem.video_url,
        image_urls: feedItem.image_urls,
        carousel_media: feedItem.carousel_media,
        likes_count: feedItem.likes_count,
        comments_count: feedItem.comments_count,
        posted_at: feedItem.posted_at,
        // Important: We set this as processed since we have data, 
        // BUT we want to trigger transcription if needed.
        // If we set is_processed=true, we might skip scraping, but we need to queue transcription manually.
        is_processed: true, 
        transcription_status: 'pending',
        
        // We need to fill author info. Feed items don't store author info directly in item, 
        // they link to profile. We need to fetch profile info.
      })
      .select()
      .single()

    if (insertError) {
       // If 409 conflict, it's already saved
       if (insertError.code === '23505') {
         throw new AppError('Content already saved', 409)
       }
       throw insertError
    }

    // Mark feed item as saved
    await supabaseAdmin
      .from('feed_items')
      .update({ is_saved: true })
      .eq('id', id)

    // Fetch profile to get author details for the SavedContent (optional update)
    const { data: profile } = await supabaseAdmin
        .from('monitored_profiles')
        .select('*')
        .eq('id', feedItem.profile_id)
        .single()

    if (profile) {
        await supabaseAdmin
            .from('saved_contents')
            .update({
                author_username: profile.username,
                author_name: profile.full_name,
                author_profile_pic: profile.avatar_url
            })
            .eq('id', savedContent.id)
    }
    
    // Queue Transcription (reuse logic from contents.controller)
    const { queueTranscription } = await import('../services/assemblyai.service.js')
    const { queueImageTranscription } = await import('../services/ocr.service.js')
    
    if (savedContent.video_url) {
        queueTranscription(savedContent.id, savedContent.video_url)
    } else if (savedContent.image_urls) {
        queueImageTranscription(savedContent.id, savedContent.image_urls)
    }

    res.json(savedContent)
  } catch (error) {
    next(error)
  }
}
