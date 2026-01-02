import type { Response, NextFunction } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest, PaginatedResponse, Collection, CollectionWithCount, SavedContent } from '../types/index.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { AppError } from '../middleware/errorHandler.js'

// Validation schemas
const createCollectionSchema = z.object({
  name: z.string().min(1, 'Collection name is required').max(100),
  description: z.string().max(500).optional()
})

const updateCollectionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  cover_image_url: z.string().url().optional().nullable()
})

const listCollectionsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50)
})

const listCollectionContentsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  filter: z.enum(['all', 'reel', 'post', 'carousel']).default('all')
})

const updateContentCollectionSchema = z.object({
  collection_id: z.string().uuid().nullable()
})

// GET /api/collections
export async function listCollections(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) throw new AppError('User not authenticated', 401)

    const { page, limit } = listCollectionsSchema.parse(req.query)
    const offset = (page - 1) * limit

    // Fetch collections
    const { data: collections, error, count } = await supabaseAdmin
      .from('collections')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw new AppError('Failed to fetch collections', 500)

    // Get content counts for each collection
    const collectionsWithCounts: CollectionWithCount[] = []

    for (const collection of collections ?? []) {
      const { count: contentCount } = await supabaseAdmin
        .from('saved_contents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('collection_id', collection.id)

      collectionsWithCounts.push({
        ...collection,
        content_count: contentCount ?? 0
      })
    }

    const response: PaginatedResponse<CollectionWithCount> = {
      data: collectionsWithCounts,
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

// GET /api/collections/:id
export async function getCollection(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) throw new AppError('User not authenticated', 401)

    const { id } = req.params
    const { page, limit, filter } = listCollectionContentsSchema.parse(req.query)
    const offset = (page - 1) * limit

    // Fetch collection
    const { data: collection, error: collectionError } = await supabaseAdmin
      .from('collections')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (collectionError || !collection) {
      throw new AppError('Collection not found', 404)
    }

    // Fetch contents in collection
    let query = supabaseAdmin
      .from('saved_contents')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('collection_id', id)
      .order('saved_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (filter !== 'all') {
      query = query.eq('content_type', filter)
    }

    const { data: contents, error: contentsError, count } = await query

    if (contentsError) throw new AppError('Failed to fetch collection contents', 500)

    res.json({
      collection,
      contents: {
        data: contents ?? [],
        pagination: {
          page,
          limit,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / limit)
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

// POST /api/collections
export async function createCollection(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) throw new AppError('User not authenticated', 401)

    const { name, description } = createCollectionSchema.parse(req.body)

    const { data, error } = await supabaseAdmin
      .from('collections')
      .insert({
        user_id: userId,
        name,
        description: description || null
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new AppError('A collection with this name already exists', 409)
      }
      console.error('[DB Error]', error)
      throw new AppError('Failed to create collection', 500)
    }

    console.log(`[Collection] Created collection ${data.id} for user ${userId}`)

    res.status(201).json(data)
  } catch (error) {
    next(error)
  }
}

// PUT /api/collections/:id
export async function updateCollection(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) throw new AppError('User not authenticated', 401)

    const { id } = req.params
    const updates = updateCollectionSchema.parse(req.body)

    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    )

    if (Object.keys(cleanUpdates).length === 0) {
      throw new AppError('No valid updates provided', 400)
    }

    const { data, error } = await supabaseAdmin
      .from('collections')
      .update(cleanUpdates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new AppError('A collection with this name already exists', 409)
      }
      throw new AppError('Collection not found or update failed', 404)
    }

    if (!data) {
      throw new AppError('Collection not found', 404)
    }

    console.log(`[Collection] Updated collection ${id} for user ${userId}`)

    res.json(data)
  } catch (error) {
    next(error)
  }
}

// DELETE /api/collections/:id
export async function deleteCollection(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) throw new AppError('User not authenticated', 401)

    const { id } = req.params

    // Verify collection exists and belongs to user
    const { data: existing } = await supabaseAdmin
      .from('collections')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (!existing) {
      throw new AppError('Collection not found', 404)
    }

    const { error } = await supabaseAdmin
      .from('collections')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('[DB Error]', error)
      throw new AppError('Failed to delete collection', 500)
    }

    console.log(`[Collection] Deleted collection ${id} for user ${userId}`)

    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

// PUT /api/contents/:id/collection - Move content to collection
export async function updateContentCollection(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) throw new AppError('User not authenticated', 401)

    const { id } = req.params
    const { collection_id } = updateContentCollectionSchema.parse(req.body)

    // If collection_id provided, verify it belongs to user
    if (collection_id) {
      const { data: collection } = await supabaseAdmin
        .from('collections')
        .select('id')
        .eq('id', collection_id)
        .eq('user_id', userId)
        .single()

      if (!collection) {
        throw new AppError('Collection not found', 404)
      }
    }

    const { data, error } = await supabaseAdmin
      .from('saved_contents')
      .update({ collection_id })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !data) {
      throw new AppError('Content not found or update failed', 404)
    }

    console.log(`[Content] Updated content ${id} collection to ${collection_id} for user ${userId}`)

    res.json(data)
  } catch (error) {
    next(error)
  }
}
