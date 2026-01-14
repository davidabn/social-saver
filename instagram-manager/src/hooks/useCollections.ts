import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Collection, CollectionWithCount, SavedContent, PaginatedResponse } from '@/types'

import { API_URL } from '@/config'

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  }
}

// Fetch all collections
async function fetchCollections(page = 1, limit = 50): Promise<PaginatedResponse<CollectionWithCount>> {
  const headers = await getAuthHeaders()
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
  const response = await fetch(`${API_URL}/collections?${params}`, { headers })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch collections')
  }

  return response.json()
}

// Fetch single collection with contents
interface CollectionDetailResponse {
  collection: Collection
  contents: PaginatedResponse<SavedContent>
}

async function fetchCollection(
  id: string,
  page = 1,
  limit = 20,
  filter?: string
): Promise<CollectionDetailResponse> {
  const headers = await getAuthHeaders()
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
  if (filter && filter !== 'all') params.append('filter', filter)

  const response = await fetch(`${API_URL}/collections/${id}?${params}`, { headers })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch collection')
  }

  return response.json()
}

// Create collection
async function createCollection(data: { name: string; description?: string }): Promise<Collection> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/collections`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create collection')
  }

  return response.json()
}

// Update collection
async function updateCollection(
  id: string,
  data: { name?: string; description?: string | null; cover_image_url?: string | null }
): Promise<Collection> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/collections/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update collection')
  }

  return response.json()
}

// Delete collection
async function deleteCollection(id: string): Promise<void> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/collections/${id}`, {
    method: 'DELETE',
    headers
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to delete collection')
  }
}

// Update content's collection
async function updateContentCollection(contentId: string, collectionId: string | null): Promise<SavedContent> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/contents/${contentId}/collection`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ collection_id: collectionId })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update content collection')
  }

  return response.json()
}

// Hooks
export function useCollections(page = 1) {
  return useQuery({
    queryKey: ['collections', page],
    queryFn: () => fetchCollections(page)
  })
}

export function useCollection(id: string | null, page = 1, filter?: string) {
  return useQuery({
    queryKey: ['collection', id, page, filter],
    queryFn: () => fetchCollection(id!, page, 20, filter),
    enabled: !!id
  })
}

export function useCreateCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    }
  })
}

export function useUpdateCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; description?: string | null; cover_image_url?: string | null }) =>
      updateCollection(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      queryClient.invalidateQueries({ queryKey: ['collection', variables.id] })
    }
  })
}

export function useDeleteCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    }
  })
}

export function useUpdateContentCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ contentId, collectionId }: { contentId: string; collectionId: string | null }) =>
      updateContentCollection(contentId, collectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      queryClient.invalidateQueries({ queryKey: ['collection'] })
    }
  })
}
